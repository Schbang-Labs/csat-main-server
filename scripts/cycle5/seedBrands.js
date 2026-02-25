/**
 * Seed Script - Brands with SBU Mappings
 * Populates brands with their services and links to SBUs
 *
 * Run with: node scripts/seedBrands.js
 * Run AFTER: node scripts/seedSBUs.js (SBUs must exist to link)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SBU, Brand } from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * Department name to code mapping
 */
const DEPT_CODE_MAP = {
  'Brand Solutions': 'solutions',
  Media: 'media',
  Tech: 'tech',
  SEO: 'seo',
  MarTech: 'martech',
  Fluence: 'fluence',
  SMP: 'smp',
};

/**
 * SBU (POD) to Brand Mappings
 * Uses exact SBU names from seedSBUs.js (with 'SBU' prefix where applicable)
 */
const SBU_BRAND_MAP = {
  'SBU Global India': [
    'Glow & Lovely',
    'Bajaj Almond',
    'Bridgestone Tyres',
    'Bookmyshow',
    'Sanofi Allergy',
    'Medimix',
    'Huggies',
    'Gyproc',
    'Amazon SEA',
    'Amazon FUSE',
  ],
  'SBU Next Wave': [
    'Marvel + Disney',
    'London Dairy',
    'Allegro',
    'Riot Games - Valorant',
    'Riot Games - League Of Legends',
    'Dominos',
    'Celio',
    'Eureka Forbes',
    'Britannia',
    'Crompton',
    'Fair and Handsome',
    'Exotica / Pure Glow',
    'Voltas',
  ],
  'SBU For the Craft': ['ITC Hotels', 'Wok and Roll'],
  Bangalore: [
    'Himalaya PartySmart',
    'Pot and Bloom',
    'Krafton',
    'ITC Limited Corporate',
    'ITC HR',
  ],
  'SBU Corporate India': ['Jockey', 'Oriana', 'Ample Group'],
  'SBU India Prime': [
    'AM/NS',
    'UltraTech Cement',
    'Nerolac',
    'Milton',
    'Treo',
    'Procook',
    'Dr. Fixit',
    'Specta Surfaces',
    'Safari Genie',
    'Metro',
    'Mochi',
    'Visa',
    'GAIN by Galderma',
    'Hamilton D2C',
    'Tata Cliq Lifestyle',
    'TATA Cliq Palette',
  ],
  'SBU Impact India': [
    'Philips',
    'iQOO',
    'Cavin Kare',
    'Max Protein',
    'IIFL',
    'Optimum Nutrition + Isopure',
    'Dabur Hajmola',
  ],
  'SBU India Rising 1': [
    'Fevicol',
    'Fiama',
    'Kotak 811 + Kotak 811 (Fin For All)',
    'Hobby Ideas',
    'Charmis + Dermafique',
    'Vivel',
    'Engage',
  ],
  'SBU India Rising 2': [
    'HDFC Bank',
    'Phoenix Marketcity',
    'Britannia Cakes',
    'Britannia Breads',
    'Britannia Croissant',
    'Britannia Rusk',
    'Britannia Cheese',
    'Britannia Winkin Cow and Come Alive',
    'Dr. Reddy\'s Laboratories',
  ],
  'SBU India Rising 3': ['Apollo Hospitals'],
  'SBU India on the Move 1': [
    'HDFC Life',
    'Skybags Luggage',
    'Skybags Backpack',
    'Episoft',
    'Bonito Design',
    'HDFC Ergo',
    'Flair Pens',
    'Pierre Cardin',
    'Meraki Habitat',
    'Torrent Electricals',
    'Hauser Germany',
  ],
  'SBU India on the Move 2': [
    'Castrol POWER1',
    'Castrol Magnatec/ Cars',
    'Greencell NueGo',
    'Mahindra Rise',
    'Aditya Birla Paints',
    'CRIF High Mark',
  ],
  'SBU GenHer': [
    'Mukul Madhav Foundation',
    'Reliance Foundation',
    'Shiv Nadar Foundation',
    'Godrej Design Labs',
    'Cochlear',
    'INTABCPA',
    'Aditya Birla Novel',
    'Her Circle',
    'Nanhi Kali',
    'Kaabil',
    'Indriya',
  ],
  'SBU Luxe': [
    'Kerastase',
    'Kiehl\'s',
    'Lancome',
    'L\'oreal Redken',
    'ICA Pidilite',
    'Simpolo',
    'L\'oreal Professionnel',
    'Kumari Jewels',
    'Louis Philippe',
    'Cerave',
  ],
  'SBU For the Arts': [
    'Nita Mukesh Ambani Cultural Centre (NMACC)',
    'Encore',
    'Jio World Convention Centre (JWCC)',
    'Vantara',
    'Vantara Niwas',
    'Reliance Jio',
  ],
};

