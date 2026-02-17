/**
 * Seed Script - Brands & Clients with SBU Mappings (Cycle 6 - MarTech)
 * 
 * LOGIC FLOW:
 * 1. BRANDS:
 *    - Check if brand exists (by name, alias, or slug)
 *    - If EXISTS → UPDATE: Add/update 'martech' service in services array
 *    - If NOT EXISTS → CREATE: New brand with 'martech' service
 *    - Assign to correct SBU based on SBU Lead mapping
 * 
 * 2. CLIENTS (POCs):
 *    - Check if client exists (by brandId + phone)
 *    - If EXISTS → UPDATE: Merge 'martech' into serviceMapping, update name
 *    - If NOT EXISTS → CREATE: New client with serviceMapping from brand
 * 
 * 3. SBU:
 *    - Add processed brand IDs to respective SBU's brands array
 *    - Merge with existing brands (no duplicates)
 * 
 * SBU Lead to SBU ID Mapping:
 * - Akshay Chatlani → 697094a94a30795777e84b48
 * - Carolyn Fernandes → 697094d7818800e6498d1682
 * - Melissa Thomas → 697094d7818800e6498d1684
 * 
 * Run with: node scripts/cycle6/martech.js
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
 * SBU Lead to SBU ObjectId Mapping
 */
const SBU_LEAD_TO_ID = {
  'Akshay Chatlani': '697094a94a30795777e84b48',
  'Carolyn Fernandes': '697094d7818800e6498d1682',
  'Melissa Thomas': '697094d7818800e6498d1684',
};

/**
 * Brand Data with POC Information - Cycle 6 MarTech
 * Each brand has an sbuLead property to map to the correct SBU
 */
const MARTECH_BRAND_DATA = [
  {
    name: 'Audi',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Moupriya Das', phone: '9175066983' }],
  },
  {
    name: 'Crompton',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Vaibhav Joshi', phone: '9699393165' }],
  },
  {
    name: 'Bridgestone',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Sumedha Sharma', phone: '9953251989' }],
  },
  {
    name: 'Jio Hotstar',
    sbuLead: 'Akshay Chatlani',
    pocs: [
      { name: 'Manali Kukreja', phone: '9987486522' },
      { name: 'Shaun Fernandes', phone: '9819280020' },
    ],
  },
  {
    name: 'Pot & Bloom',
    sbuLead: 'Carolyn Fernandes',
    pocs: [
      { name: 'Harpreet Kaur', phone: '9008325588' },
      { name: 'Anand', phone: '9740455788' },
    ],
  },
  {
    name: 'McCain',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Sumati Kapur', phone: '9953526233' }],
  },
  {
    name: 'ICICI prudential',
    sbuLead: 'Carolyn Fernandes',
    pocs: [
      { name: 'Pranjal Gunjal', phone: '9967955926' },
      { name: 'Harsh Shah', phone: '' }, // No phone - will be skipped
      { name: 'Riya Pathak', phone: '' }, // No phone - will be skipped
      { name: 'Mamata Sawant', phone: '' }, // No phone - will be skipped
    ],
  },
  {
    name: 'Bayer',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Mayukh Chakraborty', phone: '' }], // No phone - will be skipped
  },
  {
    name: 'JL Morison',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Sabhayata Singh', phone: '7506361427' }],
  },
  {
    name: 'Hamilton',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Umangi Desai', phone: '8600720959' },
      { name: 'Shreyash', phone: '8356094977' },
      { name: 'Priyanka Datta', phone: '8130778113' },
    ],
  },
  {
    name: 'Kotak811',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Sagar Shah', phone: '9987512824' },
      { name: 'Shankar', phone: '9930036101' },
      { name: 'Suhail Shaikh', phone: '7208232369' },
    ],
  },
  {
    name: 'Jockey',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Rekha Nahar', phone: '9980222061' },
      { name: 'Ritika Sharma', phone: '8591481423' },
      { name: 'Divya Mishra', phone: '9739949967' },
    ],
  },
  {
    name: 'Nivea',
    sbuLead: 'Melissa Thomas',
    pocs: [{ name: 'Prateek Gulati', phone: '9711834224' }],
  },
  {
    name: 'Mahindra Rise',
    sbuLead: 'Melissa Thomas',
    pocs: [{ name: 'Brendon Fernandes', phone: '9930591739' }],
  },
  {
    name: 'Eureka Forbes',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Manisha Kode', phone: '9662970080' },
      { name: 'Harshal Patil', phone: '8830700617' },
      { name: 'Krupa Jhaveri', phone: '9833232385' },
    ],
  },
];

/**
 * Brand name aliases - maps input names to database names
 */
