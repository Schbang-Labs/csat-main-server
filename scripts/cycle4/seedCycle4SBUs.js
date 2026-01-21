/**
 * Seed Script - Cycle 4 SBUs and SBU History
 *
 * This script:
 * 1. Parses the SBU lineup from CSV to get unique SBU lead combinations
 * 2. Checks if SBU exists by matching executiveVP, associateVP, associateVPs, or leadNames
 * 3. If SBU exists - do NOT create a new one
 * 4. If SBU doesn't exist - create a new SBU
 * 5. Create SBU History entries for ALL SBUs (existing + new) for Cycle 4
 *
 * Run with: node scripts/cycle4/seedCycle4SBUs.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  SBU,
  Cycle,
  Department,
  SBUHistory,
  Brand,
} from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * SBU Data from SBU_LineUP_cycle4.csv - SOLUTIONS Department
 * Lead combinations with their associated brands for Cycle 4
 */
const CYCLE4_SOLUTIONS_SBU_LEADS = [
  {
    leads: ['Chirag'],
    brands: [
      'Glow & Lovely',
      'Bajaj Almond',
      'Maybelline',
      'Enamor',
      'Bridgestone Tyres',
      'Pepsi Srilanka',
      'Bookmyshow',
      'Sanofi Allergy',
      'Medimix',
      'Neutrogena',
    ],
  },
  {
    leads: ['Jitto', 'Samarth'],
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
    leads: ['Shreya'],
    brands: [
      'MTR',
      'ITC Hotels',
      'Wok and Roll',
      'Tata Neu FS',
      'Neu Card',
      'Jockey',
      'Oriana',
      'Amazon Fresh',
      'Ample Group',
    ],
  },
  {
    leads: ['Sumesh'],
    brands: [
      'Himalaya PartySmart',
      'Pot and Bloom',
      'Krafton',
      'ITC Limited Corporate',
      'ITC HR',
    ],
  },
  {
    leads: ['Amit'],
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
      'TATA Cliq Lifestyle',
      'TATA Cliq Palette',
    ],
  },
  {
    leads: ['Dhruv', 'Malka'],
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
    leads: ['Dhruv', 'Aniket'],
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
    leads: ['Dhruv', 'Ria'],
    brands: [
      'HDFC Bank',
      'Phoenix Marketcity',
      'Britannia Cakes and Breads',
      'Britannia Croissant',
      'Britannia Rusk',
      'Britannia Cheese',
      'Britannia Winkin Cow and Come Alive',
      "Dr. Reddy's Laboratories",
    ],
  },
  {
    leads: ['Dhruv', 'Jainik'],
    brands: ['Apollo Hospitals'],
  },
  {
    leads: ['Rohan', 'Batul', 'Reuben'],
    brands: [
      'HDFC Life',
      'Skybags Luggage',
      'Skybags Backpack',
      'Episoft',
      'Bonito Design',
      'HDFC Ergo',
      'Flair pens',
      'Pierre Cardin',
      'Meraki Habitat',
      'Torrent Electricals',
      'Hauser Germany',
    ],
  },
  {
    leads: ['Rohan', 'Yohann'],
    brands: [
      'Castrol POWER1',
      'Castrol Magnatec/ Cars',
      'Greencell NueGo',
      'Sapient Finserv',
      'Mahindra Rise',
      'Aditya Birla Paints',
      'CRIF High Mark',
    ],
  },
  {
    leads: ['Rohan', 'Varsha'],
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
    ],
  },
  {
    leads: ['Afshaad'],
    brands: [
      'Kerastase',
      "Kiehl's",
      'Lancome',
      "L'oreal Redken",
      'ICA Pidilite',
      'Simpolo',
      "L'oreal Professionnel",
      'Kumari Jewels',
      'Louis Philippe',
      'Cerave',
    ],
  },
  {
    leads: ['Afshaad', 'Eric'],
    brands: [
      'Nita Mukesh Ambani Cultural Centre (NMACC)',
      'Encore',
      'Jio World Convention Centre (JWCC)',
      'Vantara Niwas',
      'Reliance Jio',
    ],
  },
];

/**
 * SBU Data from Remaining_SBU_LineUp_cycle4.csv - MEDIA Department (Lines 2-46)
 */
