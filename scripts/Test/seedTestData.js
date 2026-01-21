/**
 * Test Data Seed Script
 * Creates and removes test data for development/testing purposes
 *
 * Test Data:
 * - Client: Chetan Marathe (8999431754)
 * - Brand: test-Schbang (POC: Chetan)
 * - SBU: Hayyan Hajwani (7021727327) - aligned with test-Schbang brand
 *
 * Usage:
 *   Add data:    node scripts/Test/seedTestData.js add
 *   Remove data: node scripts/Test/seedTestData.js remove
 *   Default:     node scripts/Test/seedTestData.js (adds data)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  Brand,
  Client,
  SBU,
  Department,
  CSATResponse,
} from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

// Test Data Configuration
const TEST_DATA = {
  client: {
    name: 'kajal ',
    phone: '9508440934',
  },
  brand: {
    name: 'test-Schbang',
    slug: 'test-schbang',
    poc: 'kajal',
  },
  sbu: {
    name: 'Hayyan Hajwani',
    slug: 'hayyan-hajwani',
    phone: '7021727327',
  },
};

/**
 * Add Test Data
 * Creates Brand, Client, and SBU with proper relationships
 */
async function addTestData() {
  console.log('🌱 Adding Test Data...\n');

  try {
    // Step 1: Get the Solutions department (default department for test SBU)
    let department = await Department.findOne({ name: 'solutions' });
    if (!department) {
      console.log('⚠️  Solutions department not found, creating it...');
      department = await Department.create({
        name: 'solutions',
        displayName: 'Brand Solutions',
        description: 'Brand strategy, creative, and account management',
        hasSBUs: true,
        isActive: true,
      });
      console.log('  ✓ Created Solutions department');
    }

    // Step 2: Create or find the Brand
    let brand = await Brand.findOne({ slug: TEST_DATA.brand.slug });
    if (brand) {
      console.log(`  ⚠️  Brand "${TEST_DATA.brand.name}" already exists`);
    } else {
      brand = await Brand.create({
        name: TEST_DATA.brand.name,
        slug: TEST_DATA.brand.slug,
        services: [
          {
            department: 'solutions',
            isActive: true,
          },
        ],
        isActive: true,
      });
      console.log(`  ✓ Created Brand: ${TEST_DATA.brand.name}`);
    }

    // Step 3: Create or find the Client (POC for the brand)
    let client = await Client.findOne({
      brandId: brand._id,
      phone: TEST_DATA.client.phone,
    });
    if (client) {
      console.log(
        `  ⚠️  Client "${TEST_DATA.client.name}" already exists for this brand`
      );
    } else {
      client = await Client.create({
        brandId: brand._id,
        name: TEST_DATA.client.name,
        phone: TEST_DATA.client.phone,
        serviceMapping: [
          {
            department: 'solutions',
            isActive: true,
          },
        ],
        isActive: true,
      });
      console.log(
        `  ✓ Created Client: ${TEST_DATA.client.name} (${TEST_DATA.client.phone})`
      );
    }

    // Step 4: Create or find the SBU
    let sbu = await SBU.findOne({ slug: TEST_DATA.sbu.slug });
    if (sbu) {
      console.log(`  ⚠️  SBU "${TEST_DATA.sbu.name}" already exists`);
      // Update the SBU to include the brand if not already linked
      if (!sbu.brands.includes(brand._id)) {
        sbu.brands.push(brand._id);
        await sbu.save();
        console.log(
          `  ✓ Linked Brand "${TEST_DATA.brand.name}" to SBU "${TEST_DATA.sbu.name}"`
        );
      }
    } else {
      sbu = await SBU.create({
        name: TEST_DATA.sbu.name,
        slug: TEST_DATA.sbu.slug,
        departmentId: department._id,
        executiveVP: TEST_DATA.sbu.name,
        brands: [brand._id],
        isActive: true,
      });
      console.log(
        `  ✓ Created SBU: ${TEST_DATA.sbu.name} (${TEST_DATA.sbu.phone})`
      );
    }

    // Step 5: Update brand to link with SBU
    const solutionsService = brand.services.find(
      s => s.department === 'solutions'
    );
    if (solutionsService && !solutionsService.sbuId) {
      solutionsService.sbuId = sbu._id;
      await brand.save();
      console.log(
        `  ✓ Linked SBU "${TEST_DATA.sbu.name}" to Brand "${TEST_DATA.brand.name}"`
      );
    }

    console.log('\n✅ Test data added successfully!\n');

    // Display summary
    console.log('📊 Test Data Summary:');
    console.log('─'.repeat(50));
    console.log(`  Brand:  ${brand.name} (ID: ${brand._id})`);
    console.log(`  Client: ${client.name} - Phone: ${client.phone}`);
    console.log(`  SBU:    ${sbu.name} (ID: ${sbu._id})`);
    console.log(`  Brand POC: ${TEST_DATA.brand.poc}`);
    console.log('─'.repeat(50));

    return { brand, client, sbu, department };
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
    throw error;
  }
}