const BRAND_NAME_ALIASES = {
  'Bridgestone': 'Bridgestone Tyres',
  'Pot & Bloom': 'Pot and Bloom',
  'Kotak811': 'Kotak 811 + Kotak 811 (Fin For All)',
  'Hamilton': 'Hamilton D2C',
  'ICICI prudential': 'ICICI Prudential',
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
 * Add or update MarTech service in brand's services array with specific SBU
 */
const addMartechService = (existingServices, sbuId) => {
  const services = [...(existingServices || [])];
  const existingIndex = services.findIndex(s => s.department === 'martech');

  const martechService = {
    department: 'martech',
    isActive: true,
    startDate: new Date(),
    sbuId,
  };

  if (existingIndex >= 0) {
    services[existingIndex] = {
      ...services[existingIndex],
      ...martechService,
    };
  } else {
    services.push(martechService);
  }

  return services;
};

/**
 * Seed or Update Brands with MarTech service
 * Maps each brand to its respective SBU based on sbuLead
 */
async function seedMartechBrands() {
  console.log('\n🏷️  Seeding/Updating Cycle 6 MarTech Brands...');

  const sbuBrandMap = {
    'Akshay Chatlani': [],
    'Carolyn Fernandes': [],
    'Melissa Thomas': [],
  };

  let created = 0;
  let updated = 0;

  for (const brandData of MARTECH_BRAND_DATA) {
    try {
      const sbuId = SBU_LEAD_TO_ID[brandData.sbuLead];
      if (!sbuId) {
        console.error(`  ✗ Unknown SBU Lead: ${brandData.sbuLead}`);
        continue;
      }

      let brand = await findBrandByNameOrAlias(brandData.name);

      if (brand) {
        const updatedServices = addMartechService(brand.services, new mongoose.Types.ObjectId(sbuId));
        brand = await Brand.findByIdAndUpdate(
          brand._id,
          { services: updatedServices, isActive: true },
          { new: true }
        );
        updated++;
        console.log(`  ✓ Updated (added MarTech): ${brand.name} → ${brandData.sbuLead}`);
      } else {
        const slug = generateSlug(brandData.name);
        const services = [{
          department: 'martech',
          isActive: true,
          startDate: new Date(),
          sbuId: new mongoose.Types.ObjectId(sbuId),
        }];

        brand = await Brand.create({
          name: brandData.name,
          slug,
          services,
          isActive: true,
        });
        created++;
        console.log(`  ✓ Created: ${brandData.name} → ${brandData.sbuLead}`);
      }

      sbuBrandMap[brandData.sbuLead].push(brand._id);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${brandData.name}:`, error.message);
    }
  }

  console.log(`\n✅ Brands: ${created} created, ${updated} updated with MarTech service`);

  return sbuBrandMap;
}

/**
 * Seed or Update Clients (POCs) for MarTech brands
 */
async function seedMartechClients() {
  console.log('\n👥 Seeding/Updating Cycle 6 MarTech Clients (POCs)...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const brandData of MARTECH_BRAND_DATA) {
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

          if (!serviceMapping.find(s => s.department === 'martech')) {
            serviceMapping.push({ department: 'martech', isActive: true });
          }

          if (existingClient) {
            const existingMappings = existingClient.serviceMapping || [];
            const mergedMappings = [...existingMappings];

            if (!mergedMappings.find(s => s.department === 'martech')) {
              mergedMappings.push({ department: 'martech', isActive: true });
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
              if (!mergedMappings.find(s => s.department === 'martech')) {
                mergedMappings.push({ department: 'martech', isActive: true });
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
 * Update each SBU with brand references
 */
async function updateSBUBrands(sbuBrandMap) {
  console.log('\n🔗 Updating SBUs with brand references...');

  for (const [sbuLead, brandIds] of Object.entries(sbuBrandMap)) {
    if (brandIds.length === 0) continue;

    try {
      const sbuId = SBU_LEAD_TO_ID[sbuLead];
      const sbu = await SBU.findById(sbuId);

      if (!sbu) {
        console.log(`  ⚠ SBU not found for ${sbuLead}`);
        continue;
      }

      const existingBrandIds = (sbu.brands || []).map(id => id.toString());
      const allBrandIds = [...new Set([
        ...existingBrandIds,
        ...brandIds.map(id => id.toString())
      ])];

      await SBU.findByIdAndUpdate(sbuId, {
        brands: allBrandIds.map(id => new mongoose.Types.ObjectId(id))
      });

      console.log(`  ✓ Updated SBU (${sbuLead}): +${brandIds.length} brands`);
    } catch (error) {
      console.error(`  ✗ Failed to update SBU for ${sbuLead}:`, error.message);
    }
  }
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting Cycle 6 MarTech Brand & Client Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get MarTech department
    const martechDept = await Department.findOne({ name: 'martech' });
    if (!martechDept) {
      console.error('❌ MarTech department not found! Run seedDatabase.js first.');
      process.exit(1);
    }
    console.log(`📋 Found MarTech department: ${martechDept._id}`);

    console.log('\n📋 SBU Lead Mapping:');
    for (const [lead, id] of Object.entries(SBU_LEAD_TO_ID)) {
      const sbu = await SBU.findById(id);
      console.log(`   ${lead} → ${sbu?.name || 'NOT FOUND'} (${id})`);
    }

    // Seed/Update Brands with MarTech service
    const sbuBrandMap = await seedMartechBrands();

    // Update SBUs with brand references
    await updateSBUBrands(sbuBrandMap);

    // Seed/Update Clients (POCs)
    await seedMartechClients();

    console.log('\n🎉 Cycle 6 MarTech Brand & Client seeding completed successfully!');

    // Summary
    const totalBrands = await Brand.countDocuments();
    const martechBrands = await Brand.countDocuments({ 'services.department': 'martech' });
    const totalClients = await Client.countDocuments();
    const martechClients = await Client.countDocuments({ 'serviceMapping.department': 'martech' });

    console.log('\n📊 Database Summary:');
    console.log(`   Total Brands: ${totalBrands}`);
    console.log(`   MarTech Brands: ${martechBrands}`);
    console.log(`   Total Clients (POCs): ${totalClients}`);
    console.log(`   MarTech Clients: ${martechClients}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Export for use in other scripts
export { MARTECH_BRAND_DATA, BRAND_NAME_ALIASES, SBU_LEAD_TO_ID };

// Run seed
seed();
