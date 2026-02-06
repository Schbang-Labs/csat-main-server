/**
 * Insert CSAT Response for Reliance Jio
 * 
 * This script inserts a CSAT response for Reliance Jio brand
 * based on the data from implementation.md
 * 
 * Data:
 * - Whatsapp: 919833630733
 * - Overall Satisfaction: 5
 * - Likelihood To Recommend: 5
 * - North Star Metrics: 5
 * - Senior Leadership Involvement: 5
 * - Strategy Execution: 5
 * - Team Responsiveness: 5
 * - Brand Understanding: 5
 * - Data Effectiveness: 5
 * - Team Proactivity: 5
 * - Meeting Business Goals: 5
 * - Quality Of Design And Video: 5
 * - Quality Of Ideas: 5
 * - Comment: "-----"
 * - CreatedAt: 2/4/2026, 12:25:04
 * 
 * Run: node scripts/cycle6/insertRelianceJioCsat.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import Brand from '../../src/models/brand.model.js';
import Client from '../../src/models/client.model.js';
import Department from '../../src/models/department.model.js';
import SBU from '../../src/models/sbu.model.js';
import CSATResponse from '../../src/models/csatResponse.model.js';

const CYCLE_ID = '697094a7eeeba79186851689';
const PHONE_NUMBER = '919833630733';
const BRAND_NAME = 'Reliance Jio';

// CSAT Response Data from implementation.md
const CSAT_DATA = {
    coreMetrics: {
        overallSatisfaction: 5,
        likelihoodToRecommend: 5,
        northStarMetrics: 5,
        seniorLeadershipInvolvement: 5,
        strategyExecution: 5,
        teamResponsiveness: 5,
        brandUnderstanding: 5,
    },
    deliveryMetrics: {
        dataEffectiveness: 5,
        teamProactivity: 5,
        meetingBusinessGoals: 5,
    },
    qualityEvaluation: {
        qualityOfDesignVideo: 5,
        qualityOfIdeas: 5,
    },
    formVersion: 'v1',
    filledAt: new Date('2026-02-04T12:25:04.000Z'),
};

const COMMENT = '-----';

const main = async () => {
    console.log('🚀 Insert CSAT Response for Reliance Jio');
    console.log('================================================\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Find the Brand
        console.log(`🔍 Looking for brand: ${BRAND_NAME}...`);
        const brand = await Brand.findOne({
            name: { $regex: new RegExp(`^${BRAND_NAME}$`, 'i') }
        });

        if (!brand) {
            console.log(`❌ Brand not found: ${BRAND_NAME}`);
            return;
        }
        console.log(`   ✅ Found brand: ${brand.name} (${brand._id})`);

        // 2. Find the Client by phone
        console.log(`\n🔍 Looking for client with phone: ${PHONE_NUMBER}...`);
        let client = await Client.findOne({
            brandId: brand._id,
            phone: { $regex: PHONE_NUMBER.slice(-10) } // Match last 10 digits
        });

        if (!client) {
            // Try to find by just phone number
            client = await Client.findOne({
                phone: { $regex: PHONE_NUMBER.slice(-10) }
            });
        }

        if (!client) {
            console.log('❌ Client not found with this phone number');
            console.log('   Creating a new client...');

            // Create client
            client = new Client({
                brandId: brand._id,
                name: 'Reliance Jio POC',
                phone: PHONE_NUMBER,
                serviceMapping: [{
                    department: 'solutions',
                    isActive: true,
                }],
                isActive: true,
            });
            await client.save();
            console.log(`   ✅ Created client: ${client.name} (${client._id})`);
        } else {
            console.log(`   ✅ Found client: ${client.name} (${client._id})`);
        }

        // 3. Find the Department (Solutions)
        console.log('\n🔍 Looking for Solutions department...');
        const department = await Department.findOne({ name: 'solutions' });

        if (!department) {
            console.log('❌ Solutions department not found');
            return;
        }
        console.log(`   ✅ Found department: ${department.displayName || department.name} (${department._id})`);

        // 4. Find the SBU for this brand in Solutions
        console.log(`\n🔍 Looking for SBU for ${BRAND_NAME} in Solutions...`);

        // Find SBU that has this brand in its brands array
        let sbu = await SBU.findOne({
            departmentId: department._id,
            brands: brand._id,
            isActive: true,
        });

        if (!sbu) {
            // Try to get SBU from brand's services
            const brandService = brand.services?.find(s => s.department === 'solutions');
            if (brandService?.sbuId) {
                sbu = await SBU.findById(brandService.sbuId);
            }
        }

        if (!sbu) {
            console.log('⚠️  SBU not found for this brand, will set sbuId to null');
        } else {
            console.log(`   ✅ Found SBU: ${sbu.name} (${sbu._id})`);
        }

        // 5. Check if response already exists
        console.log('\n🔍 Checking if response already exists...');
        const existingResponse = await CSATResponse.findOne({
            brandId: brand._id,
            clientId: client._id,
            cycleId: new mongoose.Types.ObjectId(CYCLE_ID),
            departmentId: department._id,
        });

        if (existingResponse) {
            console.log('⚠️  Response already exists! Deleting old one...');
            await CSATResponse.deleteOne({ _id: existingResponse._id });
            console.log('   ✅ Old response deleted');
        }

        // 6. Create the CSAT response
        console.log('\n📝 Creating CSAT response...');
        const csatResponse = new CSATResponse({
            brandId: brand._id,
            clientId: client._id,
            cycleId: new mongoose.Types.ObjectId(CYCLE_ID),
            departmentId: department._id,
            sbuId: sbu?._id || null,
            brandHistoryId: null,
            clientHistoryId: null,
            sbuHistoryId: null,
            submittedAt: new Date('2026-02-04T12:25:04.000Z'),
            data: CSAT_DATA,
            comment: COMMENT,
            isValid: true,
        });

        await csatResponse.save();

        console.log('\n================================================');
        console.log('✅ CSAT Response Created Successfully!');
        console.log('================================================');
        console.log(`\n📊 Response Details:`);
        console.log(`   Brand: ${brand.name}`);
        console.log(`   Client: ${client.name} (${client.phone})`);
        console.log(`   Department: ${department.displayName || department.name}`);
        console.log(`   SBU: ${sbu?.name || 'N/A'}`);
        console.log(`   Cycle ID: ${CYCLE_ID}`);
        console.log(`   Overall Satisfaction: ${CSAT_DATA.coreMetrics.overallSatisfaction}`);
        console.log(`   NPS: ${CSAT_DATA.coreMetrics.likelihoodToRecommend}`);
        console.log(`   Comment: "${COMMENT}"`);
        console.log(`   Response ID: ${csatResponse._id}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
};

main();
