/**
 * Service Strategy Migration
 * Initializes new service-strategy fields for existing documents.
 *
 * Run with:
 *   node scripts/migrateServiceStrategy.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  Department,
  Brand,
  Client,
  CSATResponse,
} from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('MONGO_URI is not defined in .env');
  process.exit(1);
}

const runMigration = async () => {
  console.log('Starting Service Strategy migration...');
  console.log(`Connecting to ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const departmentResult = await Department.updateMany(
      {
        $or: [{ services: { $exists: false } }, { services: null }],
      },
      {
        $set: { services: [] },
      }
    );

    const brandResult = await Brand.updateMany(
      {},
      {
        $set: { 'services.$[service].subservices': [] },
      },
      {
        arrayFilters: [{ 'service.subservices': { $exists: false } }],
      }
    );

    const clientResult = await Client.updateMany(
      {},
      {
        $set: { 'serviceMapping.$[mapping].subservices': [] },
      },
      {
        arrayFilters: [{ 'mapping.subservices': { $exists: false } }],
      }
    );

    const csatResponseResult = await CSATResponse.updateMany(
      {
        $or: [{ services: { $exists: false } }, { services: null }],
      },
      {
        $set: { services: [] },
      }
    );

    console.log('Migration completed successfully');
    console.log(`Departments initialized: ${departmentResult.modifiedCount}`);
    console.log(`Brand service rows initialized: ${brandResult.modifiedCount}`);
    console.log(`Client mapping rows initialized: ${clientResult.modifiedCount}`);
    console.log(`CSAT responses initialized: ${csatResponseResult.modifiedCount}`);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

runMigration();