const CYCLE4_MEDIA_SBU_LEADS = [
  {
    leads: ['Mrugank Desai'],
    brands: [
      "Papa Don't Preach",
      'Metro Shoes',
      'Hobby Ideas',
      'Fevicreate',
      'Allegro',
      'Specta',
      'NueGo',
      'Cochlear',
      'JLL',
      'Level Supermind',
      'Mahindra Rise',
      'Armaf',
      'Bodycraft Salon',
      'Bodycraft Clinic',
      'Bodycraft Academy',
      'Tata Comm',
      'ACCA',
      'Kumari Fine Jewellery',
      'Bridgestone',
      'Simpolo',
      'Oriana',
      'Groviva',
      'Mochi',
      'Medimix',
      'Indriya',
      'Shiamak',
      'Torrent Electricals',
      'Birla Opus Create',
      'Dr. Reddy',
      'Swiggy',
      'Lakeshore',
    ],
  },
];

/**
 * SBU Data from Remaining_SBU_LineUp_cycle4.csv - TECH Department (Lines 47-77)
 */
const CYCLE4_TECH_SBU_LEADS = [
  {
    leads: ['Akshay Chatlani'],
    brands: [
      'Bridgestone',
      'DHP Heavy',
      'Dominos',
      'Britannia Corporate',
      'Sriram Life Insurance',
    ],
  },
  {
    leads: ['Carolyn Fernandes'],
    brands: [
      'Birla Opus',
      'HCCB',
      'Jindal Steel',
      'Pot & Bloom',
      'Swiggy',
      'Ring (NZ)',
      'NRB bearings',
    ],
  },
  {
    leads: ['Melissa Thomas'],
    brands: ['Brookfield', 'Himatsingka', 'Kotak811', 'Mahindra Rise'],
  },
];

/**
 * SBU Data from Remaining_SBU_LineUp_cycle4.csv - SEO Department (Lines 78-110)
 */
const CYCLE4_SEO_SBU_LEADS = [
  {
    leads: ['Akshay Chatlani'],
    brands: [
      'Bridgestone',
      'Fevicreate',
      'Britannia CheeseitUp',
      'Britannia Corporate',
      'Ecolink',
      'Sriram Life Insurance',
    ],
  },
  {
    leads: ['Carolyn Fernandes'],
    brands: [
      'Birla Opus',
      'HCCB',
      'House of Bindu',
      'Jindal Steel',
      'NueGo',
      'UltraTech',
      'Bodycraft',
      'Swiggy',
      'Fevicol',
    ],
  },
  {
    leads: ['Melissa Thomas'],
    brands: [
      'Ethos',
      'Everest',
      'Kumari',
      'Jockey',
      'Mahindra Rise',
      '5 Paisa',
    ],
  },
];

/**
 * SBU Data from Remaining_SBU_LineUp_cycle4.csv - MARTECH Department (Lines 111-135)
 */
const CYCLE4_MARTECH_SBU_LEADS = [
  {
    leads: ['Akshay Chatlani'],
    brands: ['Bridgestone'],
  },
  {
    leads: ['Carolyn Fernandes'],
    brands: [
      'Pot & Bloom',
      'McCain',
      'ICICI prudential',
      'Bayer',
      'JL Morison',
    ],
  },
  {
    leads: ['Melissa Thomas'],
    brands: [
      'Brookfield',
      'Hamilton',
      'Kotak811',
      'Jockey',
      'Nivea',
      'Mahindra Rise',
      'Eureka Forbes',
    ],
  },
];

/**
 * SBU Data from Remaining_SBU_LineUp_cycle4.csv - FLUENCE Department (Lines 138-172)
 */
const CYCLE4_FLUENCE_SBU_LEADS = [
  {
    leads: ['Sneh Chedda'],
    brands: [
      'Britannia',
      'BookMyShow',
      'Huggies',
      'Eureka Forbes',
      'Bridgestone',
      'Celio',
      'Adani Realty',
      'Castrol',
      'Nuego',
      'Philips',
      'Sleepwell',
      'Kurlon',
      'Pot & Bloom',
      'Tata Motors',
      'Dr. Reddys',
      'Jockey',
      'Zespri',
      'Fevicreate',
      'Simpolo',
      'Mochi',
      'Fevicryl',
      'McCain',
      'Indriya',
      'Glow & Lovely',
      'Boheco',
      'Cartamundi',
      'ACCA',
      'Enamor',
      'Imagine',
    ],
  },
];

/**
 * SBU Data from Remaining_SBU_LineUp_cycle4.csv - SMP Department (Lines 173-181)
 */
const CYCLE4_SMP_SBU_LEADS = [
  {
    leads: ['Bianca Vapiwala'],
    brands: [
      'Oriana',
      'Torrent Electrical',
      'HDFC',
      'Mahindra Rise',
      'Kurlon',
      'Maybelline',
    ],
  },
];

