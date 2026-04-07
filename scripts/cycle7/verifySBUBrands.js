/**
 * Cycle 7 - Verify SBU ↔ Brand Mappings (All Departments)
 *
 * Reads cycle7-sbu.md (tab-separated: Brand\tSBU Lead)
 * and checks whether each brand is present in the correct SBU.brands[] array in MongoDB.
 *
 * Outputs a list of mismatches: brands missing from expected SBU, or assigned to wrong SBU.
 *
 * Run with: node scripts/cycle7/verifySBUBrands.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { Brand, SBU } from '../../src/models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * SBU Lead Name → SBU Name mapping
 * Used for display purposes in logs.
 */
const SBU_LEAD_DISPLAY = {
  'Chirag': 'SBU Global India',
  'Samarth': 'SBU Next Wave',
  'Shreya': 'SBU For the Craft',
  'Sumesh': 'Bangalore',
  'Vrinda': 'SBU Corporate India',
  'Amit': 'SBU India Prime',
  'Dhruv + Malka': 'SBU Impact India',
  'Dhruv + Aniket': 'SBU India Rising 1',
  'Dhruv + Ria': 'SBU India Rising 2',
  'Dhruv + Jainik': 'SBU India Rising 3',
  'Rohan + Batul + Reuben': 'SBU India on the Move 1',
  'Rohan + Yohann': 'SBU India on the Move 2',
  'Afshaad': 'SBU Luxe',
  'Afshaad + Eric': 'SBU For the Arts',
  'Eric': 'SBU For the Arts',
  'Rohan + Varsha': 'SBU GenHer',
  'Mrugank Desai': 'NO SBU (Media)',
  'Carolyn Fernandes': 'NO SBU (Carolyn)',
  'Melissa Thomas': 'NO SBU (Melissa)',
  'Akshay Chatlani': 'NO SBU (Akshay)',
  'Harshkumar Pasi': 'Wa Schbang',
  'Fluence': 'Fluence',
  'SMP': 'SMP',
};

/**
 * SBU Lead Name → SBU slug mapping
 * Slug is used to find the exact SBU in DB (avoids ambiguity with "NO SBU" across departments).
 * For media "NO SBU", we use the direct SBU ObjectId since slug is shared.
 */
const MEDIA_SBU_ID = '697094a94a30795777e84b3e';

/**
 * Direct SBU ObjectId lookups per department.
 * Each lead can map to multiple SBU IDs (one per department).
 */
