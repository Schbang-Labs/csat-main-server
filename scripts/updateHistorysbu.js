/**
 * Cycle 1 MarTech SBU History Update Script
 *
 * Uses mapping data from:
 *   .gemini/updateDepartment.md
 *
 * Flow (MarTech department only):
 * 1) Parse Brand Name -> SBU Lead rows from mapping file
 * 2) Find brandId from Brand model
 * 3) Find/create dedicated MarTech SBU for each lead
 * 4) Find/create SBUHistory for Cycle 1 and append brandIds to SBUHistory.brands
 * 5) Update CSATResponse (Cycle 1 + MarTech + mapped brands) with:
 *    - sbuId
 *    - sbuHistoryId
 *
 * Run with:
 *   node scripts/updateHistorysbu.js
 */

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  Brand,
  CSATResponse,
  Cycle,
  Department,
  SBU,
  SBUHistory,
} from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
const TARGET_DEPARTMENT = 'martech';
const TARGET_DEPARTMENT_ID = '697094a7eeeba79186851674';
const TARGET_CYCLE_NUMBER = 1;
const MAPPING_FILE = path.resolve('.gemini/updateDepartment.md');

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const BRAND_NAME_ALIASES = {
  Bridgestone: 'Bridgestone Tyres',
  'Pot & Bloom': 'Pot and Bloom',
  Kotak811: 'Kotak 811 + Kotak 811 (Fin For All)',
  Kotak812: 'Kotak811',
  Kotak813: 'Kotak811',
  Hamilton: 'Hamilton D2C',
  'ICICI prudential': 'ICICI Prudential',
};

const normalize = value => (value || '').trim().toLowerCase();

const slugify = value =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function readMappingRows(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const rows = [];
  const seen = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;
    if (normalize(line).startsWith('brand name')) continue;

    const parts = line.split('\t').map(item => item.trim()).filter(Boolean);
    if (parts.length < 2) continue;

    const brandName = parts[0];
    const leadName = parts[1];

    if (!brandName || !leadName) continue;

    const dedupeKey = `${normalize(brandName)}::${normalize(leadName)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    rows.push({ brandName, leadName });
  }

  return rows;
}

async function findBrandByNameOrAlias(brandName) {
  const namesToTry = [brandName];
  const alias = BRAND_NAME_ALIASES[brandName];
  if (alias) namesToTry.push(alias);

  for (const name of namesToTry) {
    const escaped = escapeRegex(name);
     
    const brandByName = await Brand.findOne({
      name: { $regex: new RegExp(`^${escaped}$`, 'i') },
    }).select('_id name slug');
    if (brandByName) return brandByName;
  }

  for (const name of namesToTry) {
    const slug = slugify(name);
     
    const brandBySlug = await Brand.findOne({ slug }).select('_id name slug');
    if (brandBySlug) return brandBySlug;
  }

  return null;
}

function pickDedicatedSbu(candidates, leadName) {
  const normalizedLead = normalize(leadName);

  return (
    candidates.find(candidate => {
      const leadNames = Array.isArray(candidate.leadNames)
        ? candidate.leadNames
        : [];
      const normalizedLeadNames = leadNames.map(normalize).filter(Boolean);

      return (
        normalizedLeadNames.length === 1 &&
        normalizedLeadNames[0] === normalizedLead
      );
    }) || null
  );
}

async function getUniqueSlug(baseSlug) {
  let candidate = baseSlug;
  let count = 2;

   
  while (await SBU.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${count}`;
    count += 1;
  }

  return candidate;
}

async function findOrCreateDedicatedMartechSbu(departmentId, leadName) {
  const escapedLead = escapeRegex(leadName);
  const candidates = await SBU.find({
    departmentId,
    leadNames: { $elemMatch: { $regex: new RegExp(`^${escapedLead}$`, 'i') } },
  }).select(
    '_id name slug departmentId executiveVP associateVP associateVPs creativeDirector leadNames'
  );

  const dedicated = pickDedicatedSbu(candidates, leadName);
  if (dedicated) {
    return { sbu: dedicated, created: false };
  }

  const baseSlug = slugify(`${TARGET_DEPARTMENT}-${leadName}`);
  const slug = await getUniqueSlug(baseSlug);

  const newSbu = await SBU.create({
    name: TARGET_DEPARTMENT,
    slug,
    departmentId,
    leadNames: [leadName],
    isActive: true,
  });

  return { sbu: newSbu, created: true };
}

async function findCycleByNumber(cycleNumber) {
  const cycle2025 = await Cycle.findOne({
    cycleNumber,
    year: 2025,
  });
  if (cycle2025) return cycle2025;

  const activeCycle = await Cycle.findOne({
    cycleNumber,
    isActive: true,
  }).sort({ year: -1 });

  if (activeCycle) return activeCycle;
  return Cycle.findOne({ cycleNumber }).sort({ year: -1 });
}

