/**
 * Seed Script - Initialize CSAT Database
 * Main seed script that orchestrates the entire seeding process
 *
 * Seeding Order:
 * 1. Departments - Core departments (solutions, media, tech, seo, martech, fluence, smp)
 * 2. Cycles - Survey cycles for current and previous years
 *
 * Run with: node scripts/seedDatabase.js
 *
 * After running this, run the following in order:
 * - node scripts/seedSBUs.js (seeds SBUs with proper structure)
 * - node scripts/seedBrands.js (seeds brands with SBU mappings)
 * - node scripts/seedCSATResponses.js (seeds CSAT responses)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Department, Cycle } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * Departments Data
 * Based on organizational structure - 7 departments
 */
const DEPARTMENTS = [
  {
    name: 'solutions',
    displayName: 'Brand Solutions',
    description: 'Brand strategy, creative, and account management',
    hasSBUs: true, // Solutions has proper SBU names
  },
  {
    name: 'media',
    displayName: 'Media',
    description: 'Performance marketing and media buying',
    hasSBUs: false, // No SBU names, but has EVP and AVPs
  },
  {
    name: 'tech',
    displayName: 'Tech',
    description: 'Technical development and engineering',
    hasSBUs: false,
  },
  {
    name: 'seo',
    displayName: 'SEO/Content',
    description: 'Search engine optimization and content strategy',
    hasSBUs: false,
  },
  {
    name: 'martech',
    displayName: 'MarTech',
    description: 'Marketing technology and automation',
    hasSBUs: false,
  },
  {
    name: 'fluence',
    displayName: 'Fluence',
    description: 'Influencer marketing and creator partnerships',
    hasSBUs: false,
  },
  {
    name: 'smp',
    displayName: 'SMP',
    description: 'Social media production and film production',
    hasSBUs: false,
  },
];

/**
 * Seed Departments
 */
async function seedDepartments() {
  console.log('🏢 Seeding Departments...\n');

  let created = 0;
  let updated = 0;

  for (const dept of DEPARTMENTS) {
    try {
      const existing = await Department.findOne({ name: dept.name });

      if (existing) {
        await Department.findOneAndUpdate(
          { name: dept.name },
          { ...dept, isActive: true },
          { new: true }
        );
        updated++;
        console.log(`  ✓ Updated: ${dept.displayName} (${dept.name})`);
      } else {
        await Department.create({ ...dept, isActive: true });
        created++;
        console.log(`  ✓ Created: ${dept.displayName} (${dept.name})`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed ${dept.name}:`, error.message);
    }
  }

  console.log(`\n✅ Departments: ${created} created, ${updated} updated`);
}

/**
 * Seed Cycles for current and previous year
 */
async function seedCycles() {
  console.log('\n📅 Seeding Cycles...\n');

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  for (const year of years) {
    try {
      const existingCycles = await Cycle.find({ year });
      if (existingCycles.length > 0) {
        console.log(
          `  ✓ Year ${year} cycles already exist (${existingCycles.length} cycles)`
        );
      } else {
        await Cycle.createYearCycles(year);
        console.log(`  ✓ Year ${year} cycles created`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed cycles for ${year}:`, error.message);
    }
  }

  const totalCycles = await Cycle.countDocuments();
  console.log(`\n✅ Total Cycles: ${totalCycles}`);
}

/**
 * Display seeding instructions
 */
function displayNextSteps() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 NEXT STEPS - Run these scripts in order:');
  console.log('='.repeat(60));
  console.log('\n1️⃣  Seed SBUs (PODs):');
  console.log('    node scripts/seedSBUs.js');
  console.log('\n2️⃣  Seed Brands:');
  console.log('    node scripts/seedBrands.js');
  console.log('\n3️⃣  Seed CSAT Responses (optional, for test data):');
  console.log('    node scripts/seedCSATResponses.js');
  console.log('\n' + '='.repeat(60));
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting CSAT Database Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));

    // Step 1: Seed Departments
    await seedDepartments();

    // Step 2: Seed Cycles
    await seedCycles();

    console.log('\n🎉 Base database seeding completed successfully!');

    // Summary
    const [deptCount, cycleCount] = await Promise.all([
      Department.countDocuments(),
      Cycle.countDocuments(),
    ]);

    console.log('\n📊 Summary:');
    console.log(`   Departments: ${deptCount}`);
    console.log(`   Cycles: ${cycleCount}`);

    // Display next steps
    displayNextSteps();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run seed
seed();
