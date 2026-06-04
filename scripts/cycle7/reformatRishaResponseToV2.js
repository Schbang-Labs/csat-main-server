/**
 * Reformat Risha's CSAT response to match the v2 payload shape.
 *
 * The Risha response (TARGET_ID) was originally seeded with
 * `data.formVersion = "v1"` and a legacy nested structure. Other responses
 * in this cycle are stored with `version: 2` and a different data shape.
 *
 * This script:
 *   1. Loads the REFERENCE response (a known-good v2 document) and uses its
 *      `data` object as a structural template.
 *   2. Overlays Risha's per-metric scores onto every matching key found in
 *      the template (searched recursively, case-insensitive).
 *   3. Keeps Risha's comment + submittedAt.
 *   4. Writes the rebuilt document back with `version: 2`.
 *
 * Run: node scripts/cycle7/reformatRishaResponseToV2.js
 *      DRY_RUN=1 node scripts/cycle7/reformatRishaResponseToV2.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import { CSATResponse } from '../../src/models/index.js';

const REFERENCE_ID = '69df5045121888b79b62a298';
const TARGET_ID = '69df3ba7a7a2d20b78202b72';
const DRY_RUN = process.env.DRY_RUN === '1';

// Risha's scores — same list as the original seed. Keys are the canonical
// metric names; aliases are merged in below so we can match whatever key
// shape the reference v2 document uses.
const SCORES = {
  teamResponsiveness: 5,
  brandUnderstanding: 5,
  qualityOfIdeas: 5,
  qualityOfDesignVideo: 5,
  teamProactivity: 5,
  strategyExecution: 5,
  meetingBusinessGoals: 4,
  dataEffectiveness: 3,
  northStarMetrics: 2,
  seniorLeadershipInvolvement: 5,
  likelihoodToRecommend: 5,
  overallSatisfaction: 4,
};

// Map every plausible key spelling to the score it should receive.
const KEY_ALIASES = {
  // team responsiveness
  teamresponsiveness: SCORES.teamResponsiveness,
  responsiveness: SCORES.teamResponsiveness,

  // brand understanding
  brandunderstanding: SCORES.brandUnderstanding,
  understanding: SCORES.brandUnderstanding,

  // quality of ideas
  qualityofideas: SCORES.qualityOfIdeas,
  ideas: SCORES.qualityOfIdeas,

  // quality of design / video
  qualityofdesignvideo: SCORES.qualityOfDesignVideo,
  qualityofdesignandvideo: SCORES.qualityOfDesignVideo,
  qualityofdesign: SCORES.qualityOfDesignVideo,
  designvideo: SCORES.qualityOfDesignVideo,

  // team proactivity
  teamproactivity: SCORES.teamProactivity,
  proactivity: SCORES.teamProactivity,

  // strategy execution
  strategyexecution: SCORES.strategyExecution,
  execution: SCORES.strategyExecution,

  // business goals
  meetingbusinessgoals: SCORES.meetingBusinessGoals,
  businessgoals: SCORES.meetingBusinessGoals,

  // data effectiveness
  dataeffectiveness: SCORES.dataEffectiveness,

  // north star
  northstarmetrics: SCORES.northStarMetrics,
  northstarmetricsalignment: SCORES.northStarMetrics,
  northstar: SCORES.northStarMetrics,

  // senior leadership
  seniorleadershipinvolvement: SCORES.seniorLeadershipInvolvement,
  leadershipinvolvement: SCORES.seniorLeadershipInvolvement,

  // NPS
  likelihoodtorecommend: SCORES.likelihoodToRecommend,
  recommend: SCORES.likelihoodToRecommend,
  nps: SCORES.likelihoodToRecommend,

  // CSAT
  overallsatisfaction: SCORES.overallSatisfaction,
  satisfaction: SCORES.overallSatisfaction,
  csat: SCORES.overallSatisfaction,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const normalizeKey = k =>
  String(k).toLowerCase().replace(/[^a-z0-9]/g, '');

function cloneJson(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Walk the template recursively. Every time we find a leaf that looks like a
 * rating (number or numeric string) AND its parent key matches an alias in
 * KEY_ALIASES, replace with the score. Non-rating leaves are preserved
 * (form metadata, flags, strings, etc.).
 */
function overlayScores(template) {
  const replaced = [];

  const walk = node => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') return;

    for (const [key, value] of Object.entries(node)) {
      const norm = normalizeKey(key);
      const isLeaf =
        value === null ||
        typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'boolean';

      if (isLeaf && Object.prototype.hasOwnProperty.call(KEY_ALIASES, norm)) {
        node[key] = KEY_ALIASES[norm];
        replaced.push(key);
      } else if (value && typeof value === 'object') {
        walk(value);
      }
    }
  };

  walk(template);
  return replaced;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('========================================================');
  console.log('  Reformat Risha response → v2 shape');
  console.log(`  DRY_RUN=${DRY_RUN ? '1 (no writes)' : '0 (writes enabled)'}`);
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const reference = await CSATResponse.findById(REFERENCE_ID).lean();
    if (!reference) {
      console.error(`Reference response ${REFERENCE_ID} not found.`);
      process.exit(1);
    }
    console.log(`Reference: ${reference._id}`);
    console.log(`  version:     ${reference.version}`);
    console.log(`  departmentId:${reference.departmentId}`);
    console.log(`  sbuId:       ${reference.sbuId}`);
    console.log(`  data keys:   ${Object.keys(reference.data || {}).join(', ')}\n`);

    const target = await CSATResponse.findById(TARGET_ID).lean();
    if (!target) {
      console.error(`Target response ${TARGET_ID} not found.`);
      process.exit(1);
    }
    console.log(`Target:    ${target._id}`);
    console.log(`  version:     ${target.version}`);
    console.log(`  data keys:   ${Object.keys(target.data || {}).join(', ')}\n`);

    // Build the new data payload by cloning the reference's data structure
    // and overlaying Risha's scores.
    if (!reference.data || typeof reference.data !== 'object') {
      console.error('Reference response has no usable `data` object.');
      process.exit(1);
    }
    const newData = cloneJson(reference.data);

    const replacedKeys = overlayScores(newData);
    console.log(`Overlaid ${replacedKeys.length} metric keys in template:`);
    console.log(`  ${replacedKeys.join(', ')}\n`);

    // Preserve Risha's submittedAt as the filled-at marker where the template
    // has something resembling a timestamp.
    const submittedIso = (target.submittedAt || new Date()).toISOString
      ? target.submittedAt.toISOString?.() || new Date(target.submittedAt).toISOString()
      : new Date(target.submittedAt).toISOString();
    for (const tsKey of ['filledAt', 'submittedAt', 'timestamp']) {
      if (Object.prototype.hasOwnProperty.call(newData, tsKey)) {
        newData[tsKey] = submittedIso;
      }
    }

    console.log('New data preview:');
    console.log(JSON.stringify(newData, null, 2));
    console.log('');

    if (DRY_RUN) {
      console.log('DRY_RUN — not writing.');
    } else {
      await CSATResponse.updateOne(
        { _id: target._id },
        {
          $set: {
            version: 2,
            data: newData,
          },
        }
      );
      console.log(`Updated ${target._id} → version: 2 with reference-shaped data.`);
    }
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
