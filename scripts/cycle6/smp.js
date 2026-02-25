/**
 * Seed Script - Brands & Clients with SBU Mappings (Cycle 6 - SMP)
 * 
 * LOGIC FLOW:
 * 1. BRANDS:
 *    - Check if brand exists (by name, alias, or slug)
 *    - If EXISTS → UPDATE: Add/update 'smp' service in services array
 *    - If NOT EXISTS → CREATE: New brand with 'smp' service
 * 
 * 2. CLIENTS (POCs):
 *    - Check if client exists (by brandId + phone)
 *    - If EXISTS → UPDATE: Merge 'smp' into serviceMapping, update name
 *    - If NOT EXISTS → CREATE: New client with serviceMapping from brand
 * 
 * 3. SBU:
 *    - Add all processed brand IDs to the SMP SBU's brands array
 *    - Merge with existing brands (no duplicates)
 * 
 * SMP SBU ID: 697094d7818800e6498d1f10
 * 
 * Run with: node scripts/cycle6/smp.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SBU, Brand, Client, Department } from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * SMP SBU ID
 */
const SMP_SBU_ID = '697094d7818800e6498d1f10';

/**
 * Brand Data with POC Information - Cycle 6 SMP
 * All brands are for SMP department
 */
const SMP_BRAND_DATA = [
  {
    name: 'McCain',
    pocs: [{ name: 'Srishti Mahopatra', phone: '8598931475' }],
  },
  {
    name: 'Celio',
    pocs: [{ name: 'Vibhuti Arte', phone: '9004935011' }],
  },
  {
    name: 'Hajmola',
    pocs: [{ name: 'Mohit Sharma', phone: '8447779269' }],
  },
  {
    name: 'Britannia',
    pocs: [
      { name: 'Sayali Thakur', phone: '9930222455' },
      { name: 'Arjun Visvanathan', phone: '9820463215' },
      { name: 'Pournami Unnikrishnan', phone: '9870005717' },
    ],
  },
  {
    name: 'ITC',
    pocs: [{ name: 'Kamna Srivastav', phone: '9810320728' }],
  },
  {
    name: 'Ample',
    pocs: [{ name: 'Sandhya Gurung', phone: '9513686095' }],
  },
  {
    name: 'Louis Philippe',
    pocs: [{ name: 'Akshita Kalia', phone: '9818155222' }],
  },
  {
    name: 'Tata Capital',
    pocs: [{ name: 'Nikita Gupta', phone: '9768815548' }],
  },
  {
    name: 'Dr Reddys Lab',
    pocs: [{ name: 'Harshith Chandra', phone: '7989190494' }],
  },
];

/**
 * Brand name aliases - maps input names to database names
 */
const BRAND_NAME_ALIASES = {
  'Hajmola': 'Dabur Hajmola',
  'Dr Reddys Lab': 'Dr. Reddy\'s Laboratories',
  'Ample': 'Ample Group',
  'Britannia': 'Britannia', // Direct match
  'ITC': 'ITC Limited Corporate', // May map to ITC corporate
};

/**
 * Generate slug from brand name
 */
const generateSlug = name => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Find brand by name or alias
 */
async function findBrandByNameOrAlias(brandName) {
  const escapedName = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let brand = await Brand.findOne({
    name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
  });

  if (brand) return brand;

  const aliasName = BRAND_NAME_ALIASES[brandName];
  if (aliasName) {
    const escapedAlias = aliasName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    brand = await Brand.findOne({
      name: { $regex: new RegExp(`^${escapedAlias}$`, 'i') }
    });
    if (brand) return brand;
  }

  const slug = generateSlug(brandName);
  brand = await Brand.findOne({ slug });
  if (brand) return brand;

  if (aliasName) {
    const aliasSlug = generateSlug(aliasName);
    brand = await Brand.findOne({ slug: aliasSlug });
  }

  return brand;
}

/**
 * Add or update SMP service in brand's services array
 */
const addSmpService = (existingServices, smpSbuId) => {
  const services = [...(existingServices || [])];
  const existingIndex = services.findIndex(s => s.department === 'smp');

  const smpService = {
    department: 'smp',
    isActive: true,
    startDate: new Date(),
    sbuId: smpSbuId,
  };

  if (existingIndex >= 0) {
    services[existingIndex] = {
      ...services[existingIndex],
      ...smpService,
    };
  } else {
    services.push(smpService);
  }

  return services;
};

/**
 * Seed or Update Brands with SMP service
 */
