/**
 * Cycle 7 - Assign Brands from cycle7-sbu.md to a given SBU
 *
 * Reads brand names from cycle7-sbu.md (single-column format),
 * looks them up in the DB, and assigns them to the specified SBU.
 *
 * Run with: node scripts/cycle7/assignBrandsToSBU.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { Brand, SBU } from '../../src/models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGO_URI;
const TARGET_SBU_ID = '697094a94a30795777e84b57'; // SMP

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Known brand name aliases: markdown name → DB name
 */
const BRAND_NAME_ALIASES = {
  'TCP (Tata Consumer Products)': 'Tata Consumer Products',
  'TCP': 'Tata Consumer Products',
  'IDFC': 'IDFC First Bank',
  'Loreal Professionals': "L'Oreal Professionnel",
  'Softsens.': 'Softsens',
};

async function findBrand(rawName) {
  const name = BRAND_NAME_ALIASES[rawName] || rawName;

  let brand = await Brand.findOne({ name });
  if (brand) return brand;

  brand = await Brand.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
  });
  if (brand) return brand;

  const slug = generateSlug(name);
  brand = await Brand.findOne({ slug });
  return brand || null;
}

function parseBrandNames() {
  const mdPath = path.join(__dirname, 'cycle7-sbu.md');
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');
  const brands = [];

  for (const line of lines) {
    const name = line.replace(/\.+\s*$/, '').trim(); // strip trailing dots/spaces
    if (!name) continue;
    if (name === 'Brand Name' || name === 'Brands') continue;
    brands.push(name);
  }

  return brands;
}

function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Cycle 7 - Assign Brands to SBU');
  console.log('═'.repeat(60));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Verify target SBU exists
    const targetSBU = await SBU.findById(TARGET_SBU_ID);
    if (!targetSBU) {
      console.error(`❌ Target SBU not found: ${TARGET_SBU_ID}`);
      process.exit(1);
    }
    console.log(`🎯 Target SBU: "${targetSBU.name}" (${TARGET_SBU_ID})\n`);

    const brandNames = parseBrandNames();
    console.log(`📋 Found ${brandNames.length} brands in markdown\n`);

    const existingBrandIds = new Set(targetSBU.brands.map(id => String(id)));

    // Look up all brands
    const results = [];
    for (const rawName of brandNames) {
      const brand = await findBrand(rawName);
      if (brand) {
        const alreadyIn = existingBrandIds.has(String(brand._id));
        results.push({ rawName, brand, alreadyIn });
        const status = alreadyIn ? '⏭️  already in SBU' : '✅ found';
        console.log(`   ${status}: "${rawName}" → ${brand.name} (${brand._id})`);
      } else {
        results.push({ rawName, brand: null, alreadyIn: false });
        console.log(`   ❌ NOT FOUND: "${rawName}"`);
      }
    }

    const toAssign = results.filter(r => r.brand && !r.alreadyIn);
    const notFound = results.filter(r => !r.brand);
    const alreadyIn = results.filter(r => r.alreadyIn);

    console.log('\n' + '─'.repeat(60));
    console.log(`   To assign:    ${toAssign.length}`);
    console.log(`   Already in:   ${alreadyIn.length}`);
    console.log(`   Not found:    ${notFound.length}`);
    console.log('─'.repeat(60));

    if (toAssign.length === 0) {
      console.log('\n   Nothing to assign.');
      return;
    }

    const answer = await askUser('\n🔧 Proceed with assignment? (yes/no): ');
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('   Skipped.');
      return;
    }

    // Assign all at once using $addToSet
    const brandIds = toAssign.map(r => r.brand._id);
    await SBU.findByIdAndUpdate(TARGET_SBU_ID, {
      $addToSet: { brands: { $each: brandIds } },
    });

    console.log(`\n   ✅ Assigned ${brandIds.length} brands to "${targetSBU.name}"`);

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

main();
