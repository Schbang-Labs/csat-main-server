/**
 * Diagnostic - Why does Client.isActive=true show 337 when the POC list has ~280?
 *
 * Compares .gemini/data.md (list of active POC names) against the live Client
 * collection using the same matching rules as syncClientIsActiveFromList.js
 * (exact + explicit OVERRIDES). Explains the inflation by reporting:
 *
 *   1. Total list entries (unique after normalize + comma-split)
 *   2. How many DB Client rows are matched per list name (a single name can
 *      match multiple Client rows because (brandId, phone) is the uniqueness
 *      key — the same person serving two brands = two Client documents).
 *   3. Clients currently isActive=true that are NOT reached by any list name.
 *
 * Read-only. Does not modify anything.
 *
 * Run: node scripts/cycle7/diagnoseActiveClientCount.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import 'dotenv/config';
import { Client, Brand } from '../../src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../.gemini/data.md');

const OVERRIDES = {
  'pooja suchak': ['pooja shuchak'],
  'risha jindal': ['risha'],
  'aqueel siddiqui': ['aqueel mohammed'],
  'arjun': ['arjun visvanathan'],
  'bhavesh dalmia': ['bhavesh', 'bhavesh goel'],
  'pradeep alex': ['pradeep'],
  'rajagopalan': ['rajagopalan m'],
  'komal': ['komal shinde'],
  'nikita': ['nikita gupta'],
  'srishti': ['srishti mahopatra'],
};

const normalize = name =>
  (name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[.,;:]+$/g, '');

function parseActiveNames(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const names = new Set();
  const rawCount = { total: 0, dupes: 0 };
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    for (const part of line.split(',')) {
      const n = normalize(part);
      if (!n) continue;
      rawCount.total++;
      if (names.has(n)) rawCount.dupes++;
      names.add(n);
    }
  }
  return { names, rawCount };
}

async function main() {
  console.log('========================================================');
  console.log('  Diagnose: Why are there 337 active clients, not 280?');
  console.log('========================================================\n');

  const { names: activeNameSet, rawCount } = parseActiveNames(DATA_FILE);
  console.log(`Source file: ${DATA_FILE}`);
  console.log(`List lines (non-empty, split on commas):  ${rawCount.total}`);
  console.log(`Duplicate list names collapsed:           ${rawCount.dupes}`);
  console.log(`Unique list names:                        ${activeNameSet.size}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const clients = await Client.find(
      {},
      { _id: 1, name: 1, brandId: 1, phone: 1, isActive: 1 }
    ).lean();
    const total = clients.length;
    const currentlyActive = clients.filter(c => c.isActive !== false);

    console.log(`Total Client docs in DB:     ${total}`);
    console.log(`Currently isActive=true:     ${currentlyActive.length}\n`);

    // Bucket clients by normalized name
    const byFull = new Map();
    for (const c of clients) {
      const n = normalize(c.name);
      if (!n) continue;
      if (!byFull.has(n)) byFull.set(n, []);
      byFull.get(n).push(c);
    }

    // Resolve list → client docs
    const activatedIds = new Set();
    const perListMatches = []; // { listName, clients: [] }
    for (const listName of activeNameSet) {
      const hits = [];
      if (byFull.has(listName)) {
        for (const c of byFull.get(listName)) hits.push({ c, via: 'exact' });
      }
      for (const target of OVERRIDES[listName] || []) {
        if (byFull.has(target)) {
          for (const c of byFull.get(target)) {
            if (!hits.some(h => String(h.c._id) === String(c._id))) {
              hits.push({ c, via: `override:${target}` });
            }
          }
        }
      }
      for (const h of hits) activatedIds.add(String(h.c._id));
      perListMatches.push({ listName, hits });
    }

    // List names that hit multiple DB rows
    const multiHitNames = perListMatches
      .filter(x => x.hits.length > 1)
      .sort((a, b) => b.hits.length - a.hits.length);

    // List names with zero hits
    const unmatched = perListMatches.filter(x => x.hits.length === 0);

    // Currently-active clients NOT reachable from the list (orphans)
    const orphanActive = currentlyActive.filter(
      c => !activatedIds.has(String(c._id))
    );

    // How many extra client docs beyond the number of list names
    const extraFromMulti = multiHitNames.reduce(
      (sum, x) => sum + (x.hits.length - 1),
      0
    );

    console.log('========================================================');
    console.log('  Expected active count math');
    console.log('========================================================');
    console.log(`  Unique list names:            ${activeNameSet.size}`);
    console.log(`  + extra rows from multi-hits: ${extraFromMulti}`);
    console.log(`  - unmatched list names:       ${unmatched.length}`);
    console.log(
      `  = clients the sync would activate: ${activatedIds.size}\n`
    );

    console.log(
      `  Clients currently isActive=true:          ${currentlyActive.length}`
    );
    console.log(
      `  Clients currently active AND in list:     ${
        currentlyActive.filter(c => activatedIds.has(String(c._id))).length
      }`
    );
    console.log(
      `  Clients currently active but NOT in list: ${orphanActive.length} (orphans)`
    );
    console.log('');

    // Top offenders — list names that matched >1 client doc
    if (multiHitNames.length > 0) {
      console.log('========================================================');
      console.log(`  List names matching multiple Client docs (${multiHitNames.length})`);
      console.log('  Cause: same person = separate Client per (brandId, phone)');
      console.log('========================================================');

      const brandIds = new Set();
      for (const x of multiHitNames) for (const h of x.hits) brandIds.add(String(h.c.brandId));
      const brands = await Brand.find(
        { _id: { $in: [...brandIds] } },
        { name: 1 }
      ).lean();
      const brandMap = new Map(brands.map(b => [String(b._id), b.name]));

      for (const { listName, hits } of multiHitNames) {
        console.log(`\n  "${listName}" → ${hits.length} Client rows:`);
        for (const h of hits) {
          const brand = brandMap.get(String(h.c.brandId)) || '(unknown brand)';
          console.log(
            `      • ${h.c.name} | phone=${h.c.phone} | brand=${brand} | via=${h.via}`
          );
        }
      }
      console.log('');
    }

    if (orphanActive.length > 0) {
      console.log('========================================================');
      console.log(`  Orphan active clients — currently isActive=true but NOT in list (${orphanActive.length})`);
      console.log('  These are the ones the sync will flip to isActive=false');
      console.log('========================================================');
      const sample = orphanActive.slice(0, 30);
      for (const c of sample) {
        console.log(`    • ${c.name} | phone=${c.phone} | _id=${c._id}`);
      }
      if (orphanActive.length > sample.length) {
        console.log(`    … (+${orphanActive.length - sample.length} more)`);
      }
      console.log('');
    }

    if (unmatched.length > 0) {
      console.log('========================================================');
      console.log(`  Unmatched list names (${unmatched.length})`);
      console.log('========================================================');
      for (const { listName } of unmatched) console.log(`    - ${listName}`);
      console.log('');
    }

    console.log('========================================================');
    console.log('  Conclusion');
    console.log('========================================================');
    console.log(
      `  The list has ${activeNameSet.size} unique POC names, but the Client`
    );
    console.log(
      `  collection stores ONE document per (brandId, phone). A single POC`
    );
    console.log(
      `  who is the contact for multiple brands therefore occupies multiple`
    );
    console.log(
      `  Client documents. The ${multiHitNames.length} list names above`
    );
    console.log(
      `  collectively added ${extraFromMulti} extra rows on top of the`
    );
    console.log(
      `  ${activeNameSet.size - unmatched.length} names that did match at least one row,`
    );
    console.log(
      `  explaining the ${activatedIds.size} figure the sync produces.`
    );
    console.log(
      `  The delta from today's ${currentlyActive.length} → target ${activatedIds.size}`
    );
    console.log(
      `  is the ${orphanActive.length} orphan active clients listed above.`
    );
    console.log('========================================================\n');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
