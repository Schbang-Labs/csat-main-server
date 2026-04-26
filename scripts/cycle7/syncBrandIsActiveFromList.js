/**
 * Sync Script - Mark Brands active/inactive based on a brand-name list
 *
 * Reads active brand names from .gemini/data.md (one name per line, first
 * line is a header "Brands"). Normalizes each entry (trim + lowercase +
 * collapse whitespace + strip trailing punctuation) and dedupes.
 *
 * Matching rules (no fuzzy matching):
 *   1. Exact normalized match: listName === brandName
 *   2. Explicit overrides: listName → array of normalized brand names that
 *      should also be activated. Use OVERRIDES for known aliases such as
 *      "Kotak811"↔"Kotak 811" or compound list entries that map to several
 *      separate Brand documents (e.g. "Marvel + Disney" → ["marvel","disney"]).
 *
 * Any list name not resolved by (1) or (2) stays unmatched and any Brand
 * not explicitly targeted stays (or becomes) isActive: false.
 * Only the Brand model is touched — history collections are NOT modified.
 *
 * Usage:
 *   node scripts/cycle7/syncBrandIsActiveFromList.js            # apply changes
 *   DRY_RUN=1 node scripts/cycle7/syncBrandIsActiveFromList.js  # preview only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import 'dotenv/config';
import { Brand } from '../../src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, '../../.gemini/data.md');
const BATCH_SIZE = 500;
const DRY_RUN = process.env.DRY_RUN === '1';

// Explicit overrides: normalized list-name → extra normalized brand-names.
// Start empty; after the first DRY_RUN, review "Unmatched list names" output
// and add alias entries here for any that should map to a differently-spelled
// Brand.name in the DB.
const OVERRIDES = {
  // Examples (uncomment / edit after first dry-run review):
  // 'kotak811': ['kotak 811'],
  // 'marvel + disney': ['marvel', 'disney'],
  // 'charmis + dermafique': ['charmis', 'dermafique'],
  // 'optimum nutrition + isopure': ['optimum nutrition', 'isopure'],
  // 'kotak 811 + kotak 811 (fin for all)': ['kotak 811', 'kotak 811 (fin for all)'],
  // 'castrol magnatec/ cars': ['castrol magnatec', 'castrol cars'],
  // 'britannia winkin cow and come alive': ['britannia winkin cow', 'britannia come alive'],
  // 'l\'oreal redken': ['loreal redken', "l'oreal redken"],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  // Skip line 0 (header "Brands")
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const n = normalize(line);
    if (!n) continue;
    rawCount.total++;
    if (names.has(n)) rawCount.dupes++;
    names.add(n);
  }
  return { names, rawCount };
}

function resolveActiveBrandIds(activeNameSet, brands) {
  const activeIds = new Set();
  const matchDetails = new Map();

  const byFull = new Map(); // normName → brands[]
  for (const b of brands) {
    const n = normalize(b.name);
    if (!n) continue;
    if (!byFull.has(n)) byFull.set(n, []);
    byFull.get(n).push(b);
  }

  for (const listName of activeNameSet) {
    const hits = [];

    if (byFull.has(listName)) {
      for (const b of byFull.get(listName)) hits.push({ b, via: 'exact' });
    }

    for (const target of OVERRIDES[listName] || []) {
      if (byFull.has(target)) {
        for (const b of byFull.get(target)) {
          if (!hits.some(h => String(h.b._id) === String(b._id))) {
            hits.push({ b, via: `override:${target}` });
          }
        }
      }
    }

    matchDetails.set(listName, hits);
    for (const h of hits) activeIds.add(String(h.b._id));
  }

  return { activeIds, matchDetails };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('========================================================');
  console.log('  Sync Brand.isActive from brand-name list');
  console.log(`  DRY_RUN=${DRY_RUN ? '1 (no writes)' : '0 (writes enabled)'}`);
  console.log('========================================================\n');

  const { names: activeNameSet, rawCount } = parseActiveNames(DATA_FILE);
  console.log(`Source file:               ${DATA_FILE}`);
  console.log(`List lines (non-empty):    ${rawCount.total}`);
  console.log(`Duplicate names collapsed: ${rawCount.dupes}`);
  console.log(`Unique list brands:        ${activeNameSet.size}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const brands = await Brand.find({}, { _id: 1, name: 1, isActive: 1 }).lean();
    const total = brands.length;
    console.log(`Total brands in DB:        ${total}`);

    const { activeIds, matchDetails } = resolveActiveBrandIds(
      activeNameSet,
      brands
    );

    let toActivate = 0;
    let toDeactivate = 0;
    let alreadyActive = 0;
    let alreadyInactive = 0;
    const ops = [];

    for (const b of brands) {
      const shouldBeActive = activeIds.has(String(b._id));
      const currentlyActive = b.isActive !== false;
      if (shouldBeActive === currentlyActive) {
        if (currentlyActive) alreadyActive++;
        else alreadyInactive++;
        continue;
      }
      if (shouldBeActive) toActivate++;
      else toDeactivate++;
      ops.push({
        updateOne: {
          filter: { _id: b._id },
          update: { $set: { isActive: shouldBeActive } },
        },
      });
    }

    let flushed = 0;
    while (ops.length > 0) {
      const batch = ops.splice(0, BATCH_SIZE);
      if (!DRY_RUN) await Brand.bulkWrite(batch, { ordered: false });
      flushed += batch.length;
      console.log(`  ${DRY_RUN ? 'Previewed' : 'Wrote'} ${flushed}`);
    }

    // Diagnostics
    const unmatched = [];
    const overrideMatches = [];
    const multiHit = [];
    for (const [name, hits] of matchDetails.entries()) {
      if (hits.length === 0) {
        unmatched.push(name);
      } else {
        if (hits.length > 1) multiHit.push({ name, hits });
        if (hits.every(h => h.via.startsWith('override'))) {
          overrideMatches.push({ name, hits });
        }
      }
    }

    const currentlyActive = brands.filter(b => b.isActive !== false);
    const orphanActive = currentlyActive.filter(
      b => !activeIds.has(String(b._id))
    );

    console.log('\n========================================================');
    console.log('  Summary');
    console.log('========================================================');
    console.log(`  Total brands:              ${total}`);
    console.log(`  Unique list names:         ${activeNameSet.size}`);
    console.log(`  Matched active brand _ids: ${activeIds.size}`);
    console.log(`  Unmatched list names:      ${unmatched.length}`);
    console.log(`  Already active, kept:      ${alreadyActive}`);
    console.log(`  Already inactive, kept:    ${alreadyInactive}`);
    console.log(`  Will activate:             ${toActivate}`);
    console.log(`  Will deactivate:           ${toDeactivate}`);
    console.log(`  Orphan currently-active:   ${orphanActive.length}`);
    console.log(`  Mode:                      ${DRY_RUN ? 'DRY_RUN (no writes)' : 'APPLIED'}`);

    if (overrideMatches.length > 0) {
      console.log('\n  Override matches applied:');
      for (const { name, hits } of overrideMatches) {
        console.log(`    - ${name}  →  ${hits.map(h => `${h.b.name} [${h.via}]`).join('; ')}`);
      }
    }

    if (multiHit.length > 0) {
      console.log('\n  List names matching multiple Brand docs:');
      for (const { name, hits } of multiHit) {
        console.log(`    - ${name}  →  ${hits.length} rows: ${hits.map(h => h.b.name).join('; ')}`);
      }
    }

    if (unmatched.length > 0) {
      console.log('\n  Unmatched list names (no Brand match — add to OVERRIDES if needed):');
      for (const n of unmatched) console.log(`    - ${n}`);
    }

    if (orphanActive.length > 0) {
      console.log(`\n  Orphan active brands — isActive=true today but NOT in list (${orphanActive.length}):`);
      const sample = orphanActive.slice(0, 50);
      for (const b of sample) console.log(`    • ${b.name}  (_id=${b._id})`);
      if (orphanActive.length > sample.length) {
        console.log(`    … (+${orphanActive.length - sample.length} more)`);
      }
    }
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
