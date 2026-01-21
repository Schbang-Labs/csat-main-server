/**
 * Activate Cycle Script
 * - Marks 2025 cycles as 'completed'
 * - Marks 2026 Cycle 1 as 'active'
 * - Marks 2026 Cycles 2-6 as 'upcoming'
 *
 * Usage:
 *   node scripts/Test/activateCycle.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Cycle } from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

async function activateCycle() {
  console.log('═'.repeat(60));
  console.log('  Cycle Activation Script');
  console.log('═'.repeat(60));
  console.log(`\n📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Mark all 2025 cycles as 'completed'
    console.log('📅 Step 1: Marking 2025 cycles as completed...\n');

    const complete2025Result = await Cycle.updateMany(
      { year: 2025 },
      { $set: { status: 'completed' } }
    );

    console.log(
      `   ✓ Marked ${complete2025Result.modifiedCount} 2025 cycle(s) as completed`
    );

    // Step 2: Find or create 2026 cycles
    console.log('\n📅 Step 2: Finding/Creating 2026 cycles...\n');

    let cycle2026_1 = await Cycle.findOne({ year: 2026, cycleNumber: 1 });

    if (!cycle2026_1) {
      console.log('   ⚠️  2026 cycles not found, creating them...');
      await Cycle.createYearCycles(2026);
      cycle2026_1 = await Cycle.findOne({ year: 2026, cycleNumber: 1 });
      console.log('   ✓ Created 2026 cycles');
    }

    if (!cycle2026_1) {
      throw new Error('Failed to find or create 2026 Cycle 1');
    }

    // Step 3: Set 2026 Cycle 1 as active
    console.log('\n📅 Step 3: Activating 2026 Cycle 1...\n');

    await Cycle.updateOne(
      { year: 2026, cycleNumber: 1 },
      { $set: { status: 'active' } }
    );

    console.log('   ✓ Activated: Cycle 1 (2026)');

    // Step 4: Set 2026 Cycles 2-6 as 'upcoming'
    console.log('\n📅 Step 4: Marking 2026 Cycles 2-6 as upcoming...\n');

    const upcomingResult = await Cycle.updateMany(
      { year: 2026, cycleNumber: { $gte: 2 } },
      { $set: { status: 'upcoming' } }
    );

    console.log(
      `   ✓ Marked ${upcomingResult.modifiedCount} 2026 cycle(s) as upcoming`
    );

    // Refresh cycle info for display
    cycle2026_1 = await Cycle.findOne({ year: 2026, cycleNumber: 1 });
    console.log(
      `\n   📌 Active Cycle: ${cycle2026_1.name} (${cycle2026_1.year})`
    );
    console.log(`   📌 Cycle ID: ${cycle2026_1._id}`);
    console.log(
      `   📌 Date Range: ${cycle2026_1.startDate.toDateString()} - ${cycle2026_1.endDate.toDateString()}`
    );

    // Summary
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Summary:');
    console.log('─'.repeat(60));

    const allCycles = await Cycle.find().sort({ year: -1, cycleNumber: -1 });

    console.log('\n   Status of all cycles:');
    for (const c of allCycles) {
      const statusIcon =
        c.status === 'active' ? '🟢' : c.status === 'completed' ? '🔴' : '🟡';
      console.log(`   ${statusIcon} ${c.year} ${c.name}: ${c.status}`);
    }

    console.log('\n✅ Cycle activation completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    console.log('═'.repeat(60));
  }
}

// Run the script
activateCycle();