/**
 * Generate slug from name
 */
const generateSlug = name => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Check if a lead name exists in an SBU
 */
const checkLeadInSBU = (sbu, leadName) => {
  const normalizedLead = leadName.toLowerCase().trim();

  // Check executiveVP
  if (
    sbu.executiveVP &&
    sbu.executiveVP.toLowerCase().includes(normalizedLead)
  ) {
    return true;
  }

  // Check associateVP
  if (
    sbu.associateVP &&
    sbu.associateVP.toLowerCase().includes(normalizedLead)
  ) {
    return true;
  }

  // Check associateVPs array
  if (
    sbu.associateVPs &&
    sbu.associateVPs.some(
      avp => avp && avp.toLowerCase().includes(normalizedLead)
    )
  ) {
    return true;
  }

  // Check creativeDirector
  if (
    sbu.creativeDirector &&
    sbu.creativeDirector.toLowerCase().includes(normalizedLead)
  ) {
    return true;
  }

  // Check leadNames array
  if (
    sbu.leadNames &&
    sbu.leadNames.some(ln => ln && ln.toLowerCase().includes(normalizedLead))
  ) {
    return true;
  }

  return false;
};

/**
 * Find matching SBU for a set of leads
 */
const findMatchingSBU = (allSBUs, leads) => {
  // For single lead, find SBU where that lead is in executiveVP or leadNames
  // For multiple leads, find SBU where ALL leads are present

  for (const sbu of allSBUs) {
    const allLeadsMatch = leads.every(lead => checkLeadInSBU(sbu, lead));
    if (allLeadsMatch) {
      return sbu;
    }
  }

  return null;
};

/**
 * Find Brand ObjectIds by their names
 * Uses case-insensitive matching and handles variations
 */
const findBrandIds = async brandNames => {
  if (!brandNames || brandNames.length === 0) return [];

  const brandIds = [];
  const allBrands = await Brand.find({ isActive: true });

  for (const brandName of brandNames) {
    const normalizedName = brandName.toLowerCase().trim();

    // Try exact match first
    let brand = allBrands.find(
      b => b.name.toLowerCase().trim() === normalizedName
    );

    // If no exact match, try partial match
    if (!brand) {
      brand = allBrands.find(
        b =>
          b.name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(b.name.toLowerCase())
      );
    }

    // Try slug match
    if (!brand) {
      const slug = normalizedName
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      brand = allBrands.find(b => b.slug === slug);
    }

    if (brand) {
      brandIds.push(brand._id);
    }
  }

  return brandIds;
};

/**
 * Get or create Cycle 4
 */
async function getOrCreateCycle4() {
  let cycle = await Cycle.findOne({ cycleNumber: 4, year: 2025 });

  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 4',
      cycleNumber: 4,
      year: 2025,
      startDate: new Date(2025, 8, 1),
      endDate: new Date(2025, 9, 31, 23, 59, 59, 999),
      status: 'active',
      isActive: true,
    });
    console.log('  ✓ Created Cycle 4 (2025)');
  } else {
    console.log('  ✓ Found existing Cycle 4 (2025)');
  }

  return cycle;
}

/**
 * Seed SBUs and SBU History for a specific department
 */