async function seedSmpBrands(smpSbuId) {
  console.log('\n🏷️  Seeding/Updating Cycle 6 SMP Brands...');

  const brandIds = [];
  let created = 0;
  let updated = 0;

  for (const brandData of SMP_BRAND_DATA) {
    try {
      let brand = await findBrandByNameOrAlias(brandData.name);

      if (brand) {
        const updatedServices = addSmpService(brand.services, smpSbuId);
        brand = await Brand.findByIdAndUpdate(
          brand._id,
          { services: updatedServices, isActive: true },
          { new: true }
        );
        updated++;
        console.log(`  ✓ Updated (added SMP): ${brand.name}`);
      } else {
        const slug = generateSlug(brandData.name);
        const services = [{
          department: 'smp',
          isActive: true,
          startDate: new Date(),
          sbuId: smpSbuId,
        }];

        brand = await Brand.create({
          name: brandData.name,
          slug,
          services,
          isActive: true,
        });
        created++;
        console.log(`  ✓ Created: ${brandData.name}`);
      }

      brandIds.push(brand._id);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${brandData.name}:`, error.message);
    }
  }

  console.log(`\n✅ Brands: ${created} created, ${updated} updated with SMP service`);

  return brandIds;
}

/**
 * Seed or Update Clients (POCs) for SMP brands
 */
async function seedSmpClients() {
  console.log('\n👥 Seeding/Updating Cycle 6 SMP Clients (POCs)...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const brandData of SMP_BRAND_DATA) {
    try {
      const brand = await findBrandByNameOrAlias(brandData.name);

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${brandData.name}, skipping POCs...`);
        skipped += brandData.pocs.length;
        continue;
      }

      for (const poc of brandData.pocs) {
        if (!poc.phone || poc.phone === 'NA' || poc.phone.trim() === '') {
          console.log(`  ⚠ Skipping ${poc.name} (no valid phone)`);
          skipped++;
          continue;
        }

        const normalizedPhone = poc.phone.replace(/\s+/g, '').replace(/-/g, '');

        try {
          const existingClient = await Client.findOne({
            brandId: brand._id,
            phone: normalizedPhone,
          });

          const serviceMapping = brand.services
            .filter(s => s.isActive)
            .map(s => ({ department: s.department, isActive: true }));

          if (!serviceMapping.find(s => s.department === 'smp')) {
            serviceMapping.push({ department: 'smp', isActive: true });
          }

          if (existingClient) {
            const existingMappings = existingClient.serviceMapping || [];
            const mergedMappings = [...existingMappings];

            if (!mergedMappings.find(s => s.department === 'smp')) {
              mergedMappings.push({ department: 'smp', isActive: true });
            }

            await Client.findByIdAndUpdate(existingClient._id, {
              name: poc.name,
              serviceMapping: mergedMappings,
              isActive: true,
            });
            updated++;
            console.log(`  ✓ Updated POC: ${poc.name} (${brand.name})`);
          } else {
            await Client.create({
              brandId: brand._id,
              name: poc.name,
              phone: normalizedPhone,
              serviceMapping,
              isActive: true,
            });
            created++;
            console.log(`  ✓ Created POC: ${poc.name} (${brand.name})`);
          }
        } catch (error) {
          if (error.code === 11000) {
            console.log(`  ⚠ Duplicate POC found, updating: ${poc.name}`);
            const existingClient = await Client.findOne({
              brandId: brand._id,
              phone: normalizedPhone,
            });
            if (existingClient) {
              const mergedMappings = [...(existingClient.serviceMapping || [])];
              if (!mergedMappings.find(s => s.department === 'smp')) {
                mergedMappings.push({ department: 'smp', isActive: true });
              }
              await Client.findByIdAndUpdate(existingClient._id, {
                name: poc.name,
                serviceMapping: mergedMappings,
                isActive: true,
              });
            }
            updated++;
          } else {
            console.error(`  ✗ Failed to seed POC ${poc.name}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`  ✗ Failed to process brand ${brandData.name}:`, error.message);
    }
  }

  console.log(`\n✅ Clients (POCs): ${created} created, ${updated} updated, ${skipped} skipped`);
}

/**
 * Update SMP SBU with brand references
 */
async function updateSmpSBUBrands(smpSbuId, brandIds) {
  console.log('\n🔗 Updating SMP SBU with brand references...');

  try {
    const sbu = await SBU.findById(smpSbuId);

    if (!sbu) {
      console.log(`  ⚠ SMP SBU not found with ID: ${smpSbuId}`);
      return;
    }

    const existingBrandIds = (sbu.brands || []).map(id => id.toString());
    const allBrandIds = [...new Set([
      ...existingBrandIds,
      ...brandIds.map(id => id.toString())
    ])];

    await SBU.findByIdAndUpdate(smpSbuId, {
      brands: allBrandIds.map(id => new mongoose.Types.ObjectId(id))
    });

    console.log(`✅ Updated SMP SBU with ${brandIds.length} brand references`);
    console.log(`   SBU: ${sbu.name} (ID: ${smpSbuId})`);
  } catch (error) {
    console.error('  ✗ Failed to update SMP SBU:', error.message);
  }
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting Cycle 6 SMP Brand & Client Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get SMP department
    const smpDept = await Department.findOne({ name: 'smp' });
    if (!smpDept) {
      console.error('❌ SMP department not found! Run seedDatabase.js first.');
      process.exit(1);
    }
    console.log(`📋 Found SMP department: ${smpDept._id}`);

    // Verify SMP SBU exists
    const smpSbu = await SBU.findById(SMP_SBU_ID);
    if (!smpSbu) {
      console.error(`❌ SMP SBU not found with ID: ${SMP_SBU_ID}`);
      process.exit(1);
    }
    console.log(`📋 Found SMP SBU: ${smpSbu.name} (EVP: ${smpSbu.executiveVP || 'N/A'})`);

    const smpSbuId = new mongoose.Types.ObjectId(SMP_SBU_ID);

    // Seed/Update Brands with SMP service
    const brandIds = await seedSmpBrands(smpSbuId);

    // Update SMP SBU with brand references
    await updateSmpSBUBrands(SMP_SBU_ID, brandIds);

    // Seed/Update Clients (POCs)
    await seedSmpClients();

    console.log('\n🎉 Cycle 6 SMP Brand & Client seeding completed successfully!');

    // Summary
    const totalBrands = await Brand.countDocuments();
    const smpBrands = await Brand.countDocuments({ 'services.department': 'smp' });
    const totalClients = await Client.countDocuments();
    const smpClients = await Client.countDocuments({ 'serviceMapping.department': 'smp' });

    console.log('\n📊 Database Summary:');
    console.log(`   Total Brands: ${totalBrands}`);
    console.log(`   SMP Brands: ${smpBrands}`);
    console.log(`   Total Clients (POCs): ${totalClients}`);
    console.log(`   SMP Clients: ${smpClients}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Export for use in other scripts
export { SMP_BRAND_DATA, BRAND_NAME_ALIASES, SMP_SBU_ID };

// Run seed
seed();
