/**
 * Cycle Summary Service
 * Gathers per-brand CSAT/NPS data for a cycle and generates
 * AI-powered summaries via OpenRouter (openai/gpt-5.4).
 * Supports both streaming (SSE) and non-streaming responses.
 */

import { Cycle, CSATResponse } from '../../models/index.js';
import { getBrandAggregation } from '../dashboard/dashboard.service.js';
import { buildCycleSummarySystemPrompt } from '../../prompts/cycleSummary.prompt.js';
import { isV2Response } from '../dashboard/helper.js';
import logger from '#config/logger.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-5.4';

/** Keys inside v2 data that are not service entries */
const DATA_ROOT_SKIP_KEYS = new Set([
  'servicesCovered',
  'formVersion',
  'filledAt',
  'version',
]);

/**
 * Extract all comments from a single CSAT response.
 * Returns an object with the main comment and per-service comments.
 * @param {Object} response - Lean CSATResponse document
 * @returns {Object} { main?: string, services?: Record<string, string> }
 */
const extractComments = response => {
  const result = {};

  // Top-level comment field
  if (response.comment && response.comment.trim()) {
    result.main = response.comment.trim();
  }

  // Per-service comments inside data (v2 responses)
  if (response.data && isV2Response(response.data, response.version)) {
    const serviceComments = {};
    for (const [key, value] of Object.entries(response.data)) {
      if (DATA_ROOT_SKIP_KEYS.has(key)) continue;
      if (value && typeof value === 'object' && value.comment && value.comment.trim()) {
        serviceComments[key] = value.comment.trim();
      }
    }
    if (Object.keys(serviceComments).length > 0) {
      result.services = serviceComments;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
};

/**
 * Fetch comments for all responses in a cycle, grouped by brandId.
 * @param {string} cycleId
 * @param {string[]} sbuIds - Optional SBU filter
 * @returns {Promise<Map<string, Array>>} Map of brandId → array of comment objects
 */
const fetchCommentsByBrand = async (cycleId, sbuIds = []) => {
  const filter = { cycleId, isValid: true };
  if (Array.isArray(sbuIds) && sbuIds.length > 0) {
    filter.sbuId = { $in: sbuIds };
  }

  const responses = await CSATResponse.find(filter)
    .select('brandId comment data version')
    .lean();

  const commentsByBrand = new Map();

  for (const response of responses) {
    const brandId = String(response.brandId);
    const comments = extractComments(response);
    if (!comments) continue;

    if (!commentsByBrand.has(brandId)) {
      commentsByBrand.set(brandId, []);
    }
    commentsByBrand.get(brandId).push(comments);
  }

  return commentsByBrand;
};

/**
 * Fetch cycle info and brand aggregation data for a given cycle.
 * @param {string} cycleId
 * @param {Object} options - { sbuIds: string[] }
 * @returns {Promise<{ cycle: Object, brandData: Array, systemPrompt: string, userMessage: string }>}
 */
const gatherCycleData = async (cycleId, options = {}) => {
  logger.info('[CycleSummary] gatherData:started', { cycleId });

  const cycle = await Cycle.findById(cycleId).lean();
  if (!cycle) {
    logger.warn('[CycleSummary] gatherData:failed — cycle not found', { cycleId });
    const error = new Error('Cycle not found');
    error.statusCode = 404;
    throw error;
  }

  logger.info('[CycleSummary] gatherData:cycleFound', {
    cycleId,
    cycleName: cycle.name,
    cycleStatus: cycle.status,
  });

  const aggParams = { cycleId };
  if (Array.isArray(options.sbuIds) && options.sbuIds.length) {
    aggParams.sbuIds = options.sbuIds;
  }
  aggParams.limit = 200;

  logger.info('[CycleSummary] gatherData:fetchingAggregation', {
    cycleId,
    sbuFilter: aggParams.sbuIds?.length || 0,
  });

  // Fetch brand aggregation and comments in parallel
  const [brandData, commentsByBrand] = await Promise.all([
    getBrandAggregation(aggParams),
    fetchCommentsByBrand(cycleId, options.sbuIds),
  ]);

  logger.info('[CycleSummary] gatherData:completed', {
    cycleId,
    brandCount: brandData.length,
    brandsWithComments: commentsByBrand.size,
  });

  const cycleInfo = {
    cycleId: cycle._id,
    name: cycle.name,
    cycleNumber: cycle.cycleNumber,
    year: cycle.year,
    status: cycle.status,
  };

  const systemPrompt = buildCycleSummarySystemPrompt(cycleInfo);

  const userMessage = JSON.stringify({
    cycleInfo,
    totalBrands: brandData.length,
    brands: brandData.map(b => ({
      brandName: b.brandName,
      avgCSAT: b.avgSatisfaction,
      avgNPS: b.avgNPS,
      totalResponses: b.totalResponses,
      pocCount: b.pocCount,
      classification: b.classification,
      comments: commentsByBrand.get(String(b.brandId)) || [],
    })),
  });

  return { cycle: cycleInfo, brandData, systemPrompt, userMessage };
};

/**
 * Parse the brands-needing-attention JSON block from LLM output.
 * Looks for a fenced ```json ... ``` block and parses the array.
 * @param {string} text - Full LLM response text
 * @returns {Array} Parsed array or empty array on failure
 */
const parseBrandsNeedingAttention = text => {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) return parsed;
    }

    // Fallback: try to find a JSON array directly
    const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    logger.warn('Failed to parse brandsNeedingAttention from LLM output', {
      error: err.message,
    });
  }
  return [];
};

