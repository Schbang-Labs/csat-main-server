/**
 * Seed Script - CSAT Responses for Ample Group Cycle 6 (Solutions Department)
 *
 * Inserts 4 CSAT responses from the "CSAT Ample Corp Cycle 6 Responses" form.
 * All responses belong to brand "Ample Group". The label after the colon in the
 * CSV respondent field (LEGO, Imagine, Tekne, Ample Corp) is the project/sub-brand
 * the POC works on — NOT the brand itself.
 *
 * POC (client) lookup is by phone number against the Ample Group brand.
 *
 * Responses:
 *   1. Sunny Bose (LEGO) → Ample Group | Phone: 9731292002
 *   2. Nabeel Ahmed (Imagine) → Ample Group | Phone: 8792488536
 *   3. Aqueel Siddiqui (Ample Corp) → Ample Group | Phone: 8105758822
 *   4. Nabeel Ahmed (Tekne) → Ample Group | Phone: 8792488536
 *
 * Run: node scripts/cycle6/seedAmpleCorpResponses.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import {
  Brand,
  Client,
  Department,
  SBU,
  CSATResponse,
} from '../../src/models/index.js';

// ── Constants ────────────────────────────────────────────────────────────────

const CYCLE_ID = '697094a7eeeba79186851689'; // Cycle 6
const DEPARTMENT_NAME = 'solutions';
const BRAND_NAME = 'Ample Group';

// ── Response Data ────────────────────────────────────────────────────────────

const RESPONSES = [
  {
    pocName: 'Sunny Bose',
    phone: '9731292002',
    label: 'LEGO',
    email: 'sunnybose001@gmail.com',
    submittedAt: new Date('2026-03-17T12:57:57.000Z'),
    comment:
      'Utkarsha has been doing s great job and has been pilling the weight of the team. Weve spoken at length about the bandwidth issues and tat , waiting for that to be resolved.',
    scores: {
      teamResponsiveness: 3,
      brandUnderstanding: 4,
      qualityOfIdeas: 5,
      qualityOfDesignVideo: 5,
      teamProactivity: 4,
      strategyExecution: 4,
      meetingBusinessGoals: 4,
      dataEffectiveness: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 4,
      likelihoodToRecommend: 4,
      overallSatisfaction: 4,
    },
  },
  {
    pocName: 'Nabeel Ahmed',
    phone: '8792488536',
    label: 'Imagine',
    email: 'nabeel.askari@gmail.com',
    submittedAt: new Date('2026-03-17T14:32:07.000Z'),
    comment:
      'Overall, Imagine is in a significantly stronger position than before. The immediate priority now is to elevate the quality and sharpness of creative output, ensuring it reflects a more premium and differentiated brand voice.\n\nIn parallel, there is a clear opportunity to build agility in moment marketing, enabling us to respond to cultural and consumer moments in real time and drive higher relevance and engagement.\n\nWhat still remains underleveraged, however, is clear strategic brand positioning through our creative output. Beyond execution, we need to define and consistently express what Imagine stands for\u2014using every piece of content as a building block to shape perception and strengthen long-term brand equity.',
    scores: {
      teamResponsiveness: 3,
      brandUnderstanding: 4,
      qualityOfIdeas: 3,
      qualityOfDesignVideo: 3,
      teamProactivity: 3,
      strategyExecution: 3,
      meetingBusinessGoals: 3,
      dataEffectiveness: 2,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 4,
      likelihoodToRecommend: 3,
      overallSatisfaction: 3,
    },
  },
  {
    pocName: 'Aqueel Siddiqui',
    phone: '8105758822',
    label: 'Ample Corp',
    email: 'aqueel.siddika@gmail.com',
    submittedAt: new Date('2026-03-18T16:11:07.000Z'),
    comment:
      'The overall creative output could be strengthened further, and ensuring more thorough QC before sharing content with us would help improve consistency.\n\nAdditionally, it would be helpful for the solution managers to have greater clarity on the content pillars the brand had been following over the past year. Building a stronger understanding of the business context will go a long way in enabling more aligned and effective work. We\u2019re happy to support this through workshops or training sessions, and collaborate closely to help the teams improve.\n\nCommunication and design strategy has to be in place.\n\nWe\u2019ve also observed a gap at times between the concept stage and final execution. That said, we are seeing positive momentum from the first week of March, which is encouraging. We hope to build on this progress and are here to support wherever needed.',
    scores: {
      teamResponsiveness: 3,
      brandUnderstanding: 3,
      qualityOfIdeas: 2,
      qualityOfDesignVideo: 2,
      teamProactivity: 1,
      strategyExecution: 2,
      meetingBusinessGoals: 2,
      dataEffectiveness: 3,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 2,
      likelihoodToRecommend: 3,
      overallSatisfaction: 3,
    },
  },
  {
    pocName: 'Nabeel Ahmed',
    phone: '8792488536',
    label: 'Tekne',
    email: 'nabeel.askari@gmail.com',
    submittedAt: new Date('2026-03-18T16:42:52.000Z'),
    comment:
      'I feel the team is not yet fully aligned with the intended brand positioning for Tekne. Some of the ideas and executions coming through do not reflect the level of quality and refinement we should be aiming for, given that Tekne\u2019s desired positioning is - a premium lifestyle brand.\n\nAdditionally, I feel we have focussed a lot on Ai-generated content and explored relatively less design-led content so far. Strengthening the role of thoughtful design and craft in our creatives could help elevate the overall output and bring it closer to the premium brand language we want to build.',
    scores: {
      teamResponsiveness: 3,
      brandUnderstanding: 2,
      qualityOfIdeas: 3,
      qualityOfDesignVideo: 2,
      teamProactivity: 3,
      strategyExecution: 3,
      meetingBusinessGoals: 2,
      dataEffectiveness: 2,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 2,
      likelihoodToRecommend: 2,
      overallSatisfaction: 3,
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateSlug = name =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function findBrand(brandName) {
  const escaped = escapeRegex(brandName);
  let brand = await Brand.findOne({
    name: { $regex: new RegExp(`^${escaped}$`, 'i') },
  });
  if (brand) return brand;

  brand = await Brand.findOne({ slug: generateSlug(brandName) });
  return brand;
}

/**
 * Find client by phone number under the given brand.
 * Matches last 10 digits to handle with/without country code.
 */
