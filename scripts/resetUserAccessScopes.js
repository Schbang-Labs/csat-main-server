import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';

const run = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required in environment');
  }

  await mongoose.connect(mongoUri);

  const result = await User.updateMany(
    {},
    {
      $set: {
        role: 'user',
        accessScopes: [],
      },
      $unset: {
        sbuId: '',
      },
    }
  );

  console.log('User access migration complete');
  console.log(`Matched users: ${result.matchedCount}`);
  console.log(`Updated users: ${result.modifiedCount}`);
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async error => {
    console.error('User access migration failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