/**
 * Brand Data with Services from brand_service_segregation.md
 * Each brand lists which departments it uses
 */
const BRAND_DATA = [
  { name: 'Amazon SEA', services: ['Brand Solutions'] },
  { name: 'Amazon FUSE', services: ['Brand Solutions'] },
  { name: 'Glow & Lovely', services: ['Brand Solutions', 'Fluence'] },
  { name: 'Bajaj Almond', services: ['Brand Solutions'] },
  {
    name: 'Bridgestone Tyres',
    services: ['Brand Solutions', 'Media', 'Tech', 'SEO', 'MarTech', 'Fluence'],
  },
  { name: 'Bookmyshow', services: ['Brand Solutions'] },
  { name: 'Sanofi Allergy', services: ['Brand Solutions'] },
  { name: 'Medimix', services: ['Brand Solutions', 'Media'] },
  { name: 'Huggies', services: ['Brand Solutions', 'Fluence'] },
  { name: 'Gyproc', services: ['Brand Solutions'] },
  { name: 'Marvel + Disney', services: ['Brand Solutions'] },
  { name: 'London Dairy', services: ['Brand Solutions', 'Media'] },
  { name: 'Allegro', services: ['Brand Solutions'] },
  { name: 'Riot Games - Valorant', services: ['Brand Solutions'] },
  { name: 'Riot Games - League Of Legends', services: ['Brand Solutions'] },
  { name: 'Dominos', services: ['Brand Solutions', 'Tech'] },
  { name: 'Celio', services: ['Brand Solutions', 'SMP'] },
  {
    name: 'Eureka Forbes',
    services: ['Brand Solutions', 'MarTech', 'Fluence'],
  },
  { name: 'Britannia', services: ['Brand Solutions', 'Fluence'] },
  { name: 'Crompton', services: ['Brand Solutions'] },
  { name: 'Fair and Handsome', services: ['Brand Solutions'] },
  { name: 'Exotica / Pure Glow', services: ['Brand Solutions'] },
  { name: 'Voltas', services: ['Brand Solutions'] },
  { name: 'ITC Hotels', services: ['Brand Solutions'] },
  { name: 'Wok and Roll', services: ['Brand Solutions'] },
  { name: 'Himalaya PartySmart', services: ['Brand Solutions'] },
  {
    name: 'Pot and Bloom',
    services: ['Brand Solutions', 'Tech', 'SEO', 'MarTech'],
  },
  { name: 'Krafton', services: ['Brand Solutions'] },
  { name: 'ITC Limited Corporate', services: ['Brand Solutions'] },
  { name: 'ITC HR', services: ['Brand Solutions'] },
  { name: 'Jockey', services: ['Brand Solutions', 'SEO', 'MarTech'] },
  { name: 'Oriana', services: ['Brand Solutions', 'Media'] },
  { name: 'Ample Group', services: ['Brand Solutions'] },
  { name: 'AM/NS', services: ['Brand Solutions'] },
  { name: 'UltraTech Cement', services: ['Brand Solutions', 'SEO'] },
  { name: 'Nerolac', services: ['Brand Solutions'] },
  { name: 'Milton', services: ['Brand Solutions', 'MarTech'] },
  { name: 'Treo', services: ['Brand Solutions'] },
  { name: 'Procook', services: ['Brand Solutions'] },
  { name: 'Dr. Fixit', services: ['Brand Solutions'] },
  { name: 'Specta Surfaces', services: ['Brand Solutions', 'Media'] },
  { name: 'Safari Genie', services: ['Brand Solutions', 'Fluence'] },
  { name: 'Metro', services: ['Brand Solutions', 'Media'] },
  { name: 'Mochi', services: ['Brand Solutions', 'Media', 'Fluence'] },
  { name: 'Visa', services: ['Brand Solutions'] },
  { name: 'GAIN by Galderma', services: ['Brand Solutions'] },
  { name: 'Hamilton D2C', services: ['Brand Solutions', 'MarTech'] },
  { name: 'Tata Cliq Lifestyle', services: ['Brand Solutions'] },
  { name: 'TATA Cliq Palette', services: ['Brand Solutions'] },
  { name: 'Philips', services: ['Brand Solutions', 'SEO', 'Fluence'] },
  { name: 'iQOO', services: ['Brand Solutions'] },
  { name: 'Cavin Kare', services: ['Brand Solutions'] },
  { name: 'Max Protein', services: ['Brand Solutions'] },
  { name: 'IIFL', services: ['Brand Solutions'] },
  { name: 'Optimum Nutrition + Isopure', services: ['Brand Solutions'] },
  { name: 'Dabur Hajmola', services: ['Brand Solutions'] },
  { name: 'Fevicol', services: ['Brand Solutions'] },
  { name: 'Fiama', services: ['Brand Solutions'] },
  {
    name: 'Kotak 811 + Kotak 811 (Fin For All)',
    services: ['Brand Solutions'],
  },
  { name: 'Hobby Ideas', services: ['Brand Solutions', 'Media', 'SEO'] },
  { name: 'Charmis + Dermafique', services: ['Brand Solutions'] },
  { name: 'Vivel', services: ['Brand Solutions'] },
  { name: 'Engage', services: ['Brand Solutions'] },
  { name: 'HDFC Bank', services: ['Brand Solutions'] },
  { name: 'Phoenix Marketcity', services: ['Brand Solutions'] },
  { name: 'Britannia Cakes', services: ['Brand Solutions'] },
  { name: 'Britannia Breads', services: ['Brand Solutions'] },
  { name: 'Britannia Croissant', services: ['Brand Solutions'] },
  { name: 'Britannia Rusk', services: ['Brand Solutions'] },
  { name: 'Britannia Cheese', services: ['Brand Solutions'] },
  {
    name: 'Britannia Winkin Cow and Come Alive',
    services: ['Brand Solutions'],
  },
  { name: 'Britannia Corporate', services: ['Tech', 'SEO'] },
  { name: 'Britannia CheeseitUp', services: ['SEO'] },
  {
    name: 'Dr. Reddy\'s Laboratories',
    services: ['Brand Solutions', 'Media', 'Fluence'],
  },
  { name: 'Apollo Hospitals', services: ['Brand Solutions'] },
  { name: 'HDFC Life', services: ['Brand Solutions'] },
  { name: 'Skybags Luggage', services: ['Brand Solutions'] },
  { name: 'Skybags Backpack', services: ['Brand Solutions'] },
  { name: 'Episoft', services: ['Brand Solutions'] },
  { name: 'Bonito Design', services: ['Brand Solutions'] },
  { name: 'HDFC Ergo', services: ['Brand Solutions'] },
  { name: 'Flair Pens', services: ['Brand Solutions'] },
  { name: 'Pierre Cardin', services: ['Brand Solutions'] },
  { name: 'Meraki Habitat', services: ['Brand Solutions'] },
  {
    name: 'Torrent Electricals',
    services: ['Brand Solutions', 'Media', 'Fluence'],
  },
  { name: 'Hauser Germany', services: ['Brand Solutions'] },
  { name: 'Castrol POWER1', services: ['Brand Solutions', 'Fluence'] },
  { name: 'Castrol Magnatec/ Cars', services: ['Brand Solutions'] },
  { name: 'Castrol', services: ['Fluence'] },
  { name: 'Castrol - Autocare', services: ['Fluence'] },
  { name: 'Greencell NueGo', services: ['Brand Solutions'] },
  { name: 'NueGo', services: ['Media', 'SEO', 'Fluence'] },
  {
    name: 'Mahindra Rise',
    services: ['Brand Solutions', 'Media', 'Tech', 'SEO', 'MarTech'],
  },
  { name: 'Aditya Birla Paints', services: ['Brand Solutions'] },
  { name: 'CRIF High Mark', services: ['Brand Solutions'] },
  { name: 'Mukul Madhav Foundation', services: ['Brand Solutions'] },
  { name: 'Reliance Foundation', services: ['Brand Solutions'] },
  { name: 'Shiv Nadar Foundation', services: ['Brand Solutions'] },
  { name: 'Godrej Design Labs', services: ['Brand Solutions'] },
  { name: 'Cochlear', services: ['Brand Solutions', 'Media'] },
  { name: 'INTABCPA', services: ['Brand Solutions'] },
  { name: 'Aditya Birla Novel', services: ['Brand Solutions'] },
  { name: 'Her Circle', services: ['Brand Solutions'] },
  { name: 'Nanhi Kali', services: ['Brand Solutions', 'Media'] },
  { name: 'Kaabil', services: ['Brand Solutions'] },
  { name: 'Indriya', services: ['Media'] },
  { name: 'Kerastase', services: ['Brand Solutions'] },
  { name: 'Kiehl\'s', services: ['Brand Solutions'] },
  { name: 'Lancome', services: ['Brand Solutions'] },
  { name: 'L\'oreal Redken', services: ['Brand Solutions'] },
  { name: 'ICA Pidilite', services: ['Brand Solutions'] },
  { name: 'Simpolo', services: ['Brand Solutions', 'Media'] },
  { name: 'L\'oreal Professionnel', services: ['Brand Solutions'] },
  { name: 'Kumari Jewels', services: ['Brand Solutions', 'Media', 'SEO'] },
  { name: 'Kumari', services: ['SEO'] },
  { name: 'Louis Philippe', services: ['Brand Solutions'] },
  { name: 'Cerave', services: ['Brand Solutions'] },
  {
    name: 'Nita Mukesh Ambani Cultural Centre (NMACC)',
    services: ['Brand Solutions'],
  },
  { name: 'Encore', services: ['Brand Solutions'] },
  { name: 'Jio World Convention Centre (JWCC)', services: ['Brand Solutions'] },
  { name: 'Vantara', services: ['Brand Solutions'] },
  { name: 'Vantara Niwas', services: ['Brand Solutions'] },
  { name: 'Reliance Jio', services: ['Brand Solutions'] },
  // Media-only brands
  { name: 'Papa Don\'t Preach', services: ['Media'] },
  { name: 'Fevicreate', services: ['Media', 'SEO'] },
  { name: 'JLL', services: ['Media'] },
  { name: 'Level Supermind', services: ['Media', 'Fluence'] },
  { name: 'Armaf', services: ['Media'] },
  { name: 'Bodycraft Salon', services: ['Media', 'SEO'] },
  { name: 'Bodycraft', services: ['Tech', 'SEO'] },
  { name: 'Tata Comm', services: ['Media'] },
  { name: 'ACCA', services: ['Media', 'Fluence'] },
  { name: 'Groviva', services: ['Media'] },
  { name: 'Lakeshore', services: ['Media'] },
  { name: 'Nikon', services: ['Media'] },
  { name: 'Kosmoderma', services: ['Media'] },
  // Tech-only brands
  { name: 'DHP Heavy', services: ['Tech'] },
  { name: 'Sriram Life Insurance', services: ['Tech', 'SEO'] },
  { name: 'Birla Opus', services: ['Tech', 'SEO'] },
  { name: 'HCCB', services: ['Tech', 'SEO'] },
  { name: 'Jindal Steel', services: ['Tech', 'SEO'] },
  { name: 'Ring (NZ)', services: ['Tech'] },
  { name: 'Brookfield', services: ['Tech'] },
  { name: 'Himatsingka', services: ['Tech'] },
  // SEO-only brands
  { name: 'Everest', services: ['SEO'] },
  { name: '5 Paisa', services: ['SEO'] },
  // MarTech-only brands
  { name: 'McCain', services: ['MarTech', 'SMP'] },
  { name: 'ICICI Prudential', services: ['MarTech'] },
  { name: 'JL Morison', services: ['MarTech'] },
  { name: 'Hamilton', services: ['MarTech'] },
  { name: 'Kotak811', services: ['MarTech'] },
  { name: 'Nivea', services: ['MarTech'] },
  // Fluence-only brands
  { name: 'Adani Realty', services: ['Fluence'] },
  { name: 'Boheco', services: ['Fluence'] },
  { name: 'Swift TV', services: ['Fluence'] },
  { name: 'Odisha Tourism', services: ['Fluence'] },
];

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
 * Build reverse mapping: brand name -> SBU name
 */
