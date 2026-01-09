/**
 * Seed Script - SBUs (PODs) with Brand Mappings
 * Populates SBUs for Brand Solutions department with their assigned brands
 *
 * Run with: node scripts/seedSBUs.js
 * Run AFTER: node scripts/seedDatabase.js (for departments)
 * Run BEFORE: node scripts/seedBrands.js (brands need SBU references)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Department, SBU } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/csat-db';

/**
 * SBU (POD) Data with Brand Mappings from dept-brand-service.md
 * Each SBU belongs to Brand Solutions department
 */
const SBU_DATA = [
  {
    name: 'Chirag',
    leadNames: ['Chirag'],
    brands: [
      'Glow & Lovely',
      'Bajaj Almond',
      'Bridgestone Tyres',
      'BookMyShow',
      'Sanofi Allergy',
      'Medimix',
      'Huggies',
      'Gyproc',
      'Amazon SEA',
      'Amazon FUSE',
    ],
  },
  {
    name: 'Samarth',
    leadNames: ['Samarth'],
    brands: [
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
  },
  {
    name: 'Shreya',
    leadNames: ['Shreya'],
    brands: ['ITC Hotels', 'Wok and Roll'],
  },
  {
    name: 'Sumesh',
    leadNames: ['Sumesh'],
    brands: [
      'Himalaya PartySmart',
      'Pot and Bloom',
      'Krafton',
      'ITC Limited Corporate',
      'ITC HR',
    ],
  },
  {
    name: 'Vrinda',
    leadNames: ['Vrinda'],
    brands: ['Jockey', 'Oriana', 'Ample Group'],
  },
  {
    name: 'Amit',
    leadNames: ['Amit'],
    brands: [
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
  },
  {
    name: 'Dhruv + Malka',
    leadNames: ['Dhruv', 'Malka'],
    brands: [
      'Philips',
      'iQOO',
      'Cavin Kare',
      'Max Protein',
      'IIFL',
      'Optimum Nutrition + Isopure',
      'Dabur Hajmola',
    ],
  },
  {
    name: 'Dhruv + Aniket',
    leadNames: ['Dhruv', 'Aniket'],
    brands: [
      'Fevicol',
      'Fiama',
      'Kotak 811 + Kotak 811 (Fin For All)',
      'Hobby Ideas',
      'Charmis + Dermafique',
      'Vivel',
      'Engage',
    ],
  },
  {
    name: 'Dhruv + Ria',
    leadNames: ['Dhruv', 'Ria'],
    brands: [
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
  },
  {
    name: 'Dhruv + Jainik',
    leadNames: ['Dhruv', 'Jainik'],
    brands: ['Apollo Hospitals'],
  },
  {
    name: 'Rohan + Batul + Reuben',
    leadNames: ['Rohan', 'Batul', 'Reuben'],
    brands: [
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
  },
  {
    name: 'Rohan + Yohann',
    leadNames: ['Rohan', 'Yohann'],
    brands: [
      'Castrol POWER1',
      'Castrol Magnatec/ Cars',
      'Greencell NueGo',
      'Mahindra Rise',
      'Aditya Birla Paints',
      'CRIF High Mark',
    ],
  },
  {
    name: 'Rohan + Varsha',
    leadNames: ['Rohan', 'Varsha'],
    brands: [
      'Mukul Madhav Foundation',
      'Reliance Foundation',
      'Shiv Nadar Foundation',
      'Godrej Design Labs',
      'Cochlear',
      'ABCPA',
      'Aditya Birla Novel',
      'Her Circle',
      'Nanhi Kali',
      'Kaabil',
      'Indriya',
    ],
  },
  {
    name: 'Afshaad',
    leadNames: ['Afshaad'],
    brands: [
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
  },
  {
    name: 'Afshaad + Eric',
    leadNames: ['Afshaad', 'Eric'],
    brands: [
      'Nita Mukesh Ambani Cultural Centre (NMACC)',
      'Encore',
      'Jio World Convention Centre (JWCC)',
      'Vantara',
      'Vantara Niwas',
      'Reliance Jio',
    ],
  },
];

/**
 * Generate slug from SBU name
 */
const generateSlug = name => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Seed SBUs
 */
async function seedSBUs() {
  console.log('🎯 Seeding SBUs (PODs)...');

  // Get solutions department (Brand Solutions)
  const solutionsDept = await Department.findOne({ name: 'solutions' });
  if (!solutionsDept) {
    console.error('✗ solutions department not found!');
    console.error('  Run: node scripts/seedDatabase.js first');
    process.exit(1);
  }

  let created = 0;
  let updated = 0;

  for (const sbuData of SBU_DATA) {
    try {
      const slug = generateSlug(sbuData.name);

      const existing = await SBU.findOne({ slug });

      const sbuDoc = {
        name: sbuData.name,
        slug,
        departmentId: solutionsDept._id,
        leadNames: sbuData.leadNames,
        isActive: true,
      };

      if (existing) {
        await SBU.findOneAndUpdate({ slug }, sbuDoc, { new: true });
        updated++;
        console.log(
          `  ✓ Updated: ${sbuData.name} (${sbuData.brands.length} brands)`
        );
      } else {
        await SBU.create(sbuDoc);
        created++;
        console.log(
          `  ✓ Created: ${sbuData.name} (${sbuData.brands.length} brands)`
        );
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed ${sbuData.name}:`, error.message);
    }
  }

  console.log(`\n✅ SBUs seeded: ${created} created, ${updated} updated`);
}

/**
 * Export SBU-Brand mapping for use by seedBrands.js
 */
export const getSBUBrandMapping = () => {
  const mapping = {};
  SBU_DATA.forEach(sbu => {
    sbu.brands.forEach(brand => {
      mapping[brand] = sbu.name;
    });
  });
  return mapping;
};

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting SBU Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    await seedSBUs();

    console.log('\n🎉 SBU seeding completed successfully!');

    // Summary
    const sbuCount = await SBU.countDocuments();
    console.log(`\n📊 Total SBUs: ${sbuCount}`);
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
