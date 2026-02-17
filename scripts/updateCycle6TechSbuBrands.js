/**
 * Cycle 6 Tech SBU Brands Reset Script
 *
 * Steps:
 * 1) Read Brand -> Lead mapping from .gemini/updateDepartment.md
 * 2) Find Tech department
 * 3) Clear brands array for all SBUs in Tech department
 * 4) Find/create SBU for each lead and repopulate brands array using brandIds
 *
 * Run with:
 *   node scripts/updateCycle6TechSbuBrands.js
 */

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Brand, Department, SBU } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
const TARGET_DEPARTMENT = 'tech';
const MAPPING_FILE = path.resolve('.gemini/updateDepartment.md');

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const BRAND_NAME_ALIASES = {
  Bridgestone: 'Bridgestone Tyres',
  'Pot & Bloom': 'Pot and Bloom',
  'Sriram Life Insurance': 'Shriram Life Insurance',
};

const normalize = value => (value || '').trim().toLowerCase();

const slugify = value =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

async function getUniqueSlug(baseSlug) {
  let candidate = baseSlug;
  let counter = 2;

   
  while (await SBU.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function pickDedicatedSbu(sbus, leadName) {
  const target = normalize(leadName);

  return (
    sbus.find(sbu => {
      const leads = Array.isArray(sbu.leadNames) ? sbu.leadNames : [];
      const normalizedLeads = leads.map(normalize).filter(Boolean);
      return normalizedLeads.length === 1 && normalizedLeads[0] === target;
    }) || null
  );
}

async function findOrCreateTechSbuByLead(departmentId, leadName) {
  const escapedLead = escapeRegex(leadName);
  const candidates = await SBU.find({
    departmentId,
    leadNames: { $elemMatch: { $regex: new RegExp(`^${escapedLead}$`, 'i') } },
  }).select('_id name slug leadNames');

  const dedicated = pickDedicatedSbu(candidates, leadName);
  if (dedicated) return { sbu: dedicated, created: false };

  if (candidates.length > 0) return { sbu: candidates[0], created: false };

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

async function run() {
  console.log('🚀 Starting Cycle 6 Tech SBU brands reset...\n');

  let createdSbuCount = 0;
  let missingBrandCount = 0;
  let updatedSbuCount = 0;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const mappingRows = await readMappingRows(MAPPING_FILE);
    if (mappingRows.length === 0) {
      console.log(`ℹ️ No valid mapping rows found in ${MAPPING_FILE}`);
      return;
    }

    const techDepartment = await Department.findOne({
      name: TARGET_DEPARTMENT,
    }).select('_id name');

    if (!techDepartment) {
      throw new Error(`Department not found: ${TARGET_DEPARTMENT}`);
    }

    console.log(`📁 Department: ${techDepartment.name}`);
    console.log(`📄 Mapping rows: ${mappingRows.length}`);

    const clearResult = await SBU.updateMany(
      { departmentId: techDepartment._id },
      { $set: { brands: [] } }
    );
    console.log(
      `🧹 Cleared brands arrays for ${clearResult.matchedCount} Tech SBU(s)`
    );

    const leadToBrandIds = new Map();

    for (const row of mappingRows) {
      const brand = await findBrandByNameOrAlias(row.brandName);

      if (!brand) {
        missingBrandCount += 1;
        console.log(`⚠️ Brand not found: ${row.brandName} (lead: ${row.leadName})`);
        continue;
      }

      const leadKey = normalize(row.leadName);
      if (!leadToBrandIds.has(leadKey)) {
        leadToBrandIds.set(leadKey, {
          leadName: row.leadName.trim(),
          brandIds: new Set(),
        });
      }

      leadToBrandIds.get(leadKey).brandIds.add(brand._id.toString());
    }

    for (const { leadName, brandIds } of leadToBrandIds.values()) {
      const { sbu, created } = await findOrCreateTechSbuByLead(
        techDepartment._id,
        leadName
      );

      if (created) {
        createdSbuCount += 1;
        console.log(`✨ Created Tech SBU for lead "${leadName}" (${sbu.slug})`);
      }

      const brandObjectIds = [...brandIds].map(id => new mongoose.Types.ObjectId(id));
      await SBU.updateOne(
        { _id: sbu._id },
        {
          $set: {
            brands: brandObjectIds,
          },
        }
      );
      updatedSbuCount += 1;

      console.log(
        `✅ Updated SBU "${sbu.name}" for ${leadName}: ${brandObjectIds.length} brand(s)`
      );
    }

    console.log('\n🎉 Cycle 6 Tech SBU brand reset complete');
    console.log(`   SBUs created: ${createdSbuCount}`);
    console.log(`   SBUs updated: ${updatedSbuCount}`);
    console.log(`   Missing brands: ${missingBrandCount}`);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

run();
