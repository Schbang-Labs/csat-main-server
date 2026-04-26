/**
 * Cycle Summary Service
 * Gathers per-brand CSAT/NPS data for a cycle and generates
 * AI-powered summaries via OpenRouter (openai/gpt-5.4).
 * Supports both streaming (SSE) and non-streaming responses.
 */
/* global fetch, AbortController, TextDecoder */

import { Cycle, CSATResponse, CycleSummary } from '../../models/index.js';
import { getBrandAggregation } from '../dashboard/dashboard.service.js';
import { buildCycleSummarySystemPrompt } from '../../prompts/cycleSummary.prompt.js';
import { isV2Response } from '../dashboard/helper.js';
import { generateCycleSummaryPdfBuffer } from '../../utils/cycleSummaryPdf.util.js';
import logger from '#config/logger.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-5.4';
const NO_DATA_SUMMARY =
  'No CSAT response data available for this cycle to generate a summary.';
const JSON_BLOCK_REGEX = /```json\s*([\s\S]*?)```/i;
const RECOMMENDATIONS_HEADING_REGEX =
  /(?:^|\n)\s*(?:#{1,6}\s*)?actionable recommendations:?/i;

/** Keys inside v2 data that are not service entries */
const DATA_ROOT_SKIP_KEYS = new Set([
  'servicesCovered',
  'formVersion',
  'filledAt',
  'version',
]);

const normalizeLineBreaks = text => String(text || '').replace(/\r\n/g, '\n');

const toStringArray = value => {
  if (!Array.isArray(value)) return [];
  return value.map(item => String(item).trim()).filter(Boolean);
};

const trimJsonCodeBlock = text => normalizeLineBreaks(text).replace(JSON_BLOCK_REGEX, '').trim();

const extractExecutiveSummary = text => {
  const content = trimJsonCodeBlock(text);
  if (!content) return '';

  const headingMatch = content.match(RECOMMENDATIONS_HEADING_REGEX);
  if (!headingMatch) return content.trim();

  const executive = content.slice(0, headingMatch.index).trim();
  return executive || content.trim();
};

const extractRecommendations = text => {
  const content = trimJsonCodeBlock(text);
  if (!content) return [];

  const headingMatch = content.match(RECOMMENDATIONS_HEADING_REGEX);
  const recommendationsSource = headingMatch
    ? content.slice(headingMatch.index + headingMatch[0].length)
    : content;

  const recommendations = [];
  for (const rawLine of recommendationsSource.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const bulletMatch = line.match(/^(?:[-*]|\u2022|\d+\.)\s+(.+)$/);
    if (bulletMatch?.[1]) {
      recommendations.push(bulletMatch[1].trim());
    }
  }

  return recommendations;
};

/**
 * Extract all comments from a single CSAT response.
 * Returns an object with the main comment and per-service comments.
 * @param {Object} response - Lean CSATResponse document
 * @returns {Object} { main?: string, services?: Record<string, string> }
 */
const extractComments = response => {
  const result = {};

  if (response.comment && response.comment.trim()) {
    result.main = response.comment.trim();
  }

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
export const parseBrandsNeedingAttention = text => {
  try {
    const normalized = normalizeLineBreaks(text);
    const fencedMatch = normalized.match(JSON_BLOCK_REGEX);
    if (fencedMatch?.[1]) {
      const parsed = JSON.parse(fencedMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
    }

    const arrayMatch = normalized.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (arrayMatch?.[0]) {
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

export const normalizeSummaryPayload = ({
  cycleInfo,
  summaryText,
  brandAggregation = [],
}) => {
  const summary = String(summaryText || '').trim() || NO_DATA_SUMMARY;
  const brandsNeedingAttention = parseBrandsNeedingAttention(summary);
  const executiveSummary = extractExecutiveSummary(summary) || summary;
  const recommendations = extractRecommendations(summary);

  return {
    cycleInfo,
    summary,
    executiveSummary,
    recommendations,
    brandsNeedingAttention,
    brandAggregation: Array.isArray(brandAggregation) ? brandAggregation : [],
  };
};

const requestSummaryFromLlm = async ({
  cycleId,
  systemPrompt,
  userMessage,
  stream = false,
  signal,
}) => {
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
      ...(stream ? { stream: true } : {}),
    }),
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('[CycleSummary] llmCall:httpError', {
      cycleId,
      status: response.status,
      body: errorBody,
      stream,
    });
    const error = new Error('AI summary generation failed');
    error.statusCode = 502;
    throw error;
  }

  return response;
};

/**
 * Generate a non-streaming cycle summary.
 * @param {string} cycleId
 * @param {Object} options - { sbuIds: string[] }
 * @returns {Promise<{ cycleInfo: Object, summary: string, executiveSummary: string, recommendations: Array, brandsNeedingAttention: Array, brandAggregation: Array }>}
 */
export const generateCycleSummary = async (cycleId, options = {}) => {
  const serviceStart = Date.now();

  logger.info('[CycleSummary] service:started', {
    cycleId,
    sbuIds: options.sbuIds?.length || 0,
  });

  if (!process.env.OPENROUTER_API_KEY) {
    logger.error('[CycleSummary] service:failed — OPENROUTER_API_KEY not configured');
    const error = new Error('OpenRouter API key not configured');
    error.statusCode = 500;
    throw error;
  }

  const { cycle, brandData, systemPrompt, userMessage } = await gatherCycleData(
    cycleId,
    options
  );

  if (brandData.length === 0) {
    logger.info('[CycleSummary] service:completed — no brand data, skipping LLM', {
      cycleId,
      durationMs: Date.now() - serviceStart,
    });
    return normalizeSummaryPayload({
      cycleInfo: cycle,
      summaryText: NO_DATA_SUMMARY,
      brandAggregation: [],
    });
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

    const response = await requestSummaryFromLlm({
      cycleId,
      systemPrompt,
      userMessage,
    });
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

    if (result.error) {
      logger.error('[CycleSummary] llmCall:apiError', {
        cycleId,
        attempt,
        error: result.error,
        durationMs: Date.now() - llmStart,
      });
      if (attempt < MAX_RETRIES) continue;
      const error = new Error(
        `AI summary generation failed: ${result.error?.message || JSON.stringify(result.error)}`
      );
      error.statusCode = 502;
      throw error;
    }

    summaryText = result.choices?.[0]?.message?.content || '';
    if (summaryText) break;

    logger.warn('[CycleSummary] llmCall:emptyContent', {
      cycleId,
      attempt,
      durationMs: Date.now() - llmStart,
    });
  }

  if (!summaryText) {
    logger.error('[CycleSummary] service:failed — empty content after all retries', {
      cycleId,
      durationMs: Date.now() - serviceStart,
    });
    const error = new Error(
      'AI summary generation failed: LLM returned empty content after retries'
    );
    error.statusCode = 502;
    throw error;
  }

  const normalizedPayload = normalizeSummaryPayload({
    cycleInfo: cycle,
    summaryText,
    brandAggregation: brandData,
  });

  logger.info('[CycleSummary] service:completed', {
    cycleId,
    summaryLength: normalizedPayload.summary.length,
    brandsNeedingAttention: normalizedPayload.brandsNeedingAttention.length,
    brandAggregationCount: normalizedPayload.brandAggregation.length,
    durationMs: Date.now() - serviceStart,
  });

  return normalizedPayload;
};

/**
 * Stream a cycle summary via SSE.
 * Writes meta/chunk events and returns the final normalized summary payload.
 * @param {string} cycleId
 * @param {Object} options - { sbuIds: string[] }
 * @param {import('express').Response} res - Express response (SSE)
 * @returns {Promise<Object|null>}
 */
export const streamCycleSummary = async (cycleId, options = {}, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    const error = new Error('OpenRouter API key not configured');
    error.statusCode = 500;
    throw error;
  }

  const abortController = new AbortController();
  const onClose = () => abortController.abort();
  res.req.on('close', onClose);

  try {
    const { cycle, brandData, systemPrompt, userMessage } = await gatherCycleData(
      cycleId,
      options
    );

    res.write(
      `data: ${JSON.stringify({ type: 'meta', cycleInfo: cycle, totalBrands: brandData.length })}\n\n`
    );

    if (brandData.length === 0) {
      res.write(
        `data: ${JSON.stringify({ type: 'chunk', content: NO_DATA_SUMMARY })}\n\n`
      );
      return normalizeSummaryPayload({
        cycleInfo: cycle,
        summaryText: NO_DATA_SUMMARY,
        brandAggregation: [],
      });
    }

    const response = await requestSummaryFromLlm({
      cycleId,
      systemPrompt,
      userMessage,
      stream: true,
      signal: abortController.signal,
    });

    if (!response.body) {
      const error = new Error('AI summary generation failed');
      error.statusCode = 502;
      throw error;
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
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (!delta) continue;

          fullText += delta;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
        } catch {
          // Skip malformed chunks
        }
      }
    }

    return normalizeSummaryPayload({
      cycleInfo: cycle,
      summaryText: fullText,
      brandAggregation: brandData,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.info('Cycle summary stream aborted by client disconnect');
      return null;
    }
    logger.error('Error streaming cycle summary', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    res.req.removeListener('close', onClose);
  }
};

export const saveCycleSummaryRecord = async (summaryPayload, options = {}) => {
  const cycleId = options.cycleId || summaryPayload?.cycleInfo?.cycleId;
  if (!cycleId) {
    const error = new Error('cycleId is required to store cycle summary');
    error.statusCode = 400;
    throw error;
  }

  const accessScope = {
    role: options.accessScope?.role || null,
    scopedSbuIds: toStringArray(options.accessScope?.scopedSbuIds),
    allDepartmentIds: toStringArray(options.accessScope?.allDepartmentIds),
  };

  const summaryRecord = await CycleSummary.create({
    cycleId,
    cycleInfo: summaryPayload.cycleInfo,
    summary: summaryPayload.summary,
    executiveSummary: summaryPayload.executiveSummary,
    recommendations: Array.isArray(summaryPayload.recommendations)
      ? summaryPayload.recommendations
      : [],
    brandsNeedingAttention: Array.isArray(summaryPayload.brandsNeedingAttention)
      ? summaryPayload.brandsNeedingAttention
      : [],
    brandAggregation: Array.isArray(summaryPayload.brandAggregation)
      ? summaryPayload.brandAggregation
      : [],
    accessScope,
    generationMode: options.generationMode || 'sync',
    generatedBy: {
      userId: options.generatedBy?.userId || null,
      email: options.generatedBy?.email || null,
    },
  });

  return summaryRecord;
};

export const getStoredCycleSummary = async summaryId => {
  try {
    return await CycleSummary.findById(summaryId).lean();
  } catch (error) {
    if (error?.name === 'CastError') {
      return null;
    }
    throw error;
  }
};

export const canAccessStoredCycleSummary = (summaryRecord, access = {}) => {
  if (!summaryRecord) return false;
  if (access.role === 'admin') return true;

  const storedScopedSbuIds = toStringArray(summaryRecord.accessScope?.scopedSbuIds);
  if (storedScopedSbuIds.length === 0) return false;

  const callerScopedSbuIds = new Set(toStringArray(access.scopedSbuIds));
  if (callerScopedSbuIds.size === 0) return false;

  return storedScopedSbuIds.every(sbuId => callerScopedSbuIds.has(sbuId));
};

const buildSummaryPreview = summaryRecord => {
  const source = String(
    summaryRecord?.executiveSummary || summaryRecord?.summary || ''
  )
    .replace(/\s+/g, ' ')
    .trim();

  if (!source) return '';
  if (source.length <= 220) return source;
  return `${source.slice(0, 217)}...`;
};

export const listStoredCycleSummariesByEmail = async (email, access = {}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return [];

  const records = await CycleSummary.find({ 'generatedBy.email': normalizedEmail })
    .sort({ createdAt: -1 })
    .lean();

  if (access.role === 'admin') return records;
  return records.filter(record => canAccessStoredCycleSummary(record, access));
};

export const toSummaryResponse = summaryRecord => ({
  summaryId: String(summaryRecord._id),
  cycleInfo: summaryRecord.cycleInfo,
  summary: summaryRecord.summary,
  executiveSummary: summaryRecord.executiveSummary,
  recommendations: Array.isArray(summaryRecord.recommendations)
    ? summaryRecord.recommendations
    : [],
  brandsNeedingAttention: Array.isArray(summaryRecord.brandsNeedingAttention)
    ? summaryRecord.brandsNeedingAttention
    : [],
  brandAggregation: Array.isArray(summaryRecord.brandAggregation)
    ? summaryRecord.brandAggregation
    : [],
  generatedAt: summaryRecord.createdAt || null,
});

export const toSummaryHistoryResponse = summaryRecord => ({
  summaryId: String(summaryRecord._id),
  cycleId: String(summaryRecord.cycleId || summaryRecord.cycleInfo?.cycleId || ''),
  cycleInfo: summaryRecord.cycleInfo,
  generationMode: summaryRecord.generationMode || null,
  generatedByEmail: summaryRecord.generatedBy?.email || null,
  brandsNeedingAttentionCount: Array.isArray(summaryRecord.brandsNeedingAttention)
    ? summaryRecord.brandsNeedingAttention.length
    : 0,
  generatedAt: summaryRecord.createdAt || null,
  summaryPreview: buildSummaryPreview(summaryRecord),
});

export const buildCycleSummaryPdf = async summaryRecord => {
  return generateCycleSummaryPdfBuffer(summaryRecord);
};