async function seedSBUs(cycleId, departmentId, departmentName, sbuLeadsData) {
  console.log(`\n🏢 Processing SBUs for ${departmentName} Department...`);

  // Get all existing SBUs for this department
  const allSBUs = await SBU.find({ departmentId });
  console.log(
    `  📋 Found ${allSBUs.length} existing SBUs for ${departmentName}\n`
  );

  let sbusCreated = 0;
  let sbusFound = 0;
  let historyCreated = 0;

  // Track all SBUs that need SBUHistory entries
  const sbuHistoryEntries = [];

  for (const sbuData of sbuLeadsData) {
    const leadDisplay = sbuData.leads.join(' + ');

    try {
      // Check if SBU with these leads already exists in this department
      const existingSBU = findMatchingSBU(allSBUs, sbuData.leads);

      if (existingSBU) {
        sbusFound++;
        console.log(
          `  ○ Found existing SBU: "${existingSBU.name}" (matches leads: ${leadDisplay})`
        );

        // Add to history entries with leads and brands from CSV
        sbuHistoryEntries.push({
          sbu: existingSBU,
          leads: sbuData.leads,
          brands: sbuData.brands,
        });
      } else {
        // Create new SBU only if no matching one exists
        const sbuName = `SBU ${leadDisplay}`;
        const slug = generateSlug(`${departmentName}-${sbuName}`);

        const newSBU = await SBU.create({
          name: sbuName,
          slug,
          departmentId,
          executiveVP: sbuData.leads[0], // First lead as executiveVP
          associateVPs: sbuData.leads.slice(1), // Rest as associateVPs
          leadNames: sbuData.leads,
          isActive: true,
        });

        sbusCreated++;
        console.log(`  ✓ Created SBU: "${sbuName}" (leads: ${leadDisplay})`);

        // Add to allSBUs for future matching
        allSBUs.push(newSBU);

        // Add to history entries with leads and brands from CSV
        sbuHistoryEntries.push({
          sbu: newSBU,
          leads: sbuData.leads,
          brands: sbuData.brands,
        });
      }
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key - SBU already exists
        console.log(
          `  ○ SBU for leads "${leadDisplay}" already exists (duplicate key)`
        );
        sbusFound++;
      } else {
        console.error(
          `  ✗ Failed to process SBU for leads "${leadDisplay}":`,
          error.message
        );
      }
    }
  }

  console.log(
    `\n✅ ${departmentName} SBUs: ${sbusCreated} created, ${sbusFound} found existing`
  );

  // Create SBU History for ALL processed SBUs
  console.log(`\n📜 Creating SBU History entries for ${departmentName}...`);

  for (const entry of sbuHistoryEntries) {
    try {
      // Get brand ObjectIds first (calculate once)
      const brandIds = await findBrandIds(entry.brands);

      await SBUHistory.findOneAndUpdate(
        { sbuId: entry.sbu._id, cycleId, departmentId },
        {
          sbuId: entry.sbu._id,
          cycleId,
          departmentId,
          executiveVP: entry.sbu.executiveVP || entry.leads[0] || null,
          associateVP: entry.sbu.associateVP || null,
          associateVPs:
            entry.sbu.associateVPs && entry.sbu.associateVPs.length > 0
              ? entry.sbu.associateVPs
              : entry.leads.slice(1),
          creativeDirector: entry.sbu.creativeDirector || null,
          // Use entry.leads as primary source for leadNames (from CSV data for this cycle)
          leadNames: entry.leads,
          // Use the pre-calculated brand ObjectIds
          brands: brandIds,
          snapshotReason: 'cycle_start',
        },
        { upsert: true, new: true }
      );

      console.log(
        `  ✓ Created history for: "${entry.sbu.name}" (${brandIds.length}/${entry.brands?.length || 0} brands linked)`
      );
      historyCreated++;
    } catch (error) {
      console.error(
        `  ✗ Failed to create history for "${entry.sbu.name}":`,
        error.message
      );
    }
  }

  console.log(
    `\n✅ ${departmentName} SBU History: ${historyCreated} entries created/updated`
  );
  return { sbusCreated, sbusFound, historyCreated };
}

/**
 * Get or create a department by name
 */