async function findClientByPhone(brandId, phone) {
  const normalized = phone.replace(/\D/g, '').slice(-10);

  // Try exact match under brand first
  let client = await Client.findOne({
    brandId,
    phone: { $regex: new RegExp(`${normalized}$`) },
  });
  if (client) return client;

  // Fallback: global phone match
  client = await Client.findOne({
    phone: { $regex: new RegExp(`${normalized}$`) },
  });
  return client;
}

async function findSBUForBrand(brand, departmentId) {
  const brandService = brand.services?.find(s => s.department === DEPARTMENT_NAME);
  if (brandService?.sbuId) {
    const sbu = await SBU.findById(brandService.sbuId);
    if (sbu) return sbu;
  }

  const sbu = await SBU.findOne({
    departmentId,
    brands: brand._id,
    isActive: true,
  });
  return sbu;
}

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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('========================================================');
  console.log('  Seed CSAT Responses - Ample Group Cycle 6 (Solutions)');
  console.log('========================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find Solutions department
    const department = await Department.findOne({ name: DEPARTMENT_NAME });
    if (!department) {
      console.error(`Department "${DEPARTMENT_NAME}" not found!`);
      process.exit(1);
    }
    console.log(`Department: ${department.displayName || department.name} (${department._id})`);
    console.log(`Cycle ID:   ${CYCLE_ID}`);

    // Find the single brand: Ample Group
    const brand = await findBrand(BRAND_NAME);
    if (!brand) {
      console.error(`Brand "${BRAND_NAME}" not found in DB!`);
      process.exit(1);
    }
    console.log(`Brand:      ${brand.name} (${brand._id})`);

    // Find SBU for Ample Group in Solutions (same for all responses)
    const sbu = await findSBUForBrand(brand, department._id);
    console.log(`SBU:        ${sbu ? `${sbu.name} (${sbu._id})` : 'N/A (null)'}\n`);

    const cycleObjectId = new mongoose.Types.ObjectId(CYCLE_ID);

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < RESPONSES.length; i++) {
      const resp = RESPONSES[i];
      const label = `[${i + 1}/${RESPONSES.length}] ${resp.pocName} (${resp.label})`;

      console.log(`--- ${label} ---`);

      // 1. Find Client (POC) by phone under Ample Group
      let client = await findClientByPhone(brand._id, resp.phone);
      if (!client) {
        console.log(`  WARN:  Client not found by phone "${resp.phone}", creating...`);
        client = await Client.create({
          brandId: brand._id,
          name: resp.pocName,
          phone: resp.phone,
          email: resp.email,
          serviceMapping: [{ department: DEPARTMENT_NAME, isActive: true }],
          isActive: true,
        });
        console.log(`  Created client: ${client.name} (${client._id})`);
      } else {
        console.log(`  Client: ${client.name} — phone: ${client.phone} (${client._id})`);
      }

      // 2. Check for existing response (same brand + client + cycle + department)
      const existing = await CSATResponse.findOne({
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycleObjectId,
        departmentId: department._id,
      });

      if (existing) {
        console.log(`  SKIP:   Response already exists (${existing._id})\n`);
        skipped++;
        continue;
      }

      // 3. Build and insert response
      const data = buildResponseData(resp.scores, resp.submittedAt);

      const csatResponse = await CSATResponse.create({
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycleObjectId,
        departmentId: department._id,
        sbuId: sbu?._id || null,
        brandHistoryId: null,
        clientHistoryId: null,
        sbuHistoryId: null,
        submittedAt: resp.submittedAt,
        data,
        comment: resp.comment || '',
        isValid: true,
      });

      console.log(`  INSERTED: ${csatResponse._id}`);
      console.log(`  CSAT: ${resp.scores.overallSatisfaction} | NPS: ${resp.scores.likelihoodToRecommend}\n`);
      inserted++;
    }

    // Summary
    console.log('========================================================');
    console.log('  Summary');
    console.log('========================================================');
    console.log(`  Brand:    ${brand.name}`);
    console.log(`  Total:    ${RESPONSES.length}`);
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log(`  Failed:   ${failed}`);
    console.log('========================================================\n');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
