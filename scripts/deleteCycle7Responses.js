/**
 * Delete all CSAT responses for Cycle 7 (2026)
 *
 * Finds the cycle with cycleNumber: 7, year: 2026, then deletes
 * all CSATResponse documents linked to that cycleId.
 *
 * Run with: node scripts/deleteCycle7Responses.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Cycle, CSATResponse } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

async function deleteCycle7Responses() {
  console.log('═'.repeat(60));
  console.log('  Delete Cycle 7 (2026) CSAT Responses');
  console.log('═'.repeat(60));
  console.log(`\n📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find Cycle 7 for 2025
    const cycle = await Cycle.findOne({ year: 2025, cycleNumber: 7 });

    if (!cycle) {
      console.log('⚠️  No Cycle 7 found for year 2025. Nothing to delete.');
      return;
    }

    console.log(`📌 Found Cycle: ${cycle.name} (ID: ${cycle._id})`);
    console.log(`   Date Range: ${cycle.startDate.toDateString()} - ${cycle.endDate.toDateString()}\n`);

    // Step 2: Count responses before deletion
    const count = await CSATResponse.countDocuments({ cycleId: cycle._id });
    console.log(`📊 Found ${count} CSAT response(s) for Cycle 7 (2025)\n`);

    if (count === 0) {
      console.log('✅ No responses to delete.');
      return;
    }

    // Step 3: Delete all responses for this cycle
    const result = await CSATResponse.deleteMany({ cycleId: cycle._id });

    console.log(`🗑️  Deleted ${result.deletedCount} CSAT response(s)`);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Cleanup completed successfully!');
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

deleteCycle7Responses();
