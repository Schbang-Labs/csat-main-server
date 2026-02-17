/**
 * Seed Script - SBUs (PODs) with Brand Mappings
 * Populates SBUs for all departments with their assigned brands
 *
 * Run with: node scripts/seedSBUs.js
 * Run AFTER: node scripts/seedDatabase.js (for departments)
 * Run BEFORE: node scripts/seedBrands.js (brands need SBU references)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  Department,
  SBU,
  SBUHistory,
  Brand,
  Cycle,
} from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * SBU (POD) Data with Brand Mappings
 * Solutions department has proper SBU names with Executive VP, Associate VP, and Creative Directors
 * Based on exact spreadsheet structure from Sbu_LineUp.md
 */
const SBU_DATA = [
  // Solutions Division SBUs
  // Format: { name, executiveVP, associateVP, creativeDirector, brands }
  {
    name: 'SBU Global India',
    executiveVP: 'Chirag',
    associateVP: null,
    creativeDirector: 'Karan K',
    leadNames: ['Chirag', 'Karan K'],
    brands: [
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
  },
  {
    name: 'SBU Next Wave',
    executiveVP: null,
    associateVP: 'Samarth',
    creativeDirector: 'Aditya S',
    leadNames: ['Samarth', 'Aditya S'],
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
    name: 'SBU For the Craft',
    executiveVP: null,
    associateVP: 'Shreya',
    creativeDirector: 'Aditya S',
    leadNames: ['Shreya', 'Aditya S'],
    brands: ['ITC Hotels', 'Wok and Roll'],
  },
  {
    name: 'Bangalore',
    executiveVP: null,
    associateVP: 'Sumesh',
    creativeDirector: 'Aditya S',
    leadNames: ['Sumesh', 'Aditya S'],
    brands: [
      'Himalaya PartySmart',
      'Pot and Bloom',
      'Krafton',
      'ITC Limited Corporate',
      'ITC HR',
    ],
  },
  {
    name: 'SBU Corporate India',
    executiveVP: null,
    associateVP: 'Vrinda',
    creativeDirector: 'Viraj Pradhan',
    leadNames: ['Vrinda', 'Viraj Pradhan'],
    brands: ['Jockey', 'Oriana', 'Ample Group'],
  },
  {
    name: 'SBU India Prime',
    executiveVP: 'Amit',
    associateVP: null,
    creativeDirector: null,
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
    name: 'SBU Impact India',
    executiveVP: 'Dhruv',
    associateVP: 'Malka',
    creativeDirector: 'Puru',
    leadNames: ['Dhruv', 'Malka', 'Puru'],
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
    name: 'SBU India Rising 1',
    executiveVP: 'Dhruv',
    associateVP: 'Aniket',
    creativeDirector: 'Puru',
    leadNames: ['Dhruv', 'Aniket', 'Puru'],
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
    name: 'SBU India Rising 2',
    executiveVP: 'Dhruv',
    associateVP: 'Ria',
    creativeDirector: 'Puru',
    leadNames: ['Dhruv', 'Ria', 'Puru'],
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
    name: 'SBU India Rising 3',
    executiveVP: 'Dhruv',
    associateVP: 'Jainik',
    creativeDirector: 'Puru',
    leadNames: ['Dhruv', 'Jainik', 'Puru'],
    brands: ['Apollo Hospitals'],
  },
  {
    name: 'SBU India on the Move 1',
    executiveVP: 'Rohan',
    associateVP: 'Batul',
    associateVPs: ['Batul', 'Reuben'],
    creativeDirector: 'Mohammed',
    leadNames: ['Rohan', 'Batul', 'Reuben', 'Mohammed'],
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
    name: 'SBU India on the Move 2',
    executiveVP: 'Rohan',
    associateVP: 'Yohann',
    creativeDirector: 'Mohammed',
    leadNames: ['Rohan', 'Yohann', 'Mohammed'],
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
    name: 'SBU GenHer',
    executiveVP: 'Rohan',
    associateVP: 'Varsha',
    creativeDirector: 'Mohammed',
    leadNames: ['Rohan', 'Varsha', 'Mohammed'],
    brands: [
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
  },
  {
    name: 'SBU Luxe',
    executiveVP: 'Afshaad',
    associateVP: null,
    creativeDirector: 'Hari',
    leadNames: ['Afshaad', 'Hari'],
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
    name: 'SBU For the Arts',
    executiveVP: 'Afshaad',
    associateVP: 'Eric',
    creativeDirector: 'Hari',
    leadNames: ['Afshaad', 'Eric', 'Hari'],
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
 * SBU Data for other departments (all use "NO SBU" as name)
 * These departments have Executive VP and Associate VPs but no specific SBU names
 */
const OTHER_DEPARTMENT_SBUS = {
  media: {
    name: 'NO SBU',
    executiveVP: 'Mrugank Desai',
    associateVPs: [],
    leadNames: ['Mrugank Desai'],
    brands: [],
  },
  tech: {
    name: 'NO SBU',
    executiveVP: 'Dhaval Doshi',
    associateVPs: ['Carolyn', 'Akshay Chatlani', 'Melissa'],
    leadNames: ['Dhaval Doshi', 'Carolyn', 'Akshay Chatlani', 'Melissa'],
    brands: [],
  },
  seo: {
    name: 'NO SBU',
    executiveVP: 'Dhaval Doshi',
    associateVPs: ['Carolyn', 'Akshay Chatlani', 'Melissa'],
    leadNames: ['Dhaval Doshi', 'Carolyn', 'Akshay Chatlani', 'Melissa'],
    brands: [],
  },
  martech: {
    name: 'NO SBU',
    executiveVP: 'Dhaval Doshi',
    associateVPs: ['Carolyn', 'Akshay Chatlani', 'Melissa'],
    leadNames: ['Dhaval Doshi', 'Carolyn', 'Akshay Chatlani', 'Melissa'],
    brands: [],
  },
  fluence: {
    name: 'NO SBU',
    executiveVP: 'Divisha Iyer',
    associateVPs: ['Sneh Chedda', 'Vaishnavi Thirumallai'],
    leadNames: ['Divisha Iyer', 'Sneh Chedda', 'Vaishnavi Thirumallai'],
    brands: [],
  },
  smp: {
    name: 'NO SBU',
    executiveVP: 'Reema',
    associateVPs: ['Bianca', 'Bhumit'],
    leadNames: ['Reema', 'Bianca', 'Bhumit'],
    brands: [],
  },
};

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
 * Seed SBUs for Solutions department
 */
async function seedSolutionsSBUs(solutionsDept, cycleId) {
  console.log('\n🎯 Seeding Solutions Division SBUs...');

  let created = 0;
  let updated = 0;
  let historyCreated = 0;

  for (const sbuData of SBU_DATA) {
    try {
      const slug = generateSlug(sbuData.name);

      const existing = await SBU.findOne({
        slug,
        departmentId: solutionsDept._id,
      });

      const sbuDoc = {
        name: sbuData.name,
        slug,
        departmentId: solutionsDept._id,
        executiveVP: sbuData.executiveVP || null,
        associateVP: sbuData.associateVP || null,
        creativeDirector: sbuData.creativeDirector || null,
        leadNames: sbuData.leadNames,
        isActive: true,
      };

      let sbu;
      if (existing) {
        sbu = await SBU.findOneAndUpdate({ _id: existing._id }, sbuDoc, {
          new: true,
        });
        updated++;
        console.log(
          `  ✓ Updated: ${sbuData.name} | EVP: ${sbuData.executiveVP} | AVP: ${sbuData.associateVP || '-'} | CD: ${sbuData.creativeDirector}`
        );
      } else {
        sbu = await SBU.create(sbuDoc);
        created++;
        console.log(
          `  ✓ Created: ${sbuData.name} | EVP: ${sbuData.executiveVP} | AVP: ${sbuData.associateVP || '-'} | CD: ${sbuData.creativeDirector}`
        );
      }

      // Create SBUHistory for Cycle 5
      if (cycleId && sbu) {
        // Find brand ObjectIds for this SBU
        const brandDocs = await Brand.find({
          name: { $in: sbuData.brands },
        });
        const brandIds = brandDocs.map(b => b._id);

        await SBUHistory.findOneAndUpdate(
          { sbuId: sbu._id, cycleId, departmentId: solutionsDept._id },
          {
            sbuId: sbu._id,
            cycleId,
            departmentId: solutionsDept._id,
            name: sbuData.name,
            executiveVP: sbuData.executiveVP || null,
            associateVP: sbuData.associateVP || null,
            associateVPs: sbuData.associateVPs || [],
            creativeDirector: sbuData.creativeDirector || null,
            leadNames: sbuData.leadNames,
            brands: brandIds,
            snapshotReason: 'cycle_start',
          },
          { upsert: true, new: true }
        );
        historyCreated++;
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed ${sbuData.name}:`, error.message);
    }
  }

  console.log(
    `✅ Solutions SBUs seeded: ${created} created, ${updated} updated`
  );
  console.log(
    `✅ Solutions SBU History: ${historyCreated} entries created/updated`
  );
}

/**
 * Seed SBUs for other departments (all use "NO SBU" as name)
 */
async function seedOtherDepartmentSBUs(cycleId) {
  console.log('\n🏢 Seeding Other Departments SBUs...');

  let created = 0;
  let updated = 0;
  let historyCreated = 0;

  for (const [deptName, sbuData] of Object.entries(OTHER_DEPARTMENT_SBUS)) {
    try {
      const dept = await Department.findOne({ name: deptName });
      if (!dept) {
        console.error(`  ✗ ${deptName} department not found!`);
        continue;
      }

      const slug = `${deptName}-no-sbu`;

      const existing = await SBU.findOne({ slug, departmentId: dept._id });

      const sbuDoc = {
        name: sbuData.name,
        slug,
        departmentId: dept._id,
        executiveVP: sbuData.executiveVP || null,
        associateVPs: sbuData.associateVPs || [],
        leadNames: sbuData.leadNames,
        isActive: true,
      };

      let sbu;
      if (existing) {
        sbu = await SBU.findOneAndUpdate({ _id: existing._id }, sbuDoc, {
          new: true,
        });
        updated++;
        console.log(
          `  ✓ Updated: ${deptName.toUpperCase()} | EVP: ${sbuData.executiveVP} | AVPs: ${sbuData.associateVPs?.join(', ') || '-'}`
        );
      } else {
        sbu = await SBU.create(sbuDoc);
        created++;
        console.log(
          `  ✓ Created: ${deptName.toUpperCase()} | EVP: ${sbuData.executiveVP} | AVPs: ${sbuData.associateVPs?.join(', ') || '-'}`
        );
      }

      // Create SBUHistory for Cycle 5
      if (cycleId && sbu) {
        await SBUHistory.findOneAndUpdate(
          { sbuId: sbu._id, cycleId, departmentId: dept._id },
          {
            sbuId: sbu._id,
            cycleId,
            departmentId: dept._id,
            name: sbuData.name,
            executiveVP: sbuData.executiveVP || null,
            associateVPs: sbuData.associateVPs || [],
            leadNames: sbuData.leadNames,
            brands: [],
            snapshotReason: 'cycle_start',
          },
          { upsert: true, new: true }
        );
        historyCreated++;
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed ${deptName}:`, error.message);
    }
  }

  console.log(
    `✅ Other Department SBUs seeded: ${created} created, ${updated} updated`
  );
  console.log(
    `✅ Other Department SBU History: ${historyCreated} entries created/updated`
  );
}

/**
 * Seed all SBUs
 */
async function seedSBUs() {
  console.log('🎯 Seeding SBUs (PODs)...');

  // Get Cycle 5 (for SBUHistory creation)
  let cycleId = null;
  const cycle5 = await Cycle.findOne({ cycleNumber: 5, year: 2025 });
  if (cycle5) {
    cycleId = cycle5._id;
    console.log(
      `📅 Found Cycle 5 (${cycle5.name}) - will create SBUHistory entries`
    );
  } else {
    console.log('⚠️ Cycle 5 not found - SBUHistory entries will be skipped');
    console.log('  Run: node scripts/seedCycle.js first to create Cycle 5');
  }

  // Get solutions department (Brand Solutions)
  const solutionsDept = await Department.findOne({ name: 'solutions' });
  if (!solutionsDept) {
    console.error('✗ solutions department not found!');
    console.error('  Run: node scripts/seedDatabase.js first');
    process.exit(1);
  }

  // Seed Solutions SBUs (with history)
  await seedSolutionsSBUs(solutionsDept, cycleId);

  // Seed Other Department SBUs (with history)
  await seedOtherDepartmentSBUs(cycleId);

  console.log('\n✅ All SBUs seeded successfully!');
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