const DIRECT_SBU_IDS = {
  'Mrugank Desai': [MEDIA_SBU_ID],
  'Carolyn Fernandes': [
    '697094d7818800e6498d1682', // Tech
    '697094d7818800e6498d1913', // SEO
    '697094d7818800e6498d1ba4', // Martech
  ],
  'Melissa Thomas': [
    '697094d7818800e6498d1684', // Tech
    '697094d7818800e6498d1915', // SEO
    '697094d7818800e6498d1ba6', // Martech
  ],
  'Akshay Chatlani': [
    '699310bad1a3ee19240fe48d', // Tech
    '699310bad1a3ee19240fe497', // SEO
    '699310bad1a3ee19240fe49f', // Martech
  ],
  'Harshkumar Pasi': [
    '698ad8f77bf659e849100379', // Wa Schbang (Martech)
  ],
  'Fluence': [
    '697094a94a30795777e84b52', // Fluence
  ],
  'SMP': [
    '697094a94a30795777e84b57', // SMP
  ],
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Known brand name aliases: markdown name → DB name
 */
const BRAND_NAME_ALIASES = {
  'Specta': 'Specta Surfaces',
  'Dr. Reddy': "Dr. Reddy's Laboratories",
};

/** Resolve alias if one exists */
const resolveBrandAlias = (name) => BRAND_NAME_ALIASES[name] || name;

/**
 * Parse the cycle7-sbu.md file.
 * Supports two formats:
 *   1. Tab-separated: Brand\tSBU Lead
 *   2. Single-column: Brand names only (all assigned to defaultSBU)
 * Returns Map<brandName, sbuLeadName> (deduplicates by brand name)
 */
const parseSBUData = (defaultSBU = null) => {
  const mdPath = path.join(__dirname, 'cycle7-sbu.md');
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');

  const brandSBUMap = new Map(); // brandName -> sbuLeadName

  // Detect format: check if any non-header line has a tab
  const hasTabFormat = lines.some((line) => {
    if (!line.includes('\t')) return false;
    const parts = line.split('\t');
    const col0 = parts[0].trim();
    const col1 = parts[1] ? parts[1].trim() : '';
    if ((col0 === 'Brands' || col0 === 'Brand Name') && col1 === 'SBU') return false;
    return col0 && col1;
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (hasTabFormat) {
      if (!line.includes('\t')) continue;
      const parts = line.split('\t');
      const brandName = parts[0].trim();
      const sbuLead = parts[1] ? parts[1].trim() : '';

      // Skip header row
      if (brandName === 'Brands' && sbuLead === 'SBU') continue;
      if (brandName === 'Brand Name' && sbuLead === 'SBU') continue;

      if (!brandName || !sbuLead) continue;
      brandSBUMap.set(brandName, sbuLead);
    } else {
      // Single-column format: just brand names
      const brandName = line.trim();
      if (!brandName) continue;
      if (brandName === 'Brand Name' || brandName === 'Brands') continue;
      if (!defaultSBU) continue;
      brandSBUMap.set(brandName, defaultSBU);
    }
  }

  return brandSBUMap;
};

async function verifySBUBrands() {
  console.log('═'.repeat(70));
  console.log('  Cycle 7 - Verify SBU ↔ Brand Mappings (All Departments)');
  console.log('═'.repeat(70));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Load all SBUs with brands populated
    const allSBUs = await SBU.find({ isActive: true }).populate('brands', 'name slug');
    console.log(`📋 Loaded ${allSBUs.length} SBUs from DB\n`);

    // Build lookups: by ID and by name
    const sbuById = new Map();  // sbuId -> { sbu, brandIdSet }
    const sbuByName = new Map(); // sbuName -> { sbu, brandIdSet } (for solutions SBUs with unique names)
    for (const sbu of allSBUs) {
      const brandIdSet = new Set(sbu.brands.map(b => String(b._id)));
      const entry = { sbu, brandIdSet, brandNames: sbu.brands.map(b => b.name) };
      sbuById.set(String(sbu._id), entry);
      sbuByName.set(sbu.name, entry);
    }

    // Parse expected mappings from markdown
    // Support --default-sbu CLI arg for single-column md files (e.g. --default-sbu=SMP)
    const defaultSBUArg = process.argv.find(a => a.startsWith('--default-sbu='));
    const defaultSBU = defaultSBUArg ? defaultSBUArg.split('=')[1] : null;
    const brandSBUMap = parseSBUData(defaultSBU);
    console.log(`📋 Found ${brandSBUMap.size} brand→SBU mappings in markdown\n`);

    // Results tracking
    const mismatches = [];
    const brandNotFound = [];
    const sbuNotFound = [];
    const correctlyMapped = [];
    let checked = 0;

    for (const [brandName, sbuLead] of brandSBUMap) {
      checked++;

      // Resolve SBU lead name to display name
      const expectedSBUDisplay = SBU_LEAD_DISPLAY[sbuLead];
      if (!expectedSBUDisplay) {
        sbuNotFound.push({ brandName, sbuLead });
        continue;
      }

      // Find brand in DB (resolve alias first)
      const lookupName = resolveBrandAlias(brandName);
      let brand = await Brand.findOne({ name: lookupName });
      if (!brand) {
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${escapeRegex(lookupName)}$`, 'i') },
        });
      }
      if (!brand) {
        const slug = generateSlug(lookupName);
        brand = await Brand.findOne({ slug });
      }

      if (!brand) {
        brandNotFound.push({ brandName, expectedSBU: expectedSBUDisplay, sbuLead });
        continue;
      }

      // Resolve expected SBU: use direct IDs for leads with known SBU IDs, name lookup otherwise
      let expectedSBUEntries = [];
      if (DIRECT_SBU_IDS[sbuLead]) {
        for (const id of DIRECT_SBU_IDS[sbuLead]) {
          const entry = sbuById.get(id);
          if (entry) expectedSBUEntries.push(entry);
        }
      } else {
        const entry = sbuByName.get(expectedSBUDisplay);
        if (entry) expectedSBUEntries.push(entry);
      }

      if (expectedSBUEntries.length === 0) {
        sbuNotFound.push({ brandName, sbuLead, expectedSBUName: expectedSBUDisplay });
        continue;
      }

      const isInExpectedSBU = expectedSBUEntries.some(e => e.brandIdSet.has(String(brand._id)));

      if (isInExpectedSBU) {
        correctlyMapped.push({ brandName, sbuName: expectedSBUDisplay });
      } else {
        // Find which SBU this brand IS currently in (if any)
        let currentSBU = null;
        for (const [sbuId, sbuData] of sbuById) {
          if (sbuData.brandIdSet.has(String(brand._id))) {
            currentSBU = `${sbuData.sbu.name} (${sbuId})`;
            break;
          }
        }

        // Collect the expected SBU IDs for fixing
        const expectedSBUIds = DIRECT_SBU_IDS[sbuLead] || [];

        mismatches.push({
          brandName,
          brandId: String(brand._id),
          expectedSBU: expectedSBUDisplay,
          expectedSBUIds,
          currentSBU: currentSBU || '(not in any SBU)',
          sbuLead,
        });
      }
    }

    // ═══════ OUTPUT RESULTS ═══════

    // Mismatches
    if (mismatches.length > 0) {
      console.log('─'.repeat(70));
      console.log(`  ❌ MISMATCHED BRANDS (${mismatches.length})`);
      console.log('─'.repeat(70));
      for (const m of mismatches) {
        console.log(`   Brand:       "${m.brandName}" (${m.brandId})`);
        console.log(`   Expected in: "${m.expectedSBU}" (lead: ${m.sbuLead})`);
        console.log(`   Currently in: ${m.currentSBU}`);
        console.log('');
      }
    }

    // Brands not found in DB
    if (brandNotFound.length > 0) {
      console.log('─'.repeat(70));
      console.log(`  ⚠️  BRANDS NOT FOUND IN DB (${brandNotFound.length})`);
      console.log('─'.repeat(70));
      for (const b of brandNotFound) {
        console.log(`   "${b.brandName}" → expected SBU: "${b.expectedSBU}" (lead: ${b.sbuLead})`);
      }
      console.log('');
    }

    // SBU leads not recognized
    if (sbuNotFound.length > 0) {
      console.log('─'.repeat(70));
      console.log(`  ⚠️  UNRECOGNIZED SBU LEADS (${sbuNotFound.length})`);
      console.log('─'.repeat(70));
      for (const s of sbuNotFound) {
        console.log(`   Brand: "${s.brandName}" → SBU Lead: "${s.sbuLead}"${s.expectedSBUName ? ` (mapped to: "${s.expectedSBUName}" which doesn't exist in DB)` : ' (unknown lead name)'}`);
      }
      console.log('');
    }

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('  Summary');
    console.log('═'.repeat(70));
    console.log(`   Total brand→SBU entries:     ${brandSBUMap.size}`);
    console.log(`   Checked:                     ${checked}`);
    console.log(`   ✅ Correctly mapped:          ${correctlyMapped.length}`);
    console.log(`   ❌ Mismatched:                ${mismatches.length}`);
    console.log(`   ⚠️  Brand not found in DB:    ${brandNotFound.length}`);
    console.log(`   ⚠️  SBU lead unrecognized:    ${sbuNotFound.length}`);
    console.log('═'.repeat(70));

    // ═══════ FIX PROMPT ═══════
    if (mismatches.length > 0) {
      const answer = await askUser('\n🔧 Do you want to fix mismatched/unassigned brands? (yes/no): ');
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        let fixed = 0;
        let fixErrors = 0;

        for (const m of mismatches) {
          // For direct SBU ID leads, assign to all their SBUs
          if (m.expectedSBUIds.length > 0) {
            for (const sbuId of m.expectedSBUIds) {
              const sbuEntry = sbuById.get(sbuId);
              if (!sbuEntry) {
                console.log(`   ❌ SBU ${sbuId} not found for "${m.brandName}"`);
                fixErrors++;
                continue;
              }
              if (sbuEntry.brandIdSet.has(m.brandId)) {
                continue; // already in this SBU
              }
              await SBU.findByIdAndUpdate(sbuId, { $addToSet: { brands: m.brandId } });
              console.log(`   ✅ Assigned "${m.brandName}" → "${sbuEntry.sbu.name}" (${sbuId})`);
            }
            fixed++;
          } else {
            // Name-based SBU lookup
            const sbuEntry = sbuByName.get(m.expectedSBU);
            if (!sbuEntry) {
              console.log(`   ❌ SBU "${m.expectedSBU}" not found for "${m.brandName}"`);
              fixErrors++;
              continue;
            }
            await SBU.findByIdAndUpdate(sbuEntry.sbu._id, { $addToSet: { brands: m.brandId } });
            console.log(`   ✅ Assigned "${m.brandName}" → "${m.expectedSBU}"`);
            fixed++;
          }
        }

        console.log(`\n   Fixed: ${fixed} | Errors: ${fixErrors}`);
      } else {
        console.log('   Skipped fixing.');
      }
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

verifySBUBrands();
