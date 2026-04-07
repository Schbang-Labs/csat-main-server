/**
 * Cycle 7 - SBU Brand Moves & Leadership Updates
 *
 * This script performs 4 operations:
 * 1. Move Dominos from SBU Next Wave -> SBU Impact India
 * 2. Add AVP "Jainik" to SBU Impact India
 * 3. Add AVP "Yohann" to SBU India on the Move 1
 * 4. Move IQOO & Ecolink (Philips) from SBU Impact India -> SBU Next Wave
 *
 * Each brand move updates both the source SBU (remove from brands array),
 * the target SBU (add to brands array), and the brand's services[].sbuId.
 *
 * Run with: node scripts/cycle7/updateCycle7SBUs.js
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

// Target SBU IDs
const SBU_IMPACT_INDIA_ID = '697094a84a30795777e84b10';
const SBU_NEXT_WAVE_ID = '697094a84a30795777e84af5';
const SBU_INDIA_ON_THE_MOVE_1_ID = '697094a94a30795777e84b24';

/**
 * Find a brand by name with multi-level fallback
 * Tries: exact match -> case-insensitive regex -> slug match
 */
async function findBrandByName(name) {
  // Try exact match
  let brand = await Brand.findOne({ name, isActive: true });
  if (brand) return brand;

  // Try case-insensitive match
  brand = await Brand.findOne({
    name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    isActive: true,
  });
  if (brand) return brand;

  // Try slug match
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  brand = await Brand.findOne({ slug, isActive: true });
  if (brand) return brand;

  return null;
}

/**
 * Move a brand from one SBU to another
 * Updates: source SBU brands array, target SBU brands array, brand services[].sbuId
 */
async function moveBrand(brandName, fromSbuId, toSbuId, fromSbuName, toSbuName) {
  // Try multiple name variations
  const variations = [brandName];
  let brand = null;

  for (const name of variations) {
    brand = await findBrandByName(name);
    if (brand) break;
  }

  if (!brand) {
    console.error(`   ❌ Brand "${brandName}" not found in database`);
    return false;
  }

  console.log(`   📌 Found brand: ${brand.name} (${brand._id})`);

  // Remove from source SBU's brands array
  const pullResult = await SBU.updateOne(
    { _id: fromSbuId },
    { $pull: { brands: brand._id } }
  );
  console.log(`   ➖ Removed from ${fromSbuName}: ${pullResult.modifiedCount > 0 ? 'yes' : 'was not in array'}`);

  // Add to target SBU's brands array
  const addResult = await SBU.updateOne(
    { _id: toSbuId },
    { $addToSet: { brands: brand._id } }
  );
  console.log(`   ➕ Added to ${toSbuName}: ${addResult.modifiedCount > 0 ? 'yes' : 'already present'}`);

  // Update brand's services[].sbuId for solutions department
  const toSbuObjectId = new mongoose.Types.ObjectId(toSbuId);
  const brandUpdateResult = await Brand.updateOne(
    { _id: brand._id, 'services.department': 'solutions' },
    { $set: { 'services.$.sbuId': toSbuObjectId } }
  );
  console.log(`   🔄 Updated brand services.sbuId: ${brandUpdateResult.modifiedCount > 0 ? 'yes' : 'no matching service entry'}`);

  return true;
}

