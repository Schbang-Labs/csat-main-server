#!/usr/bin/env node
/**
 * Snapshot History Script - Cycle End Finalization
 *
 * Creates history snapshots for all SBUs, Clients, and Brands for a given cycle,
 * then updates all CSATResponse documents with the corresponding history IDs.
 *
 * Usage:
 *   node scripts/snapshotHistory.js [cycleId]
 *   - If cycleId is provided, finalizes that specific cycle
 *   - If not provided, uses the current active cycle
 *
 * Run this script:
 *   - When a cycle ends and you want to freeze the historical state
 *   - Before moving to a new cycle
 *   - To backfill history IDs for existing CSAT responses
 *
 * What it does:
 *   1. Creates BrandHistory records for all active brands
 *   2. Creates ClientHistory records for all active clients
 *   3. Creates SBUHistory records for all active SBUs
 *   4. Updates all CSATResponse documents for the cycle with:
 *      - brandHistoryId
 *      - clientHistoryId
 *      - sbuHistoryId
 *   5. Marks the cycle as 'completed'
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Cycle } from '../src/models/index.js';
import { finalizeCycleHistory } from '../src/services/history.service.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get cycle ID from command line argument
    const cycleIdArg = process.argv[2];
    let cycleId;
    let cycle;

    if (cycleIdArg) {
      // Use provided cycleId
      cycle = await Cycle.findById(cycleIdArg);
      if (!cycle) {
        console.error(`❌ Cycle with ID ${cycleIdArg} not found.`);
        process.exit(1);
      }
      cycleId = cycle._id;
      console.log(`📅 Using specified cycle: ${cycle.name} (${cycle.year})`);
    } else {
      // Find current active cycle
      cycle = await Cycle.getCurrentCycle();
      if (!cycle) {
        console.error('❌ No active cycle found. Please provide a cycleId.');
        console.error('Usage: node scripts/snapshotHistory.js <cycleId>');
        process.exit(1);
      }
      cycleId = cycle._id;
      console.log(
        `📅 Using current active cycle: ${cycle.name} (${cycle.year})`
      );
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('  CYCLE END FINALIZATION');
    console.log(
      `  Cycle: ${cycle.name} | Year: ${cycle.year} | ID: ${cycleId}`
    );
    console.log(`${'='.repeat(60)}\n`);

    // Ask for confirmation (skip in non-interactive mode)
    const forceFlag =
      process.argv.includes('--force') || process.argv.includes('-f');
    if (forceFlag) {
      console.log(
        '⚠️  Running with --force flag, skipping confirmation and allowing re-finalization\n'
      );
    } else {
      console.log('⚠️  This will:');
      console.log(
        '   1. Create history snapshots for all Brands, Clients, and SBUs'
      );
      console.log('   2. Update all CSAT responses with history IDs');
      console.log('   3. Mark the cycle as "completed"\n');
    }

    // Run the finalization (pass force flag to allow re-finalization)
    const results = await finalizeCycleHistory(cycleId, { force: forceFlag });

    // Display results
    console.log(`\n${'='.repeat(60)}`);
    console.log('  📊 FINALIZATION COMPLETE');
    console.log(`${'='.repeat(60)}\n`);

    console.log('📜 History Snapshots Created:');
    console.log(`   • Brands:  ${results.snapshots.brands}`);
    console.log(`   • Clients: ${results.snapshots.clients}`);
    console.log(`   • SBUs:    ${results.snapshots.sbus}`);

    console.log('\n📝 CSAT Response Updates:');
    console.log(`   • Total responses: ${results.updates.totalResponses}`);
    console.log(`   • Updated:         ${results.updates.updated}`);
    console.log(`   • Skipped:         ${results.updates.skipped}`);
    console.log(`   • Errors:          ${results.updates.errors}`);

    console.log('\n✅ Cycle finalization complete!');
    console.log('   Historical data is now frozen for this cycle.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

main();
