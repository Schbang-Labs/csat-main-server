/**
 * Master Seeding Script - CSAT Database Orchestrator
 *
 * This script runs the entire seeding process in the correct order:
 *
 * EXECUTION ORDER:
 * ================
 * 1. Base Setup (Departments & Cycles) - seedDatabase.js
 * 2. Cycle 5 (Current/Active Cycle):
 *    - SBUs -> Brands -> Clients -> CSATResponses
 *    - Finalize History (snapshotHistory.js) - Creates history snapshots
 * 3. Cycles 4, 3, 2, 1 (Historical Cycles):
 *    - BrandsAndClients (creates BrandHistory & ClientHistory during seeding)
 *    - SBUs (creates SBUHistory during seeding)
 *    - CSATResponses (links to existing history IDs)
 *    - NOTE: snapshotHistory.js is NOT needed for Cycles 1-4 because
 *            their seeding scripts already create history snapshots directly!
 *
 * IMPORTANT NOTES:
 * ================
 * - Cycles 1-4 seeding scripts (seedCycle${N}BrandsAndClients.js, etc.)
 *   already create BrandHistory, ClientHistory, and SBUHistory entries
 *   during seeding. The snapshotHistory.js script would be redundant.
 *
 * - The CSATResponses for Cycles 1-4 are seeded WITH history IDs pre-populated
 *   (brandHistoryId, clientHistoryId, sbuHistoryId) because the history
 *   records already exist from the previous seeding steps.
 *
 * - Only Cycle 5 needs snapshotHistory.js to finalize because its seeding
 *   scripts work with CURRENT/LIVE data, not historical data.
 *
 * Order: Cycle 5 -> Cycle 4 -> Cycle 3 -> Cycle 2 -> Cycle 1
 *
 * Usage: node scripts/mainScript.js
 */

import { execSync } from 'child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Cycle } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * Helper to run a script and wait for completion
 */
function runScript(path, args = []) {
  const command = `node ${path} ${args.join(' ')}`;
  console.log(`\n${'='.repeat(64)}`);
  console.log(`🚀 EXECUTING: ${command}`);
  console.log(`${'='.repeat(64)}\n`);

  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ SUCCESS: ${path}\n`);
  } catch (error) {
    console.error(`\n❌ FAILED: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🌟 Starting Master Database Seeding Process...\n');
  console.log('📋 Execution Plan:');
  console.log('   1. Base Framework (Departments & Cycles)');
  console.log('   2. Cycle 5 (Current) - Seed data then finalize history');
  console.log('   3. Cycles 4-1 (Historical) - Seed with pre-built history');
  console.log('');

  // ======================================================================
  // PHASE 1: Base Framework Setup
  // ======================================================================
  console.log('\n' + '='.repeat(64));
  console.log('📦 PHASE 1: BASE FRAMEWORK SETUP');
  console.log('='.repeat(64));
  runScript('scripts/seedDatabase.js');

  // Connect to DB to get Cycle IDs
  await mongoose.connect(MONGODB_URI);
  const cycles = await Cycle.find({}).sort({ year: -1, cycleNumber: -1 });

  // Create a map for easy lookup
  const cycleMap = {};
  cycles.forEach(c => {
    cycleMap[c.cycleNumber] = c._id.toString();
  });

  await mongoose.disconnect();

  // ======================================================================
  // PHASE 2: Cycle 5 (Current/Active Cycle)
  // ======================================================================
  const cycle5Id = cycleMap[5];
  if (cycle5Id) {
    console.log('\n' + '='.repeat(64));
    console.log('📅 PHASE 2: CYCLE 5 (Current Cycle ID: ' + cycle5Id + ')');
    console.log('='.repeat(64));
    console.log(
      '   Order: SBUs -> Brands -> Clients -> CSATResponses -> Finalize History'
    );

    runScript('scripts/cycle5/seedSBUs.js');
    runScript('scripts/cycle5/seedBrands.js');
    runScript('scripts/cycle5/seedClients.js');
    runScript('scripts/cycle5/seedCSATResponses.js');

    // Finalize History for Cycle 5 (required for current cycle)
    console.log('\n--- Finalizing Cycle 5 History (Creating Snapshots) ---');
    runScript('scripts/snapshotHistory.js', [cycle5Id, '--force']);
  } else {
    console.warn('⚠️  Cycle 5 not found in database, skipping...');
  }

  // ======================================================================
  // PHASE 3: Cycles 4, 3, 2, 1 (Historical Cycles)
  // These scripts already create their own history snapshots during seeding!
  // ======================================================================
  const historicalCycles = [4, 3, 2, 1];

  for (const num of historicalCycles) {
    const cycleId = cycleMap[num];
    if (!cycleId) {
      console.warn(`⚠️  Cycle ${num} not found in database, skipping...`);
      continue;
    }

    console.log('\n' + '='.repeat(64));
    console.log(`📅 PHASE 3: CYCLE ${num} (Historical Cycle ID: ${cycleId})`);
    console.log('='.repeat(64));
    console.log('   Order: BrandsAndClients -> SBUs -> CSATResponses');
    console.log(
      '   ℹ️  History snapshots are created during seeding (no snapshotHistory.js needed)'
    );

    // Cycle 4-1 specific order:
    // - BrandsAndClients: Creates brands, clients, AND their history snapshots
    // - SBUs: Creates SBUs AND SBUHistory entries
    // - CSATResponses: Creates responses WITH history IDs already linked
    runScript(`scripts/cycle${num}/seedCycle${num}BrandsAndClients.js`);
    runScript(`scripts/cycle${num}/seedCycle${num}SBUs.js`);
    runScript(`scripts/cycle${num}/seedCycle${num}CSATResponses.js`);

    // NOTE: We DO NOT run snapshotHistory.js for historical cycles because:
    // 1. BrandHistory entries are already created by seedCycle${num}BrandsAndClients.js
    // 2. ClientHistory entries are already created by seedCycle${num}BrandsAndClients.js
    // 3. SBUHistory entries are already created by seedCycle${num}SBUs.js
    // 4. CSATResponses already have brandHistoryId, clientHistoryId, sbuHistoryId populated
    //
    // Running snapshotHistory.js would be redundant and might cause issues
    // by overwriting the carefully seeded historical data.
  }

  // ======================================================================
  // COMPLETION
  // ======================================================================
  console.log('\n' + '='.repeat(64));
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(64));
  console.log('');
  console.log('📊 Summary:');
  console.log('   ✅ Base Framework: Departments & Cycles seeded');
  console.log('   ✅ Cycle 5: Data seeded and history finalized');
  console.log('   ✅ Cycle 4: Historical data seeded with snapshots');
  console.log('   ✅ Cycle 3: Historical data seeded with snapshots');
  console.log('   ✅ Cycle 2: Historical data seeded with snapshots');
  console.log('   ✅ Cycle 1: Historical data seeded with snapshots');
  console.log('');
  console.log('   All cycles from 5 to 1 are now populated with:');
  console.log('   - Brands, Clients, SBUs');
  console.log('   - CSAT Responses');
  console.log(
    '   - Historical Snapshots (BrandHistory, ClientHistory, SBUHistory)'
  );
  console.log('');
  console.log('='.repeat(64) + '\n');
}

main().catch(err => {
  console.error('❌ Master script failed:', err);
  process.exit(1);
});
