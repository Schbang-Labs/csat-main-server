/**
 * Seed Script - Cycle 1 SBUs and SBU History (Solutions Department Only)
 *
 * This script:
 * 1. Parses the SBU lineup from CSV to get unique SBU lead combinations
 * 2. Checks if SBU exists by matching executiveVP, associateVP, associateVPs, or leadNames
 * 3. If SBU exists - do NOT create a new one
 * 4. If SBU doesn't exist - create a new SBU
 * 5. Create SBU History entries for ALL SBUs (existing + new) for Cycle 1
 *
 * NOTE: Only Solutions department is seeded as we don't have CSAT responses for other departments in Cycle 1
 *
 * Run with: node scripts/cycle1/seedCycle1SBUs.js
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
 * SBU Data from SBU_lineUp_solutions_cycle1.csv - SOLUTIONS Department
 * Lead combinations with their associated brands for Cycle 1
 */
const CYCLE1_SOLUTIONS_SBU_LEADS = [
  {
    leads: ['Chirag', 'Apurvah'],
    brands: [
      'Amazon Prime Video',
      'Glow & Lovely',
      'Alpenliebe',
      'Happydent',
      'Juzt Jelly + Center Fruit',
      'PVMI (Perfetti Employer)',
      'Centerfresh',
      'Mentos',
      'Huggies',
      'Bajaj Almond',
      'Gyproc',
      'Maybelline',
      'Enamor',
      'Bridgestone Tyres',
      'Pepsi Srilanka',
      'Bookmyshow',
      'Cartamundi',
      'Sanofi Allergy',
      'Medimix',
    ],
  },
  {
    leads: ['Aayush', 'Samarth'],
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
      'Vantara',
      'Vantara Niwas',
      'Reliance Jio',
      'NMACC and JWCC',
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
      'ProCook',
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
      'TATA Cliq Lifestyle',
    ],
  },
  {
    leads: ['Dhruv', 'Aniket'],
    brands: [
      'Fevicol',
      'Fiama',
      'Kotak811',
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
      'Castrol POWER2',
      'Castrol Magnatec/Cars',
      'NueGo',
      'Sapient Finserv',
      'Mahindra Rise',
      'Aditya Birla Paints',
      'CRIF High Mark',
    ],
  },
  {
    leads: ['Shreya'],
    brands: [
      'MTR',
      'ITC Hotels',
      'Tata Consumer Products',
      'McCain',
      'Wok and Roll',
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
    leads: ['Vrinda'],
    brands: [
      'Swiggy Minis/Pyng',
      'Tata Neu FS',
      'Neu Card',
      'Jockey',
      'Oriana',
      'Amazon Fresh',
      'Ample Group',
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
      'Dabur Oxy',
      'Dabur Fem',
      'Dabur Almond Oil',
      'Dabur Amla',
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
  const allBrands = await Brand.find({});

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
 * Get or create Cycle 1
 */
async function getOrCreateCycle1() {
  let cycle = await Cycle.findOne({ cycleNumber: 1, year: 2025 });

  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 1',
      cycleNumber: 1,
      year: 2025,
      startDate: new Date(2025, 0, 1), // January 1
      endDate: new Date(2025, 1, 28, 23, 59, 59, 999), // February 28
      status: 'completed',
      isActive: false,
    });
    console.log('  ✓ Created Cycle 1 (2025)');
  } else {
    console.log('  ✓ Found existing Cycle 1 (2025)');
  }

  return cycle;
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
 * Main seed function
 */
async function seed() {
  console.log(
    '🌱 Starting Cycle 1 SBU Seeding (Solutions Department Only)...\n'
  );
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create Cycle 1
    console.log('📅 Setting up Cycle 1...');
    const cycle = await getOrCreateCycle1();

    // Track totals
    let totalSBUsCreated = 0;
    let totalSBUsFound = 0;
    let totalHistoryCreated = 0;

    // ========== SOLUTIONS DEPARTMENT ONLY ==========
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
      CYCLE1_SOLUTIONS_SBU_LEADS
    );
    totalSBUsCreated += solutionsResult.sbusCreated;
    totalSBUsFound += solutionsResult.sbusFound;
    totalHistoryCreated += solutionsResult.historyCreated;

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
    console.log(`   Total SBU History entries for Cycle 1: ${sbuHistoryCount}`);

    console.log(
      '\n🎉 Cycle 1 SBU seeding completed successfully for Solutions department!'
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
