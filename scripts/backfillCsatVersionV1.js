import 'dotenv/config';
import mongoose from 'mongoose';
import CSATResponse from '../src/models/csatResponse.model.js';

const run = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required in environment');
  }

  await mongoose.connect(mongoUri);

  const totalResponses = await CSATResponse.countDocuments({});
  const alreadyVersioned = await CSATResponse.countDocuments({
    version: { $exists: true, $ne: null },
  });

  const result = await CSATResponse.updateMany(
    {
      $or: [
        { version: { $exists: false } },
        { version: null },
        { version: '' },
      ],
    },
    {
      $set: {
        version: 'v1',
      },
    }
  );

  console.log('CSAT version backfill complete');
  console.log(`Total responses: ${totalResponses}`);
  console.log(`Already versioned: ${alreadyVersioned}`);
  console.log(`Matched for backfill: ${result.matchedCount}`);
  console.log(`Updated to version "v1": ${result.modifiedCount}`);
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async error => {
    console.error('CSAT version backfill failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