/**
 * Generate a non-streaming cycle summary.
 * @param {string} cycleId
 * @param {Object} options - { sbuIds: string[] }
 * @returns {Promise<{ cycleInfo: Object, summary: string, brandsNeedingAttention: Array, brandAggregation: Array }>}
 */
export const generateCycleSummary = async (cycleId, options = {}) => {
  const serviceStart = Date.now();

  logger.info('[CycleSummary] service:started', { cycleId, sbuIds: options.sbuIds?.length || 0 });

  if (!process.env.OPENROUTER_API_KEY) {
    logger.error('[CycleSummary] service:failed — OPENROUTER_API_KEY not configured');
    const error = new Error('OpenRouter API key not configured');
    error.statusCode = 500;
    throw error;
  }

  logger.info('[CycleSummary] gatherData:calling', { cycleId });
  const { cycle, brandData, systemPrompt, userMessage } = await gatherCycleData(
    cycleId,
    options
  );
  logger.info('[CycleSummary] gatherData:returned', {
    cycleId,
    brandCount: brandData.length,
    durationMs: Date.now() - serviceStart,
  });

  if (brandData.length === 0) {
    logger.info('[CycleSummary] service:completed — no brand data, skipping LLM', {
      cycleId,
      durationMs: Date.now() - serviceStart,
    });
    return {
      cycleInfo: cycle,
      summary: 'No CSAT response data available for this cycle to generate a summary.',
      brandsNeedingAttention: [],
      brandAggregation: [],
    };
  }

  const MAX_RETRIES = 2;
  let summaryText = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const llmStart = Date.now();
    logger.info('[CycleSummary] llmCall:started', {
      cycleId,
      attempt,
      model: MODEL,
      promptLength: userMessage.length,
    });

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    logger.info('[CycleSummary] llmCall:responseReceived', {
      cycleId,
      attempt,
      httpStatus: response.status,
      durationMs: Date.now() - llmStart,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('[CycleSummary] llmCall:httpError', {
        cycleId,
        attempt,
        status: response.status,
        body: errorBody,
        durationMs: Date.now() - llmStart,
      });
      if (attempt < MAX_RETRIES) {
        logger.info(`[CycleSummary] llmCall:retrying (attempt ${attempt + 1}/${MAX_RETRIES})`, { cycleId });
        continue;
      }
      const error = new Error('AI summary generation failed');
      error.statusCode = 502;
      throw error;
    }

    const result = await response.json();

    logger.info('[CycleSummary] llmCall:parsed', {
      cycleId,
      attempt,
      hasChoices: !!result.choices,
      choicesLength: result.choices?.length,
      finishReason: result.choices?.[0]?.finish_reason,
      model: result.model,
      hasError: !!result.error,
      usage: result.usage,
      durationMs: Date.now() - llmStart,
    });

    // OpenRouter may return a 200 with an error payload
    if (result.error) {
      logger.error('[CycleSummary] llmCall:apiError', {
        cycleId,
        attempt,
        error: result.error,
        durationMs: Date.now() - llmStart,
      });
      if (attempt < MAX_RETRIES) {
        logger.info(`[CycleSummary] llmCall:retrying (attempt ${attempt + 1}/${MAX_RETRIES})`, { cycleId });
        continue;
      }
      const error = new Error(
        `AI summary generation failed: ${result.error?.message || JSON.stringify(result.error)}`
      );
      error.statusCode = 502;
      throw error;
    }

    summaryText = result.choices?.[0]?.message?.content || '';

    if (summaryText) {
      logger.info('[CycleSummary] llmCall:success', {
        cycleId,
        attempt,
        summaryLength: summaryText.length,
        durationMs: Date.now() - llmStart,
      });
      break;
    }

    logger.warn('[CycleSummary] llmCall:emptyContent', {
      cycleId,
      attempt,
      fullResponse: JSON.stringify(result).slice(0, 1000),
      durationMs: Date.now() - llmStart,
    });

    if (attempt < MAX_RETRIES) {
      logger.info(`[CycleSummary] llmCall:retrying — empty content (attempt ${attempt + 1}/${MAX_RETRIES})`, { cycleId });
    }
  }

  if (!summaryText) {
    logger.error('[CycleSummary] service:failed — empty content after all retries', {
      cycleId,
      durationMs: Date.now() - serviceStart,
    });
    const error = new Error('AI summary generation failed: LLM returned empty content after retries');
    error.statusCode = 502;
    throw error;
  }

  logger.info('[CycleSummary] parsing:brandsNeedingAttention', { cycleId });
  const brandsNeedingAttention = parseBrandsNeedingAttention(summaryText);
  logger.info('[CycleSummary] parsing:completed', {
    cycleId,
    brandsNeedingAttention: brandsNeedingAttention.length,
  });

  logger.info('[CycleSummary] service:completed', {
    cycleId,
    summaryLength: summaryText.length,
    brandsNeedingAttention: brandsNeedingAttention.length,
    brandAggregationCount: brandData.length,
    durationMs: Date.now() - serviceStart,
  });

  return {
    cycleInfo: cycle,
    summary: summaryText,
    brandsNeedingAttention,
    brandAggregation: brandData,
  };
};