async function updateCycle7SBUs() {
  console.log('═'.repeat(60));
  console.log('  Cycle 7 - SBU Brand Moves & Leadership Updates');
  console.log('═'.repeat(60));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ============================================================
    // STEP 1: Move Dominos from Next Wave -> Impact India
    // ============================================================
    console.log('─'.repeat(60));
    console.log('📦 Step 1: Move Dominos → SBU Impact India');
    console.log('─'.repeat(60));

    const domMoved = await moveBrand(
      'Dominos',
      SBU_NEXT_WAVE_ID,
      SBU_IMPACT_INDIA_ID,
      'SBU Next Wave',
      'SBU Impact India'
    );
    console.log(domMoved ? '   ✅ Dominos moved successfully\n' : '   ❌ Dominos move failed\n');

    // ============================================================
    // STEP 2: Add AVP "Jainik" to SBU Impact India
    // ============================================================
    console.log('─'.repeat(60));
    console.log('👤 Step 2: Add AVP "Jainik" to SBU Impact India');
    console.log('─'.repeat(60));

    const impactIndia = await SBU.findById(SBU_IMPACT_INDIA_ID);
    if (!impactIndia) {
      console.error('   ❌ SBU Impact India not found');
    } else {
      console.log(`   📌 Found SBU: ${impactIndia.name} (${impactIndia._id})`);

      await SBU.updateOne(
        { _id: SBU_IMPACT_INDIA_ID },
        {
          $addToSet: {
            leadNames: 'Jainik',
            associateVPs: 'Jainik',
          },
        }
      );

      const updated = await SBU.findById(SBU_IMPACT_INDIA_ID);
      console.log(`   ✅ leadNames: [${updated.leadNames.join(', ')}]`);
      console.log(`   ✅ associateVPs: [${updated.associateVPs.join(', ')}]`);
    }
    console.log();

    // ============================================================
    // STEP 3: Add AVP "Yohann" to SBU India on the Move 1
    // ============================================================
    console.log('─'.repeat(60));
    console.log('👤 Step 3: Add AVP "Yohann" to SBU India on the Move 1');
    console.log('─'.repeat(60));

    const indiaOnTheMove1 = await SBU.findById(SBU_INDIA_ON_THE_MOVE_1_ID);
    if (!indiaOnTheMove1) {
      console.error('   ❌ SBU India on the Move 1 not found');
    } else {
      console.log(`   📌 Found SBU: ${indiaOnTheMove1.name} (${indiaOnTheMove1._id})`);

      await SBU.updateOne(
        { _id: SBU_INDIA_ON_THE_MOVE_1_ID },
        {
          $addToSet: {
            leadNames: 'Yohann',
            associateVPs: 'Yohann',
          },
        }
      );

      const updated = await SBU.findById(SBU_INDIA_ON_THE_MOVE_1_ID);
      console.log(`   ✅ leadNames: [${updated.leadNames.join(', ')}]`);
      console.log(`   ✅ associateVPs: [${updated.associateVPs.join(', ')}]`);
    }
    console.log();

    // ============================================================
    // STEP 4: Move IQOO & Ecolink (Philips) from Impact India -> Next Wave
    // ============================================================
    console.log('─'.repeat(60));
    console.log('📦 Step 4: Move IQOO & Ecolink (Philips) → SBU Next Wave');
    console.log('─'.repeat(60));

    // Move IQOO
    console.log('\n   🔸 Moving IQOO...');
    const iqooMoved = await moveBrand(
      'iQOO',
      SBU_IMPACT_INDIA_ID,
      SBU_NEXT_WAVE_ID,
      'SBU Impact India',
      'SBU Next Wave'
    );
    console.log(iqooMoved ? '   ✅ IQOO moved successfully' : '   ❌ IQOO move failed');

    // Move Ecolink (Philips)
    console.log('\n   🔸 Moving Ecolink (Philips)...');
    let ecolinkMoved = await moveBrand(
      'Ecolink (Philips)',
      SBU_IMPACT_INDIA_ID,
      SBU_NEXT_WAVE_ID,
      'SBU Impact India',
      'SBU Next Wave'
    );

    // Fallback: try "Philips" if "Ecolink (Philips)" not found
    if (!ecolinkMoved) {
      console.log('   🔄 Retrying with name "Philips"...');
      ecolinkMoved = await moveBrand(
        'Philips',
        SBU_IMPACT_INDIA_ID,
        SBU_NEXT_WAVE_ID,
        'SBU Impact India',
        'SBU Next Wave'
      );
    }
    console.log(ecolinkMoved ? '   ✅ Ecolink (Philips) moved successfully' : '   ❌ Ecolink (Philips) move failed');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '═'.repeat(60));
    console.log('  Summary - Verification');
    console.log('═'.repeat(60));

    const finalImpactIndia = await SBU.findById(SBU_IMPACT_INDIA_ID).populate('brands', 'name');
    const finalNextWave = await SBU.findById(SBU_NEXT_WAVE_ID).populate('brands', 'name');
    const finalIndiaMove1 = await SBU.findById(SBU_INDIA_ON_THE_MOVE_1_ID);

    console.log(`\n📋 SBU Impact India (${SBU_IMPACT_INDIA_ID}):`);
    console.log(`   Brands (${finalImpactIndia.brands.length}): ${finalImpactIndia.brands.map(b => b.name).join(', ')}`);
    console.log(`   leadNames: [${finalImpactIndia.leadNames.join(', ')}]`);
    console.log(`   associateVPs: [${finalImpactIndia.associateVPs.join(', ')}]`);

    console.log(`\n📋 SBU Next Wave (${SBU_NEXT_WAVE_ID}):`);
    console.log(`   Brands (${finalNextWave.brands.length}): ${finalNextWave.brands.map(b => b.name).join(', ')}`);

    console.log(`\n📋 SBU India on the Move 1 (${SBU_INDIA_ON_THE_MOVE_1_ID}):`);
    console.log(`   leadNames: [${finalIndiaMove1.leadNames.join(', ')}]`);
    console.log(`   associateVPs: [${finalIndiaMove1.associateVPs.join(', ')}]`);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Cycle 7 SBU updates completed!');
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

updateCycle7SBUs();
