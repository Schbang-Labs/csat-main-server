/**
 * Cycle 6 MarTech SBU Mapping Script
 *
 * Source mapping file:
 *   .gemini/updateDepartment.md
 *
 * What this script does (MarTech only):
 * 1) Reads Brand Name -> SBU Lead mapping from updateDepartment.md
 * 2) Finds each brand in Brand model
 * 3) Finds/creates separate MarTech SBU for each lead
 * 4) Appends brandId to SBU.brands
 * 5) Updates CSATResponse.sbuId for Cycle 6 + MarTech department for that brand
 * 6) Remaps old legacy SBU IDs for Cycle 6 MarTech responses
 *
 * Run with:
 *   node scripts/sbuNameUpdate.js
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
} from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
const TARGET_DEPARTMENT = 'martech';
const TARGET_DEPARTMENT_ID = '697094a7eeeba79186851674';
const LEGACY_SBU_ID = '697094a94a30795777e84b4d';
const MAPPING_FILE = path.resolve('.gemini/updateDepartment.md');

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const BRAND_NAME_ALIASES = {
  Bridgestone: 'Bridgestone Tyres',
  'Pot & Bloom': 'Pot and Bloom',
  Kotak811: 'Kotak 811 + Kotak 811 (Fin For All)',
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

function buildDeptBrandKey(departmentId, brandId) {
  return `${departmentId.toString()}::${brandId.toString()}`;
}

function choosePreferredSbu(currentSbu, candidateSbu) {
  if (!currentSbu) return candidateSbu;

  const currentLeadCount = Array.isArray(currentSbu.leadNames)
    ? currentSbu.leadNames.length
    : 0;
  const candidateLeadCount = Array.isArray(candidateSbu.leadNames)
    ? candidateSbu.leadNames.length
    : 0;

  if (candidateLeadCount === 1 && currentLeadCount !== 1) {
    return candidateSbu;
  }

  return currentSbu;
}

async function readMappingRows(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const rows = [];
  const seen = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;
    if (normalize(line).startsWith('brand name')) continue;

    const columns = line.split('\t').map(item => item.trim()).filter(Boolean);
    if (columns.length < 2) continue;

    const brandName = columns[0];
    const leadName = columns[1];
    if (!brandName || !leadName) continue;

    const key = `${normalize(brandName)}::${normalize(leadName)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ brandName, leadName });
  }

  return rows;
}

async function findBrandByName(brandName) {
  const namesToTry = [brandName];
  const alias = BRAND_NAME_ALIASES[brandName];
  if (alias) namesToTry.push(alias);

  for (const name of namesToTry) {
    const escaped = escapeRegex(name);
     
    const byName = await Brand.findOne({
      name: { $regex: new RegExp(`^${escaped}$`, 'i') },
    }).select('_id name slug services');
    if (byName) return byName;
  }

  for (const name of namesToTry) {
    const slug = slugify(name);
     
    const bySlug = await Brand.findOne({ slug }).select('_id name slug services');
    if (bySlug) return bySlug;
  }

  return null;
}

async function getUniqueSlug(baseSlug) {
  let candidate = baseSlug;
  let counter = 2;

   
  while (await SBU.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function chooseDedicatedSbu(candidates, leadName) {
  const target = normalize(leadName);

  return (
    candidates.find(sbu => {
      const leads = Array.isArray(sbu.leadNames) ? sbu.leadNames : [];
      const normalizedLeads = leads.map(normalize).filter(Boolean);
      return normalizedLeads.length === 1 && normalizedLeads[0] === target;
    }) || null
  );
}

async function findOrCreateMartechSbuByLead(departmentId, leadName) {
  const escapedLead = escapeRegex(leadName);
  const candidates = await SBU.find({
    departmentId,
    leadNames: { $elemMatch: { $regex: new RegExp(`^${escapedLead}$`, 'i') } },
  }).select('_id name slug leadNames departmentId');

  const dedicated = chooseDedicatedSbu(candidates, leadName);
  if (dedicated) return { sbu: dedicated, created: false };

  const baseSlug = slugify(`${TARGET_DEPARTMENT}-${leadName}`);
  const slug = await getUniqueSlug(baseSlug);

  const createdSbu = await SBU.create({
    name: TARGET_DEPARTMENT,
    slug,
    departmentId,
    leadNames: [leadName],
    isActive: true,
  });

  return { sbu: createdSbu, created: true };
}

async function getCycleSixList() {
  return Cycle.find({ cycleNumber: 6 }).sort({ year: -1 }).select('_id name year');
}

async function remapLegacyCycle6Responses({
  cycleIds,
  department,
  legacySbuId,
}) {
  const responses = await CSATResponse.find({
    cycleId: { $in: cycleIds },
    departmentId: department._id,
    sbuId: legacySbuId,
  }).select('_id brandId');

  if (responses.length === 0) {
    return { found: 0, updated: 0, unresolved: 0, unresolvedItems: [] };
  }

  const sbus = await SBU.find({
    departmentId: department._id,
    isActive: true,
  }).select('_id brands leadNames');

  const deptBrandSbuMap = new Map();
  for (const sbu of sbus) {
    if (sbu._id.toString() === legacySbuId.toString()) continue;

    const brands = Array.isArray(sbu.brands) ? sbu.brands : [];
    for (const brandId of brands) {
      const key = buildDeptBrandKey(department._id, brandId);
      const existing = deptBrandSbuMap.get(key);
      deptBrandSbuMap.set(key, choosePreferredSbu(existing, sbu));
    }
  }

  const brandCache = new Map();
  const bulkOps = [];
  const unresolvedItems = [];

  for (const response of responses) {
    const mapKey = buildDeptBrandKey(department._id, response.brandId);
    let mappedSbu = deptBrandSbuMap.get(mapKey);

    if (!mappedSbu) {
      const brandKey = response.brandId.toString();
      if (!brandCache.has(brandKey)) {
         
        const brandDoc = await Brand.findById(response.brandId).select(
          'name services'
        );
        brandCache.set(brandKey, brandDoc || null);
      }
      const brandDoc = brandCache.get(brandKey);
      const martechService = brandDoc?.services?.find(
        svc =>
          svc.department === TARGET_DEPARTMENT &&
          svc.sbuId &&
          svc.sbuId.toString() !== legacySbuId.toString()
      );

      if (martechService?.sbuId) {
        mappedSbu = { _id: martechService.sbuId };
      }
    }

    if (!mappedSbu?._id) {
      const brandKey = response.brandId.toString();
      const brandDoc = brandCache.get(brandKey) || null;
      unresolvedItems.push({
        responseId: response._id.toString(),
        brandId: response.brandId.toString(),
        brandName: brandDoc?.name || null,
      });
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: response._id },
        update: { $set: { sbuId: mappedSbu._id } },
      },
    });
  }

  let updated = 0;
  if (bulkOps.length > 0) {
    const result = await CSATResponse.bulkWrite(bulkOps);
    updated = result.modifiedCount || 0;
  }

  return {
    found: responses.length,
    updated,
    unresolved: unresolvedItems.length,
    unresolvedItems,
  };
}

async function run() {
  console.log('🚀 Starting Cycle 6 MarTech SBU update script...\n');

  let createdSbuCount = 0;
  let missingBrandCount = 0;
  let sbuBrandLinksAdded = 0;
  let csatMatched = 0;
  let csatModified = 0;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    if (!mongoose.Types.ObjectId.isValid(TARGET_DEPARTMENT_ID)) {
      throw new Error(`Invalid TARGET_DEPARTMENT_ID: ${TARGET_DEPARTMENT_ID}`);
    }
    if (!mongoose.Types.ObjectId.isValid(LEGACY_SBU_ID)) {
      throw new Error(`Invalid LEGACY_SBU_ID: ${LEGACY_SBU_ID}`);
    }

    const mappingRows = await readMappingRows(MAPPING_FILE);
    if (mappingRows.length === 0) {
      console.log(`ℹ️ No valid mapping rows found in ${MAPPING_FILE}`);
      return;
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

    const cycle6List = await getCycleSixList();
    if (cycle6List.length === 0) {
      throw new Error('Cycle 6 not found');
    }
    const cycle6Ids = cycle6List.map(cycle => cycle._id);

    console.log(
      `📁 Department: ${martechDepartment.name} (${martechDepartment._id})`
    );
    console.log(
      `📅 Cycles: ${cycle6List.map(c => `${c.name} (${c.year})`).join(', ')}`
    );
    console.log(`📄 Mapping rows: ${mappingRows.length}\n`);

    for (const row of mappingRows) {
      const brand = await findBrandByName(row.brandName);
      if (!brand) {
        missingBrandCount += 1;
        console.log(`⚠️ Brand not found: ${row.brandName} (lead: ${row.leadName})`);
        continue;
      }

      const { sbu, created } = await findOrCreateMartechSbuByLead(
        martechDepartment._id,
        row.leadName
      );
      if (created) {
        createdSbuCount += 1;
        console.log(`✨ Created MarTech SBU for lead "${row.leadName}": ${sbu.slug}`);
      }

      const sbuUpdate = await SBU.updateOne(
        { _id: sbu._id },
        { $addToSet: { brands: brand._id } }
      );
      if (sbuUpdate.modifiedCount > 0) {
        sbuBrandLinksAdded += 1;
      }

      const csatUpdate = await CSATResponse.updateMany(
        {
          cycleId: { $in: cycle6Ids },
          departmentId: martechDepartment._id,
          brandId: brand._id,
        },
        { $set: { sbuId: sbu._id } }
      );

      csatMatched += csatUpdate.matchedCount;
      csatModified += csatUpdate.modifiedCount;

      console.log(
        `✅ ${brand.name} -> ${row.leadName} | SBU=${sbu.name} (${sbu._id}) | CSAT matched=${csatUpdate.matchedCount}, modified=${csatUpdate.modifiedCount}`
      );
    }

    const legacySummary = await remapLegacyCycle6Responses({
      cycleIds: cycle6Ids,
      department: martechDepartment,
      legacySbuId: new mongoose.Types.ObjectId(LEGACY_SBU_ID),
    });

    console.log('\n🎉 Cycle 6 MarTech update complete');
    console.log(`   SBUs created: ${createdSbuCount}`);
    console.log(`   Missing brands: ${missingBrandCount}`);
    console.log(`   SBU brand links added: ${sbuBrandLinksAdded}`);
    console.log(`   CSAT matched: ${csatMatched}`);
    console.log(`   CSAT modified: ${csatModified}`);
    console.log(
      `   Legacy responses found (martech): ${legacySummary.found}`
    );
    console.log(
      `   Legacy responses updated (martech): ${legacySummary.updated}`
    );
    console.log(
      `   Legacy responses unresolved (martech): ${legacySummary.unresolved}`
    );

    if (legacySummary.unresolvedItems.length > 0) {
      console.log('   Unresolved response details:');
      legacySummary.unresolvedItems.forEach(item => {
        console.log(
          `     - responseId=${item.responseId}, brandId=${item.brandId}, brand=${item.brandName || 'unknown'}`
        );
      });
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

run();