async function upsertSbuHistoryForCycle({ sbu, cycleId, departmentId }) {
  return SBUHistory.findOneAndUpdate(
    { sbuId: sbu._id, cycleId },
    {
      sbuId: sbu._id,
      cycleId,
      departmentId,
      executiveVP: sbu.executiveVP || null,
      associateVP: sbu.associateVP || null,
      associateVPs: sbu.associateVPs || [],
      creativeDirector: sbu.creativeDirector || null,
      leadNames: sbu.leadNames || [],
      snapshotReason: 'manual',
    },
    { upsert: true, new: true }
  );
}

async function run() {
  console.log('🚀 Starting Cycle 1 MarTech SBU history update...\n');

  let missingBrandCount = 0;
  let createdSbuCount = 0;
  let touchedHistoryCount = 0;
  let addedHistoryBrandLinks = 0;
  let csatMatchedCount = 0;
  let csatModifiedCount = 0;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const mappingRows = await readMappingRows(MAPPING_FILE);
    if (mappingRows.length === 0) {
      console.log(`ℹ️ No mapping rows found in ${MAPPING_FILE}`);
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(TARGET_DEPARTMENT_ID)) {
      throw new Error(`Invalid TARGET_DEPARTMENT_ID: ${TARGET_DEPARTMENT_ID}`);
    }

    const martechDepartment = await Department.findOne({
      _id: new mongoose.Types.ObjectId(TARGET_DEPARTMENT_ID),
      name: TARGET_DEPARTMENT,
    }).select('_id name');
    if (!martechDepartment) {
      throw new Error(
        `Department not found for id=${TARGET_DEPARTMENT_ID}, name=${TARGET_DEPARTMENT}`
      );
    }

    const targetCycle = await findCycleByNumber(TARGET_CYCLE_NUMBER);
    if (!targetCycle) {
      throw new Error(`Cycle ${TARGET_CYCLE_NUMBER} not found`);
    }

    console.log(
      `📁 Department: ${martechDepartment.name} (${martechDepartment._id})`
    );
    console.log(`📅 Cycle: ${targetCycle.name} (${targetCycle.year})`);
    console.log(`📄 Parsed mapping rows: ${mappingRows.length}\n`);

    const leadToBrandIds = new Map();
    const leadNameByKey = new Map();

    for (const row of mappingRows) {
      const brand = await findBrandByNameOrAlias(row.brandName);

      if (!brand) {
        missingBrandCount += 1;
        console.log(`⚠️ Brand not found: ${row.brandName} (lead: ${row.leadName})`);
        continue;
      }

      const leadKey = normalize(row.leadName);
      if (!leadToBrandIds.has(leadKey)) {
        leadToBrandIds.set(leadKey, new Set());
        leadNameByKey.set(leadKey, row.leadName.trim());
      }

      leadToBrandIds.get(leadKey).add(brand._id.toString());
    }

    for (const [leadKey, brandIdSet] of leadToBrandIds.entries()) {
      const leadName = leadNameByKey.get(leadKey);
      const brandIds = [...brandIdSet].map(id => new mongoose.Types.ObjectId(id));

      const { sbu, created } = await findOrCreateDedicatedMartechSbu(
        martechDepartment._id,
        leadName
      );
      if (created) {
        createdSbuCount += 1;
        console.log(
          `✨ Created MarTech SBU for lead "${leadName}" (slug: ${sbu.slug})`
        );
      }

      const sbuHistory = await upsertSbuHistoryForCycle({
        sbu,
        cycleId: targetCycle._id,
        departmentId: martechDepartment._id,
      });
      touchedHistoryCount += 1;

      const historyBrandUpdate = await SBUHistory.updateOne(
        { _id: sbuHistory._id },
        { $addToSet: { brands: { $each: brandIds } } }
      );
      if (historyBrandUpdate.modifiedCount > 0) {
        addedHistoryBrandLinks += 1;
      }

      const csatUpdate = await CSATResponse.updateMany(
        {
          cycleId: targetCycle._id,
          departmentId: martechDepartment._id,
          brandId: { $in: brandIds },
        },
        {
          $set: {
            sbuId: sbu._id,
            sbuHistoryId: sbuHistory._id,
          },
        }
      );

      csatMatchedCount += csatUpdate.matchedCount;
      csatModifiedCount += csatUpdate.modifiedCount;

      console.log(
        `✅ Lead ${leadName}: brands=${brandIds.length}, sbu=${sbu._id}, sbuHistory=${sbuHistory._id}, csat matched=${csatUpdate.matchedCount}, modified=${csatUpdate.modifiedCount}`
      );
    }

    console.log('\n🎉 Cycle 1 MarTech update complete');
    console.log(`   Missing brands: ${missingBrandCount}`);
    console.log(`   SBUs created: ${createdSbuCount}`);
    console.log(`   SBUHistory records touched: ${touchedHistoryCount}`);
    console.log(`   SBUHistory brand appends: ${addedHistoryBrandLinks}`);
    console.log(`   CSAT matched: ${csatMatchedCount}`);
    console.log(`   CSAT modified: ${csatModifiedCount}`);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

run();