async function getOrCreateDepartment(name, displayName, description) {
  let department = await Department.findOne({ name });

  if (!department) {
    department = await Department.create({
      name,
      displayName,
      description,
      hasSBUs: true,
      isActive: true,
    });
    console.log(`  ✓ Created ${displayName} department`);
  } else {
    console.log(`  ✓ Found existing ${displayName} department`);
  }

  return department;
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting Cycle 4 SBU Seeding (All Departments)...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create Cycle 4
    console.log('📅 Setting up Cycle 4...');
    const cycle = await getOrCreateCycle4();

    // Track totals
    let totalSBUsCreated = 0;
    let totalSBUsFound = 0;
    let totalHistoryCreated = 0;

    // ========== SOLUTIONS DEPARTMENT ==========
    console.log('\n' + '='.repeat(60));
    console.log('🏛️ SOLUTIONS DEPARTMENT');
    console.log('='.repeat(60));
    const solutionsDept = await getOrCreateDepartment(
      'solutions',
      'Brand Solutions',
      'Brand Solutions / Creative department'
    );
    const solutionsResult = await seedSBUs(
      cycle._id,
      solutionsDept._id,
      'Solutions',
      CYCLE4_SOLUTIONS_SBU_LEADS
    );
    totalSBUsCreated += solutionsResult.sbusCreated;
    totalSBUsFound += solutionsResult.sbusFound;
    totalHistoryCreated += solutionsResult.historyCreated;

    // ========== MEDIA DEPARTMENT ==========
    console.log('\n' + '='.repeat(60));
    console.log('🏛️ MEDIA DEPARTMENT');
    console.log('='.repeat(60));
    const mediaDept = await getOrCreateDepartment(
      'media',
      'Media',
      'Media department'
    );
    const mediaResult = await seedSBUs(
      cycle._id,
      mediaDept._id,
      'Media',
      CYCLE4_MEDIA_SBU_LEADS
    );
    totalSBUsCreated += mediaResult.sbusCreated;
    totalSBUsFound += mediaResult.sbusFound;
    totalHistoryCreated += mediaResult.historyCreated;

    // ========== TECH DEPARTMENT ==========
    console.log('\n' + '='.repeat(60));
    console.log('🏛️ TECH DEPARTMENT');
    console.log('='.repeat(60));
    const techDept = await getOrCreateDepartment(
      'tech',
      'Tech',
      'Technology department'
    );
    const techResult = await seedSBUs(
      cycle._id,
      techDept._id,
      'Tech',
      CYCLE4_TECH_SBU_LEADS
    );
    totalSBUsCreated += techResult.sbusCreated;
    totalSBUsFound += techResult.sbusFound;
    totalHistoryCreated += techResult.historyCreated;

    // ========== SEO DEPARTMENT ==========
    console.log('\n' + '='.repeat(60));
    console.log('🏛️ SEO DEPARTMENT');
    console.log('='.repeat(60));
    const seoDept = await getOrCreateDepartment(
      'seo',
      'SEO',
      'Search Engine Optimization department'
    );
    const seoResult = await seedSBUs(
      cycle._id,
      seoDept._id,
      'SEO',
      CYCLE4_SEO_SBU_LEADS
    );
    totalSBUsCreated += seoResult.sbusCreated;
    totalSBUsFound += seoResult.sbusFound;
    totalHistoryCreated += seoResult.historyCreated;

    // ========== MARTECH DEPARTMENT ==========
    console.log('\n' + '='.repeat(60));
    console.log('🏛️ MARTECH DEPARTMENT');
    console.log('='.repeat(60));
    const martechDept = await getOrCreateDepartment(
      'martech',
      'MarTech',
      'Marketing Technology department'
    );
    const martechResult = await seedSBUs(
      cycle._id,
      martechDept._id,
      'MarTech',
      CYCLE4_MARTECH_SBU_LEADS
    );
    totalSBUsCreated += martechResult.sbusCreated;
    totalSBUsFound += martechResult.sbusFound;
    totalHistoryCreated += martechResult.historyCreated;

    // ========== FLUENCE DEPARTMENT ==========
    console.log('\n' + '='.repeat(60));
    console.log('🏛️ FLUENCE DEPARTMENT');
    console.log('='.repeat(60));
    const fluenceDept = await getOrCreateDepartment(
      'fluence',
      'Fluence',
      'Influencer Marketing department'
    );
    const fluenceResult = await seedSBUs(
      cycle._id,
      fluenceDept._id,
      'Fluence',
      CYCLE4_FLUENCE_SBU_LEADS
    );
    totalSBUsCreated += fluenceResult.sbusCreated;
    totalSBUsFound += fluenceResult.sbusFound;
    totalHistoryCreated += fluenceResult.historyCreated;

    // ========== SMP DEPARTMENT ==========
    console.log('\n' + '='.repeat(60));
    console.log('🏛️ SMP DEPARTMENT');
    console.log('='.repeat(60));
    const smpDept = await getOrCreateDepartment(
      'smp',
      'SMP',
      'Social Media Production department'
    );
    const smpResult = await seedSBUs(
      cycle._id,
      smpDept._id,
      'SMP',
      CYCLE4_SMP_SBU_LEADS
    );
    totalSBUsCreated += smpResult.sbusCreated;
    totalSBUsFound += smpResult.sbusFound;
    totalHistoryCreated += smpResult.historyCreated;

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    const sbuCount = await SBU.countDocuments();
    const sbuHistoryCount = await SBUHistory.countDocuments({
      cycleId: cycle._id,
    });

    console.log(`   Total SBUs created this run: ${totalSBUsCreated}`);
    console.log(`   Total SBUs found existing: ${totalSBUsFound}`);
    console.log(`   Total SBU History entries created: ${totalHistoryCreated}`);
    console.log(`   Total SBUs in DB: ${sbuCount}`);
    console.log(`   Total SBU History entries for Cycle 4: ${sbuHistoryCount}`);

    console.log(
      '\n🎉 Cycle 4 SBU seeding completed successfully for ALL departments!'
    );
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
