/**
 * Seed Script - Initialize CSAT Database
 * Populates initial data for departments, SBUs, and sample cycles
 *
 * Run with: node scripts/seedDatabase.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Department, SBU, Cycle } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/csat-db';

/**
 * Initial Departments Data
 */
const DEPARTMENTS = [
  { name: 'Brand Solutions' },
  { name: 'Media' },
  { name: 'Tech' },
  { name: 'SEO' },
  { name: 'MarTech' },
  { name: 'Fluence' },
  { name: 'SMP' },
];

/**
 * Initial SBUs Data (Brand Solutions PODs from docs)
 */
const BRAND_SOLUTIONS_SBUS = [
  { name: 'Chirag', leadNames: ['Chirag'] },
  { name: 'Samarth', leadNames: ['Samarth'] },
  { name: 'Shreya', leadNames: ['Shreya'] },
  { name: 'Sumesh', leadNames: ['Sumesh'] },
  { name: 'Vrinda', leadNames: ['Vrinda'] },
  { name: 'Amit', leadNames: ['Amit'] },
  { name: 'Dhruv + Malka', leadNames: ['Dhruv', 'Malka'] },
  { name: 'Dhruv + Aniket', leadNames: ['Dhruv', 'Aniket'] },
  { name: 'Dhruv + Ria', leadNames: ['Dhruv', 'Ria'] },
  { name: 'Dhruv + Jainik', leadNames: ['Dhruv', 'Jainik'] },
  { name: 'Rohan + Batul + Reuben', leadNames: ['Rohan', 'Batul', 'Reuben'] },
  { name: 'Rohan + Yohann', leadNames: ['Rohan', 'Yohann'] },
  { name: 'Rohan + Varsha', leadNames: ['Rohan', 'Varsha'] },
  { name: 'Afshaad', leadNames: ['Afshaad'] },
  { name: 'Afshaad + Eric', leadNames: ['Afshaad', 'Eric'] },
];

/**
 * Seed Departments
 */
async function seedDepartments() {
  console.log('🏢 Seeding Departments...');

  for (const dept of DEPARTMENTS) {
    try {
      await Department.findOneAndUpdate(
        { name: dept.name },
        { ...dept, isActive: true },
        { upsert: true, new: true }
      );
      console.log(`  ✓ ${dept.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${dept.name}:`, error.message);
    }
  }

  console.log(`✅ Departments seeded: ${DEPARTMENTS.length}`);
}

/**
 * Seed SBUs for Brand Solutions
 */
async function seedSBUs() {
  console.log('\n🎯 Seeding SBUs (Brand Solutions PODs)...');

  // Get Brand Solutions department
  const solutionsDept = await Department.findOne({ name: 'Brand Solutions' });
  if (!solutionsDept) {
    console.error(
      '  ✗ Brand Solutions department not found. Run seedDepartments first.'
    );
    return;
  }

  for (const sbu of BRAND_SOLUTIONS_SBUS) {
    try {
      const slug = sbu.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      await SBU.findOneAndUpdate(
        { slug },
        {
          name: sbu.name,
          slug,
          departmentId: solutionsDept._id,
          leadNames: sbu.leadNames,
          isActive: true,
        },
        { upsert: true, new: true }
      );
      console.log(`  ✓ ${sbu.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${sbu.name}:`, error.message);
    }
  }

  console.log(`✅ SBUs seeded: ${BRAND_SOLUTIONS_SBUS.length}`);
}

/**
 * Seed Cycles for current and previous year
 */
async function seedCycles() {
  console.log('\n📅 Seeding Cycles...');

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  for (const year of years) {
    try {
      await Cycle.createYearCycles(year);
      console.log(`  ✓ Year ${year} cycles created`);
    } catch (error) {
      console.error(`  ✗ Failed to seed cycles for ${year}:`, error.message);
    }
  }

  const totalCycles = await Cycle.countDocuments();
  console.log(`✅ Cycles seeded: ${totalCycles}`);
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

    await seedDepartments();
    await seedSBUs();
    await seedCycles();

    console.log('\n🎉 Database seeding completed successfully!');

    // Summary
    const [deptCount, sbuCount, cycleCount] = await Promise.all([
      Department.countDocuments(),
      SBU.countDocuments(),
      Cycle.countDocuments(),
    ]);

    console.log('\n📊 Summary:');
    console.log(`   Departments: ${deptCount}`);
    console.log(`   SBUs: ${sbuCount}`);
    console.log(`   Cycles: ${cycleCount}`);
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
