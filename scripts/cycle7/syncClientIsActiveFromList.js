/**
 * Sync Script - Mark Clients active/inactive based on a POC name list
 *
 * Reads the active POC name list from .gemini/data.md (one name per line,
 * first line is a header). Normalizes each name (trim + lowercase + collapse
 * internal whitespace). Splits entries containing commas (e.g. "Rhea, Komal")
 * into separate names.
 *
 * Matching rules (in this order — NO fuzzy / general first-word matching):
 *   1. Exact normalized match: listName === clientName
 *   2. Explicit overrides: listName maps to one-or-more specific client names
 *      via the OVERRIDES table below. Each override is applied ONLY for the
 *      list name it is keyed on.
 *
 * Any list name not resolved by (1) or (2) stays unmatched, and any Client
 * not explicitly targeted stays inactive. Only the Client model is touched.
 *
 * Usage:
 *   node scripts/cycle7/syncClientIsActiveFromList.js            # apply changes
 *   DRY_RUN=1 node scripts/cycle7/syncClientIsActiveFromList.js  # preview only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import 'dotenv/config';
import { Client } from '../../src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, '../../.gemini/data.md');
const BATCH_SIZE = 500;
const DRY_RUN = process.env.DRY_RUN === '1';

// Explicit overrides: normalized list-name → array of normalized client names
// that should be activated in addition to any exact match. Keep this list
// tight and curated — add entries here only for confirmed aliases.
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const normalize = name =>
  (name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    // Drop trailing punctuation like "Rajagopalan."
    .replace(/[.,;:]+$/g, '');

function parseActiveNames(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const names = new Set();
  // Skip line 0 (header "Brand POC Name"). Keep lines 1..end; ignore empties.
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    // Split comma-separated entries like "Rhea, Komal"
    for (const part of line.split(',')) {
      const n = normalize(part);
      if (n) names.add(n);
    }
  }
  return names;
}

/**
 * Resolve which client _ids should be marked active.
 * Returns { activeIds: Set<string>, matchDetails: Map<listName, hits[]> }.
 */
function resolveActiveClientIds(activeNameSet, clients) {
  const activeIds = new Set();
  const matchDetails = new Map();

  // Bucket clients by normalized full name
  const byFull = new Map(); // normName → clients[]
  for (const c of clients) {
    const n = normalize(c.name);
    if (!n) continue;
    if (!byFull.has(n)) byFull.set(n, []);
    byFull.get(n).push(c);
  }

  for (const listName of activeNameSet) {
    const hits = [];

    // 1. Exact normalized match
    if (byFull.has(listName)) {
      for (const c of byFull.get(listName)) hits.push({ c, via: 'exact' });
    }

    // 2. Explicit overrides
    const overrideTargets = OVERRIDES[listName] || [];
    for (const target of overrideTargets) {
      if (byFull.has(target)) {
        for (const c of byFull.get(target)) {
          if (!hits.some(h => String(h.c._id) === String(c._id))) {
            hits.push({ c, via: `override:${target}` });
          }
        }
      }
    }

    matchDetails.set(listName, hits);
    for (const h of hits) activeIds.add(String(h.c._id));
  }

  return { activeIds, matchDetails };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('========================================================');
  console.log('  Sync Client.isActive from POC name list');
  console.log(`  DRY_RUN=${DRY_RUN ? '1 (no writes)' : '0 (writes enabled)'}`);
  console.log('========================================================\n');

  const activeNameSet = parseActiveNames(DATA_FILE);
  console.log(`Active POC names parsed: ${activeNameSet.size}`);
  console.log(`Source file:             ${DATA_FILE}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const clients = await Client.find({}, { _id: 1, name: 1, isActive: 1 }).lean();
    const total = clients.length;
    console.log(`Total clients in DB:     ${total}\n`);

    const { activeIds, matchDetails } = resolveActiveClientIds(
      activeNameSet,
      clients
    );

    let toActivate = 0;
    let toDeactivate = 0;
    let alreadyActive = 0;
    let alreadyInactive = 0;
    const ops = [];

    for (const c of clients) {
      const shouldBeActive = activeIds.has(String(c._id));
      const currentlyActive = c.isActive !== false;
      if (shouldBeActive === currentlyActive) {
        if (currentlyActive) alreadyActive++;
        else alreadyInactive++;
        continue;
      }
      if (shouldBeActive) toActivate++;
      else toDeactivate++;
      ops.push({
        updateOne: {
          filter: { _id: c._id },
          update: { $set: { isActive: shouldBeActive } },
        },
      });
    }

    let flushed = 0;
    while (ops.length > 0) {
      const batch = ops.splice(0, BATCH_SIZE);
      if (!DRY_RUN) await Client.bulkWrite(batch, { ordered: false });
      flushed += batch.length;
      console.log(`  ${DRY_RUN ? 'Previewed' : 'Wrote'} ${flushed}`);
    }

    // Diagnostics
    const unmatched = [];
    const overrideMatches = [];
    for (const [name, hits] of matchDetails.entries()) {
      if (hits.length === 0) {
        unmatched.push(name);
      } else if (hits.every(h => h.via.startsWith('override'))) {
        overrideMatches.push({ name, hits });
      }
    }

    console.log('\n========================================================');
    console.log('  Summary');
    console.log('========================================================');
    console.log(`  Total clients:             ${total}`);
    console.log(`  List names (unique):       ${activeNameSet.size}`);
    console.log(`  Matched active client _ids: ${activeIds.size}`);
    console.log(`  Unmatched list names:      ${unmatched.length}`);
    console.log(`  Already active, kept:      ${alreadyActive}`);
    console.log(`  Already inactive, kept:    ${alreadyInactive}`);
    console.log(`  Will activate:             ${toActivate}`);
    console.log(`  Will deactivate:           ${toDeactivate}`);
    console.log(`  Mode:                      ${DRY_RUN ? 'DRY_RUN (no writes)' : 'APPLIED'}`);

    if (overrideMatches.length > 0) {
      console.log('\n  Override matches applied:');
      for (const { name, hits } of overrideMatches) {
        const shown = hits.map(h => `${h.c.name} [${h.via}]`).join('; ');
        console.log(`    - ${name}  →  ${shown}`);
      }
    }

    if (unmatched.length > 0) {
      console.log('\n  Unmatched list names (no Client match):');
      for (const n of unmatched) console.log(`    - ${n}`);
    }
    console.log('========================================================\n');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