const buildBrandToSBUMap = () => {
  const map = {};
  Object.entries(SBU_BRAND_MAP).forEach(([sbuName, brands]) => {
    brands.forEach(brand => {
      map[brand] = sbuName;
    });
  });
  return map;
};

/**
 * Seed Brands with SBU links
 */
async function seedBrands() {
  console.log('🏷️  Seeding Brands...');

  // Get all SBUs mapped by slug
  const sbus = await SBU.find({});
  const sbuMap = {};
  sbus.forEach(sbu => {
    const slug = generateSlug(sbu.name);
    sbuMap[slug] = sbu;
    sbuMap[sbu.name] = sbu;
  });

  // Build brand -> SBU mapping
  const brandToSBU = buildBrandToSBUMap();

  // Track brands for each SBU
  const sbuBrandsMap = {};

  let created = 0;
  let updated = 0;

  for (const brandData of BRAND_DATA) {
    try {
      const slug = generateSlug(brandData.name);

      // Find assigned SBU for this brand (for Brand Solutions)
      const sbuName = brandToSBU[brandData.name];
      const sbu = sbuName ? sbuMap[sbuName] : null;

      // Build services array with proper department codes and SBU links
      const services = brandData.services.map(serviceName => {
        const deptCode = DEPT_CODE_MAP[serviceName];
        const serviceEntry = {
          department: deptCode,
          isActive: true,
          startDate: new Date(),
        };

        // Link SBU only for Brand Solutions department
        if (deptCode === 'solutions' && sbu) {
          serviceEntry.sbuId = sbu._id;
        }

        return serviceEntry;
      });

      const existing = await Brand.findOne({ slug });
      let brandDoc;

      if (existing) {
        brandDoc = await Brand.findOneAndUpdate(
          { slug },
          { name: brandData.name, services, isActive: true },
          { new: true }
        );
        updated++;
        if (sbu) {
          console.log(`  ✓ Updated: ${brandData.name} (SBU: ${sbuName})`);
        } else {
          console.log(`  ✓ Updated: ${brandData.name}`);
        }
      } else {
        brandDoc = await Brand.create({
          name: brandData.name,
          slug,
          services,
          isActive: true,
        });
        created++;
        if (sbu) {
          console.log(`  ✓ Created: ${brandData.name} (SBU: ${sbuName})`);
        } else {
          console.log(`  ✓ Created: ${brandData.name}`);
        }
      }

      // Track brand for SBU update
      if (sbu && brandDoc) {
        if (!sbuBrandsMap[sbu._id.toString()]) {
          sbuBrandsMap[sbu._id.toString()] = [];
        }
        sbuBrandsMap[sbu._id.toString()].push(brandDoc._id);
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed ${brandData.name}:`, error.message);
    }
  }

  console.log(`\n✅ Brands seeded: ${created} created, ${updated} updated`);

  return sbuBrandsMap;
}

/**
 * Update SBUs with their associated brand IDs
 */
async function updateSBUBrands(sbuBrandsMap) {
  console.log('\n🔗 Updating SBUs with brand references...');

  let updated = 0;

  for (const [sbuId, brandIds] of Object.entries(sbuBrandsMap)) {
    try {
      await SBU.findByIdAndUpdate(sbuId, { brands: brandIds });
      updated++;
    } catch (error) {
      console.error(`  ✗ Failed to update SBU ${sbuId}:`, error.message);
    }
  }

  console.log(`✅ Updated ${updated} SBUs with brand references`);
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting Brand Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);

    console.log('✅ Connected to MongoDB\n');

    const sbuBrandsMap = await seedBrands();

    // Update SBUs with their brand references
    await updateSBUBrands(sbuBrandsMap);

    console.log('\n🎉 Brand seeding completed successfully!');

    // Summary
    const brandCount = await Brand.countDocuments();
    const brandsWithSBU = await Brand.countDocuments({
      'services.sbuId': { $ne: null },
    });
    const sbusWithBrands = await SBU.countDocuments({
      brands: { $exists: true, $ne: [] },
    });
    console.log('\n📊 Summary:');
    console.log(`   Total Brands: ${brandCount}`);
    console.log(`   Brands with SBU: ${brandsWithSBU}`);
    console.log(`   SBUs with Brands: ${sbusWithBrands}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run seed
seed();
