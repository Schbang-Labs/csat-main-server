/**
 * Backfill Script - Populate root `isActive` on ClientHistory and BrandHistory
 *
 * For each history doc:
 *   - Look up the live Client / Brand by id
 *   - Set `isActive` to the live entity's `isActive`
 *   - If live entity is missing (deleted), set `isActive: false`
 *
 * Uses bulkWrite in batches of 1000. Idempotent — rerunning overwrites with
 * the current live state each time.
 *
 * Run: node scripts/backfillHistoryIsActive.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import {
  Brand,
  Client,
  ClientHistory,
  BrandHistory,
} from '../src/models/index.js';

const BATCH_SIZE = 1000;

async function backfillCollection({ HistoryModel, LiveModel, sourceIdField, label }) {
  console.log(`\n── ${label} ─────────────────────────────────────────────`);

  const total = await HistoryModel.countDocuments({});
  console.log(`Total ${label} docs: ${total}`);

  let processed = 0;
  let setTrue = 0;
  let setFalse = 0;
  let missingLive = 0;

  const cursor = HistoryModel.find({}, { _id: 1, [sourceIdField]: 1 })
    .lean()
    .cursor();

  let batch = [];
  for await (const doc of cursor) {
    const sourceId = doc[sourceIdField];
    const live = sourceId
      ? await LiveModel.findById(sourceId, { isActive: 1 }).lean()
      : null;

    let isActive;
    if (!live) {
      isActive = false;
      missingLive++;
    } else {
      isActive = live.isActive !== false;
    }

    if (isActive) setTrue++;
    else setFalse++;

    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { isActive } },
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await HistoryModel.bulkWrite(batch, { ordered: false });
      processed += batch.length;
      console.log(`  Processed ${processed}/${total}`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await HistoryModel.bulkWrite(batch, { ordered: false });
    processed += batch.length;
    console.log(`  Processed ${processed}/${total}`);
  }

  console.log(`Done ${label}:`);
  console.log(`  set-true:     ${setTrue}`);
  console.log(`  set-false:    ${setFalse}`);
  console.log(`  missing-live: ${missingLive}`);
}

async function main() {
  console.log('========================================================');
  console.log('  Backfill isActive on ClientHistory & BrandHistory');
  console.log('========================================================');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await backfillCollection({
      HistoryModel: ClientHistory,
      LiveModel: Client,
      sourceIdField: 'clientId',
      label: 'ClientHistory',
    });

    await backfillCollection({
      HistoryModel: BrandHistory,
      LiveModel: Brand,
      sourceIdField: 'brandId',
      label: 'BrandHistory',
    });

    console.log('\n========================================================');
    console.log('  Backfill complete');
    console.log('========================================================');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
