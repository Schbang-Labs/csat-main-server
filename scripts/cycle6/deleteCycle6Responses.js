/**
 * Delete CSAT Responses for a specific Cycle
 * 
 * This script deletes all csat_responses where cycleId matches the specified cycle.
 * 
 * Run: node scripts/cycle6/deleteCycle6Responses.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import CSATResponse from '../../src/models/csatResponse.model.js';

const CYCLE_ID = '697094a7eeeba79186851689';

const main = async () => {
    console.log('🚀 Delete CSAT Responses Script');
    console.log('================================================\n');
    console.log(`🎯 Target Cycle ID: ${CYCLE_ID}\n`);

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Count responses before deletion
        const countBefore = await CSATResponse.countDocuments({
            cycleId: new mongoose.Types.ObjectId(CYCLE_ID)
        });
        console.log(`📊 Found ${countBefore} CSAT responses for this cycle\n`);

        if (countBefore === 0) {
            console.log('ℹ️  No responses to delete.');
            return;
        }

        // Delete all responses for this cycle
        console.log('🗑️  Deleting responses...');
        const result = await CSATResponse.deleteMany({
            cycleId: new mongoose.Types.ObjectId(CYCLE_ID)
        });

        console.log(`\n✅ Successfully deleted ${result.deletedCount} CSAT responses!\n`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

main();
