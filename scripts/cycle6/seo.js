/**
 * Seed Script - Brands & Clients with SBU Mappings (Cycle 6 - SEO)
 * 
 * LOGIC FLOW:
 * 1. BRANDS:
 *    - Check if brand exists (by name, alias, or slug)
 *    - If EXISTS → UPDATE: Add/update 'seo' service in services array
 *    - If NOT EXISTS → CREATE: New brand with 'seo' service
 *    - Assign to correct SBU based on SBU Lead mapping
 * 
 * 2. CLIENTS (POCs):
 *    - Check if client exists (by brandId + phone)
 *    - If EXISTS → UPDATE: Merge 'seo' into serviceMapping, update name
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
 * Run with: node scripts/cycle6/seo.js
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
 * Brand Data with POC Information - Cycle 6 SEO
 * Each brand has an sbuLead property to map to the correct SBU
 */
const SEO_BRAND_DATA = [
  {
    name: 'Bridgestone',
    sbuLead: 'Akshay Chatlani',
    pocs: [
      { name: 'Sumedha Sharma', phone: '9953251989' },
      { name: 'Paritosh Koppikar', phone: '9967002720' },
    ],
  },
  {
    name: 'Britannia CheeseitUp',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Nandita Kamath', phone: '9900815222' }],
  },
  {
    name: 'Britannia Corporate',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Prabakaran K', phone: '9986416717' }],
  },
  {
    name: 'Ecolink',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Kanishka Garbyal', phone: '9891433015' }],
  },
  {
    name: 'Sriram Life Insurance',
    sbuLead: 'Akshay Chatlani',
    pocs: [
      { name: 'Rahul Adaniya', phone: '9930577107' },
      { name: 'Sravan Kumar', phone: '9704191860' },
    ],
  },
  {
    name: 'Lakme',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Krithikha Udayakumar', phone: '9943019003' }],
  },
  {
    name: 'Britannia AEO-GEO',
    sbuLead: 'Akshay Chatlani',
    pocs: [{ name: 'Meeta Chandrasekhar', phone: '9940059613' }],
  },
  {
    name: 'Birla Opus',
    sbuLead: 'Carolyn Fernandes',
    pocs: [
      { name: 'Aastha Narula', phone: '9999513285' },
      { name: 'Ramandeep', phone: '' }, // No phone - will be skipped
    ],
  },
  {
    name: 'HCCB',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Chiththarthann', phone: '8012047626' }],
  },
  {
    name: 'Jindal Steel',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Isha Sahni', phone: '9599698449' }],
  },
  {
    name: 'NueGo',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Deepti Sharma', phone: '9654264642' }],
  },
  {
    name: 'UltraTech',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Avadhoot Dawankar', phone: '9619177699' }],
  },
  {
    name: 'Bodycraft',
    sbuLead: 'Carolyn Fernandes',
    pocs: [
      { name: 'Riddhi Sharma', phone: '9724320003' },
      { name: 'Roshni Khatri', phone: '9884076488' },
      { name: 'Lakshmi Sunil Ranganathan', phone: '9845108212' },
    ],
  },
  {
    name: 'Fevicol',
    sbuLead: 'Carolyn Fernandes',
    pocs: [{ name: 'Disha Rayen', phone: 'NA' }], // NA - will be skipped
  },
  {
    name: 'Everest',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Salman Merchant', phone: '8898420058' },
      { name: 'Dhruvi Jamda', phone: '8097591987' },
      { name: 'Shivani Shrivastava', phone: '9326260922' },
    ],
  },
  {
    name: 'Kumari',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Ashish Sharma', phone: '9819413522' },
      { name: 'Rahul Kumar', phone: '7900186687' },
    ],
  },
  {
    name: 'Jockey',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Rekha Nahar', phone: '9980222061' },
      { name: 'Ritika Sharma', phone: '8591481423' },
    ],
  },
  {
    name: 'Mahindra Rise',
    sbuLead: 'Melissa Thomas',
    pocs: [{ name: 'Brendon Fernandes', phone: '9930591739' }],
  },
  {
    name: '5 Paisa',
    sbuLead: 'Melissa Thomas',
    pocs: [
      { name: 'Parag Kubal', phone: '9892058033' },
      { name: 'Sushant Oberoi', phone: '9167584485' },
    ],
  },
];

/**
 * Brand name aliases - maps input names to database names
 */