/**
 * Stream a cycle summary via SSE.
 * Writes events to the Express response object.
 * @param {string} cycleId
 * @param {Object} options - { sbuIds: string[] }
 * @param {import('express').Response} res - Express response (SSE)
 */
export const streamCycleSummary = async (cycleId, options = {}, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    res.write(
      `data: ${JSON.stringify({ type: 'error', message: 'OpenRouter API key not configured' })}\n\n`
    );
    res.end();
    return;
  }

  const abortController = new AbortController();
  const onClose = () => abortController.abort();
  res.req.on('close', onClose);

  try {
    const { cycle, brandData, systemPrompt, userMessage } = await gatherCycleData(
      cycleId,
      options
    );

    // Send metadata event
    res.write(
      `data: ${JSON.stringify({ type: 'meta', cycleInfo: cycle, totalBrands: brandData.length })}\n\n`
    );

    if (brandData.length === 0) {
      res.write(
        `data: ${JSON.stringify({ type: 'chunk', content: 'No CSAT response data available for this cycle to generate a summary.' })}\n\n`
      );
      res.write(
        `data: ${JSON.stringify({ type: 'done', brandsNeedingAttention: [], brandAggregation: [] })}\n\n`
      );
      res.end();
      return;
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        stream: true,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('OpenRouter API streaming error', {
        status: response.status,
        body: errorBody,
      });
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: 'AI summary generation failed' })}\n\n`
      );
      res.end();
      return;
    }

    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            res.write(
              `data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`
            );
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    // Parse brands needing attention from accumulated text
    const brandsNeedingAttention = parseBrandsNeedingAttention(fullText);

    // Send final done event
    res.write(
      `data: ${JSON.stringify({ type: 'done', brandsNeedingAttention, brandAggregation: brandData })}\n\n`
    );
    res.end();
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.info('Cycle summary stream aborted by client disconnect');
      return;
    }
    logger.error('Error streaming cycle summary', {
      error: err.message,
      stack: err.stack,
    });
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`
      );
      res.end();
    }
  } finally {
    res.req.removeListener('close', onClose);
  }
};
