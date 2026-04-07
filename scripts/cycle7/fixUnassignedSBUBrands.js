/**
 * Cycle 7 - Assign Unassigned Brands to Their Correct SBUs
 *
 * Only handles brands that are currently NOT in any SBU's brands[] array.
 * Pushes the brand's ObjectId into the correct SBU.brands[].
 *
 * Run with: node scripts/cycle7/fixUnassignedSBUBrands.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Brand, SBU } from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Brands that are currently in NO SBU and need to be assigned.
 * Format: { brandName, expectedSBUName }
 */
const UNASSIGNED_BRANDS = [
  { brandName: 'Maybelline', expectedSBU: 'SBU Global India' },
  { brandName: 'Pepsi Srilanka', expectedSBU: 'SBU Global India' },
  { brandName: 'MTR', expectedSBU: 'SBU For the Craft' },
  { brandName: 'Amazon Fresh', expectedSBU: 'SBU For the Craft' },
  { brandName: "Domino's", expectedSBU: 'SBU India Rising 3' },
  { brandName: 'Fevicryl Hobby Ideas', expectedSBU: 'SBU India Rising 1' },
  { brandName: 'ITC', expectedSBU: 'SBU India Rising 1' },
  { brandName: 'Milex', expectedSBU: 'SBU India Rising 1' },
  { brandName: 'Morde Chocolates', expectedSBU: 'SBU India on the Move 2' },
  { brandName: 'Pot & Bloom', expectedSBUId: '697094d7818800e6498d1682' }, // Tech - Carolyn Fernandes
];

async function findBrand(brandName) {
  let brand = await Brand.findOne({ name: brandName });
  if (brand) return brand;

  brand = await Brand.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(brandName)}$`, 'i') },
  });
  if (brand) return brand;

  const slug = generateSlug(brandName);
  brand = await Brand.findOne({ slug });
  return brand || null;
}

async function fixUnassignedSBUBrands() {
  console.log('═'.repeat(60));
  console.log('  Cycle 7 - Assign Unassigned Brands to SBUs');
  console.log('═'.repeat(60));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Load all SBUs
    const allSBUs = await SBU.find({ isActive: true });
    const sbuByName = new Map();
    for (const sbu of allSBUs) {
      sbuByName.set(sbu.name, sbu);
    }
    console.log(`📋 Loaded ${sbuByName.size} SBUs\n`);

    let assigned = 0;
    let skipped = 0;
    let errors = 0;

    // Also build ID lookup
    const sbuById = new Map();
    for (const sbu of allSBUs) {
      sbuById.set(String(sbu._id), sbu);
    }

    for (const { brandName, expectedSBU, expectedSBUId } of UNASSIGNED_BRANDS) {
      // Find brand
      const brand = await findBrand(brandName);
      if (!brand) {
        console.log(`   ❌ Brand not found in DB: "${brandName}"`);
        errors++;
        continue;
      }

      // Find SBU by name or direct ID
      const sbu = expectedSBUId ? sbuById.get(expectedSBUId) : sbuByName.get(expectedSBU);
      if (!sbu) {
        console.log(`   ❌ SBU not found in DB: "${expectedSBU || expectedSBUId}" (for brand "${brandName}")`);
        errors++;
        continue;
      }

      // Check if brand is already in this SBU
      const alreadyIn = sbu.brands.some(id => String(id) === String(brand._id));
      if (alreadyIn) {
        console.log(`   ⏭️  Already in SBU: "${brandName}" → "${expectedSBU}"`);
        skipped++;
        continue;
      }

      // Push brand into SBU.brands[]
      sbu.brands.push(brand._id);
      await sbu.save();
      console.log(`   ✅ Assigned: "${brandName}" (${brand._id}) → "${expectedSBU}"`);
      assigned++;
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('  Summary');
    console.log('═'.repeat(60));
    console.log(`   Total:     ${UNASSIGNED_BRANDS.length}`);
    console.log(`   Assigned:  ${assigned}`);
    console.log(`   Skipped:   ${skipped}`);
    console.log(`   Errors:    ${errors}`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixUnassignedSBUBrands();