/**
 * Remove Test Data
 * Deletes Brand, Client, SBU, and CSAT responses created by this script
 */
async function removeTestData() {
  console.log('🗑️  Removing Test Data...\n');

  try {
    // Step 1: Find the brand first
    const brand = await Brand.findOne({ slug: TEST_DATA.brand.slug });

    if (brand) {
      // Step 2: Remove CSAT responses for this brand
      const deletedResponses = await CSATResponse.deleteMany({
        brandId: brand._id,
      });
      console.log(
        `  ✓ Removed ${deletedResponses.deletedCount} CSAT response(s)`
      );

      // Step 3: Remove clients associated with the brand
      const deletedClients = await Client.deleteMany({ brandId: brand._id });
      console.log(
        `  ✓ Removed ${deletedClients.deletedCount} client(s) for brand "${TEST_DATA.brand.name}"`
      );

      // Step 4: Remove the SBU
      const deletedSBU = await SBU.deleteOne({ slug: TEST_DATA.sbu.slug });
      if (deletedSBU.deletedCount > 0) {
        console.log(`  ✓ Removed SBU: ${TEST_DATA.sbu.name}`);
      } else {
        console.log(`  ⚠️  SBU "${TEST_DATA.sbu.name}" not found`);
      }

      // Step 5: Remove the brand
      await Brand.deleteOne({ _id: brand._id });
      console.log(`  ✓ Removed Brand: ${TEST_DATA.brand.name}`);

      console.log('\n✅ Test data removed successfully!');
    } else {
      console.log(`  ⚠️  Brand "${TEST_DATA.brand.name}" not found`);

      // Still try to remove SBU in case it exists independently
      const deletedSBU = await SBU.deleteOne({ slug: TEST_DATA.sbu.slug });
      if (deletedSBU.deletedCount > 0) {
        console.log(`  ✓ Removed SBU: ${TEST_DATA.sbu.name}`);
      }

      console.log('\n⚠️  No test data found to remove (or already removed)');
    }
  } catch (error) {
    console.error('❌ Error removing test data:', error.message);
    throw error;
  }
}

/**
 * Main Function
 */
async function main() {
  const action = process.argv[2] || 'add';

  console.log('═'.repeat(60));
  console.log('  CSAT Test Data Script');
  console.log('═'.repeat(60));
  console.log(`\n📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    if (action === 'remove') {
      await removeTestData();
    } else if (action === 'add') {
      await addTestData();
    } else {
      console.log('❌ Invalid action. Use "add" or "remove"');
      console.log('   Example: node scripts/Test/seedTestData.js add');
      console.log('   Example: node scripts/Test/seedTestData.js remove');
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    console.log('═'.repeat(60));
  }
}

// Run the script
main();
