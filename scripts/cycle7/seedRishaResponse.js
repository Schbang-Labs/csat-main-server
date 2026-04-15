/**
 * Seed Script - CSAT Response for POC "Risha" in Cycle 7 (current active cycle)
 *
 * Inserts a single CSAT response using:
 *   - departmentId: 697094a6eeeba7918685165a
 *   - sbuId:        697094a84a30795777e84aec
 *   - brandId:      69df39d1121888b79b62948d
 *   - clientId:     69df39e5121888b79b6294f5
 *
 * Run: node scripts/cycle7/seedRishaResponse.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import {
  Brand,
  Client,
  Cycle,
  Department,
  SBU,
  CSATResponse,
} from '../../src/models/index.js';

// ── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENT_ID = '697094a6eeeba7918685165a';
const SBU_ID = '697094a84a30795777e84aec';
const BRAND_ID = '69df39d1121888b79b62948d';
const CLIENT_ID = '69df39e5121888b79b6294f5';

// Submitted: 14/04/2026 18:39:10 IST (UTC+5:30)
const SUBMITTED_AT = new Date('2026-04-14T13:09:10.000Z');

const COMMENT =
  'Main areas of concern: lack of access to data (amazon issue more than external issue) means we are limited with how far we can leverage our partnership to meet all our team goals and north star metrics; a lot of tasks are also quite manual and we\'re looking more and more into automation.';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildResponseData(scores, submittedAt) {
  return {
    coreMetrics: {
      overallSatisfaction: scores.overallSatisfaction,
      likelihoodToRecommend: scores.likelihoodToRecommend,
      northStarMetrics: scores.northStarMetrics,
      seniorLeadershipInvolvement: scores.seniorLeadershipInvolvement,
      strategyExecution: scores.strategyExecution,
      teamResponsiveness: scores.teamResponsiveness,
      brandUnderstanding: scores.brandUnderstanding,
    },
    deliveryMetrics: {
      dataEffectiveness: scores.dataEffectiveness,
      teamProactivity: scores.teamProactivity,
      meetingBusinessGoals: scores.meetingBusinessGoals,
    },
    qualityEvaluation: {
      qualityOfDesignVideo: scores.qualityOfDesignVideo,
      qualityOfIdeas: scores.qualityOfIdeas,
    },
    formVersion: 'v1',
    filledAt: submittedAt.toISOString(),
  };
}

async function findActiveCycle() {
  let cycle = await Cycle.findOne({ status: 'active', isActive: true });
  if (cycle) return cycle;
  cycle = await Cycle.findOne({ cycleNumber: 7, isActive: true });
  return cycle;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('========================================================');
  console.log('  Seed CSAT Response - Risha, Cycle 7');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const cycle = await findActiveCycle();
    if (!cycle) {
      console.error('No active cycle found!');
      process.exit(1);
    }
    console.log(
      `Cycle:      ${cycle.name} #${cycle.cycleNumber} (${cycle._id})`
    );

    const department = await Department.findById(DEPARTMENT_ID);
    if (!department) {
      console.error(`Department ${DEPARTMENT_ID} not found!`);
      process.exit(1);
    }
    console.log(
      `Department: ${department.displayName || department.name} (${department._id})`
    );

    const sbu = await SBU.findById(SBU_ID);
    if (!sbu) {
      console.error(`SBU ${SBU_ID} not found!`);
      process.exit(1);
    }
    console.log(`SBU:        ${sbu.name} (${sbu._id})`);

    const brand = await Brand.findById(BRAND_ID);
    if (!brand) {
      console.error(`Brand ${BRAND_ID} not found!`);
      process.exit(1);
    }
    console.log(`Brand:      ${brand.name} (${brand._id})`);

    const client = await Client.findById(CLIENT_ID);
    if (!client) {
      console.error(`Client ${CLIENT_ID} not found!`);
      process.exit(1);
    }
    console.log(
      `POC:        ${client.name} (${client._id}) phone=${client.phone}\n`
    );

    // De-dupe by brand + client + cycle + department
    const existing = await CSATResponse.findOne({
      brandId: brand._id,
      clientId: client._id,
      cycleId: cycle._id,
      departmentId: department._id,
    });
    if (existing) {
      console.log(`SKIP: Response already exists (${existing._id})`);
      return;
    }

    const doc = await CSATResponse.create({
      brandId: brand._id,
      clientId: client._id,
      cycleId: cycle._id,
      departmentId: department._id,
      sbuId: sbu._id,
      brandHistoryId: null,
      clientHistoryId: null,
      sbuHistoryId: null,
      submittedAt: SUBMITTED_AT,
      data: buildResponseData(SCORES, SUBMITTED_AT),
      comment: COMMENT,
      isValid: true,
    });

    console.log(`INSERTED: ${doc._id}`);
    console.log(
      `CSAT: ${SCORES.overallSatisfaction} | NPS: ${SCORES.likelihoodToRecommend}`
    );
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