const BRAND_NAME_ALIASES = {
  'Bridgestone': 'Bridgestone Tyres',
  'NueGo': 'Greencell NueGo',
  'UltraTech': 'UltraTech Cement',
  'Kumari': 'Kumari Fine Jewellery',
  'Sriram Life Insurance': 'Shriram Life Insurance',
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
 * Add or update SEO service in brand's services array with specific SBU
 */
const addSeoService = (existingServices, sbuId) => {
  const services = [...(existingServices || [])];
  const existingSeoIndex = services.findIndex(s => s.department === 'seo');

  const seoService = {
    department: 'seo',
    isActive: true,
    startDate: new Date(),
    sbuId,
  };

  if (existingSeoIndex >= 0) {
    services[existingSeoIndex] = {
      ...services[existingSeoIndex],
      ...seoService,
    };
  } else {
    services.push(seoService);
  }

  return services;
};

/**
 * Seed or Update Brands with SEO service
 * Maps each brand to its respective SBU based on sbuLead
 */
async function seedSeoBrands() {
  console.log('\n🏷️  Seeding/Updating Cycle 6 SEO Brands...');

  // Track brands per SBU for later update
  const sbuBrandMap = {
    'Akshay Chatlani': [],
    'Carolyn Fernandes': [],
    'Melissa Thomas': [],
  };

  let created = 0;
  let updated = 0;

  for (const brandData of SEO_BRAND_DATA) {
    try {
      const sbuId = SBU_LEAD_TO_ID[brandData.sbuLead];
      if (!sbuId) {
        console.error(`  ✗ Unknown SBU Lead: ${brandData.sbuLead}`);
        continue;
      }

      let brand = await findBrandByNameOrAlias(brandData.name);

      if (brand) {
        const updatedServices = addSeoService(brand.services, new mongoose.Types.ObjectId(sbuId));
        brand = await Brand.findByIdAndUpdate(
          brand._id,
          { services: updatedServices, isActive: true },
          { new: true }
        );
        updated++;
        console.log(`  ✓ Updated (added SEO): ${brand.name} → ${brandData.sbuLead}`);
      } else {
        const slug = generateSlug(brandData.name);
        const services = [{
          department: 'seo',
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

  console.log(`\n✅ Brands: ${created} created, ${updated} updated with SEO service`);

  return sbuBrandMap;
}

/**
 * Seed or Update Clients (POCs) for SEO brands
 */
async function seedSeoClients() {
  console.log('\n👥 Seeding/Updating Cycle 6 SEO Clients (POCs)...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const brandData of SEO_BRAND_DATA) {
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

          if (!serviceMapping.find(s => s.department === 'seo')) {
            serviceMapping.push({ department: 'seo', isActive: true });
          }

          if (existingClient) {
            const existingMappings = existingClient.serviceMapping || [];
            const mergedMappings = [...existingMappings];

            if (!mergedMappings.find(s => s.department === 'seo')) {
              mergedMappings.push({ department: 'seo', isActive: true });
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
              if (!mergedMappings.find(s => s.department === 'seo')) {
                mergedMappings.push({ department: 'seo', isActive: true });
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
  console.log('🌱 Starting Cycle 6 SEO Brand & Client Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get SEO department
    const seoDept = await Department.findOne({ name: 'seo' });
    if (!seoDept) {
      console.error('❌ SEO department not found! Run seedDatabase.js first.');
      process.exit(1);
    }
    console.log(`📋 Found SEO department: ${seoDept._id}`);

    console.log('\n📋 SBU Lead Mapping:');
    for (const [lead, id] of Object.entries(SBU_LEAD_TO_ID)) {
      const sbu = await SBU.findById(id);
      console.log(`   ${lead} → ${sbu?.name || 'NOT FOUND'} (${id})`);
    }

    // Seed/Update Brands with SEO service
    const sbuBrandMap = await seedSeoBrands();

    // Update SBUs with brand references
    await updateSBUBrands(sbuBrandMap);

    // Seed/Update Clients (POCs)
    await seedSeoClients();

    console.log('\n🎉 Cycle 6 SEO Brand & Client seeding completed successfully!');

    // Summary
    const totalBrands = await Brand.countDocuments();
    const seoBrands = await Brand.countDocuments({ 'services.department': 'seo' });
    const totalClients = await Client.countDocuments();
    const seoClients = await Client.countDocuments({ 'serviceMapping.department': 'seo' });

    console.log('\n📊 Database Summary:');
    console.log(`   Total Brands: ${totalBrands}`);
    console.log(`   SEO Brands: ${seoBrands}`);
    console.log(`   Total Clients (POCs): ${totalClients}`);
    console.log(`   SEO Clients: ${seoClients}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Export for use in other scripts
export { SEO_BRAND_DATA, BRAND_NAME_ALIASES, SBU_LEAD_TO_ID };

// Run seed
seed();
