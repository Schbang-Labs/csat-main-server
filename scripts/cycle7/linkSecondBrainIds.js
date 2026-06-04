/**
 * Link Second Brain Brand IDs onto Mongo Brand documents
 * ------------------------------------------------------
 * Reads the `brands` table from the Second Brain (third_brain) Postgres RDS,
 * matches each row to a Mongo Brand document by normalized name, and writes the
 * Postgres `id` into Brand.secondBrainId.
 *
 * Matching tiers (first hit wins, no fuzzy guessing is ever written):
 *   1. EXACT      — normalized(mongo.name) === normalized(pg.name)
 *                   normalize = lowercase, strip every non-alphanumeric char.
 *   2. OVERRIDES  — explicit mongoNormalizedName -> pg brand id, curated below
 *                   for aliases / renames the exact pass can't catch.
 *
 * Anything not resolved by (1) or (2) is left untouched and reported under
 * "Unmatched". A best-effort containment-based SUGGESTION list is printed to
 * help you fill in OVERRIDES — suggestions are NEVER written automatically.
 *
 * Postgres credentials come from .env (SECONDBRAIN_DB_*). Mongo from MONGO_URI.
 *
 * Usage:
 *   DRY_RUN=1 node scripts/cycle7/linkSecondBrainIds.js   # preview only (default-safe)
 *   node scripts/cycle7/linkSecondBrainIds.js             # apply writes
 *
 * Env:
 *   DRY_RUN=1     no DB writes, just report
 *   OVERWRITE=1   re-link brands that already have a secondBrainId (default: skip them)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import pg from 'pg';
import { Brand } from '../../src/models/index.js';

const DRY_RUN = process.env.DRY_RUN === '1';
const OVERWRITE = process.env.OVERWRITE === '1';
const BATCH_SIZE = 500;

// normalized mongo name  ->  Postgres brands.id
// Fill these in after reviewing the SUGGESTIONS / Unmatched output of a dry run.
const OVERRIDES = {
  bajajalmond: 131, // Bajaj Almond -> Bajaj
  bridgestonetyres: 3, // Bridgestone Tyres -> bridgestone
  sanofiallergy: 134, // Sanofi Allergy -> Sanofi Allergy Free
  marveldisney: 137, // Marvel + Disney -> Marvel
  riotgamesvalorant: 136, // Riot Games - Valorant -> Valorant
  riotgamesleagueoflegends: 135, // Riot Games - League Of Legends -> League of Legends
  exoticapureglow: 182, // Exotica / Pure Glow -> PureGlow
  amplegroup: 229, // Ample Group -> Ample
  ultratechcement: 89, // UltraTech Cement -> Ultratech
  treo: 104, // Treo -> Treo Milton
  procook: 105, // Procook -> ProCook Milton
  gainbygalderma: 181, // GAIN by Galderma -> Galderma
  kotak811kotak811finforall: 16, // Kotak 811 + Kotak 811 (Fin For All) -> Kotak_811
  hobbyideas: 226, // Hobby Ideas -> Fevicryl Hobby Ideas
  phoenixmarketcity: 166, // Phoenix Marketcity -> Phoenix
  britanniacakes: 95, // Britannia Cakes -> Britannia Cakes and Breads
  britanniawinkincowandcomealive: 178, // Britannia Winkin Cow and Come Alive -> Britannia Winkin Cow
  britanniacheeseitup: 94, // Britannia CheeseitUp -> Britannia Cheese
  drreddyslaboratories: 170, // Dr. Reddy's Laboratories -> Dr. Reddy
  bonitodesign: 118, // Bonito Design -> Bonito Designs
  merakihabitat: 110, // Meraki Habitat -> Meraki Habitats
  hausergermany: 109, // Hauser Germany -> Hauser
  nuego: 123, // NueGo -> Greencell Nuego
  adityabirlapaints: 2, // Aditya Birla Paints -> adityabirla
  crifhighmark: 227, // CRIF High Mark -> CRIF
  lorealredken: 223, // L'oreal Redken -> Redken
  kumari: 10, // Kumari -> kumari_jewels
  nitamukeshambaniculturalcentrenmacc: 169, // NMACC
  jioworldconventioncentrejwcc: 171, // JWCC
  neucard: 217, // Neu Card -> Tata Neu Card
  orianatmarashoot: 198, // Oriana - Tmara shoot -> Oriana
  cartamundi: 133, // Cartamundi -> Parksons Cartamundi
  amazonprimevideo: 99, // Amazon Prime Video -> Amazon Prime
  medimixdatenight: 132, // Medimix Date Night -> Medimix
  daburoxy: 210, // Dabur Oxy -> Dabur OXYLIFE
  jwc: 171, // JWC -> JWCC
  huggieswonderpants: 128, // Huggies Wonder Pants -> Huggies
  miltonappliances: 106, // Milton Appliances -> Milton
  mccainretail: 190, // McCain Retail -> McCain
  schbanglabs: 258, // SchbangLabs -> Tech Team Schbang Labs
};

const normalize = s =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

function buildPgConfig() {
  const ssl =
    process.env.SECONDBRAIN_DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false;
  return {
    host: process.env.SECONDBRAIN_DB_HOST,
    port: Number(process.env.SECONDBRAIN_DB_PORT || 5432),
    database: process.env.SECONDBRAIN_DB_NAME,
    user: process.env.SECONDBRAIN_DB_USER,
    password: process.env.SECONDBRAIN_DB_PASS,
    ssl,
  };
}

async function fetchPgBrands() {
  const client = new pg.Client(buildPgConfig());
  await client.connect();
  try {
    const { rows } = await client.query(
      'SELECT id, name FROM brands ORDER BY id'
    );
    return rows;
  } finally {
    await client.end();
  }
}

function indexPgBrands(pgRows) {
  // normName -> [{id, name}, ...]  (collisions kept so we can warn)
  const byNorm = new Map();
  const byId = new Map();
  for (const r of pgRows) {
    byId.set(r.id, r);
    const k = normalize(r.name);
    if (!k) continue;
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(r);
  }
  return { byNorm, byId };
}

function suggestContainment(mongoNorm, pgNorms) {
  // Unique one-directional substring (len>=4) — heuristic only, never written.
  const hits = pgNorms.filter(
    pk => pk.length >= 4 && (mongoNorm.includes(pk) || pk.includes(mongoNorm))
  );
  return hits;
}

async function main() {
  console.log('========================================================');
  console.log('  Link Second Brain brand IDs -> Brand.secondBrainId');
  console.log(`  DRY_RUN=${DRY_RUN ? '1 (no writes)' : '0 (writes enabled)'}`);
  console.log(`  OVERWRITE=${OVERWRITE ? '1 (re-link existing)' : '0 (skip linked)'}`);
  console.log('========================================================\n');

  const pgRows = await fetchPgBrands();
  console.log(`Postgres brands fetched:   ${pgRows.length}`);

  const { byNorm, byId } = indexPgBrands(pgRows);
  const pgNorms = [...byNorm.keys()];

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  try {
    const brands = await Brand.find(
      {},
      { _id: 1, name: 1, secondBrainId: 1 }
    ).lean();
    console.log(`Mongo brands in DB:        ${brands.length}\n`);

    const matched = []; // {name, pgId, via}
    const skippedLinked = [];
    const unmatched = []; // {name, suggestions}
    const ambiguousPg = []; // exact normName mapped to >1 pg row

    // ── Phase 1: build candidate (pgId, via) per brand ───────────────────────
    const candidates = []; // {b, pgId, via}
    for (const b of brands) {
      const mongoNorm = normalize(b.name);
      let pgId = null;
      let via = null;

      // Tier 1: exact normalized
      if (byNorm.has(mongoNorm)) {
        const rows = byNorm.get(mongoNorm);
        if (rows.length > 1) {
          ambiguousPg.push({
            name: b.name,
            rows: rows.map(r => `${r.id}:${r.name}`),
          });
        }
        pgId = rows[0].id;
        via = 'exact';
      }

      // Tier 2: explicit override
      if (pgId == null && OVERRIDES[mongoNorm] != null) {
        const oid = OVERRIDES[mongoNorm];
        if (!byId.has(oid)) {
          console.warn(
            `  ! OVERRIDE for "${b.name}" points to pg id ${oid} which does not exist`
          );
        } else {
          pgId = oid;
          via = 'override';
        }
      }

      if (pgId == null) {
        unmatched.push({
          name: b.name,
          suggestions: suggestContainment(mongoNorm, pgNorms),
        });
      } else {
        candidates.push({ b, pgId, via });
      }
    }

    // ── Phase 2: resolve pgId collisions ─────────────────────────────────────
    // One Second Brain id must map to at most one CSAT brand. When several
    // brands claim the same pgId, an `exact` match outranks an `override`
    // (fuzzy alias) — the loser is dropped (secondBrainId stays/becomes null).
    // If the winners are still >1 (genuine duplicate brand docs, e.g.
    // "Dominos"/"Domino's"), they are all kept and reported as collisions.
    const byPgId = new Map(); // pgId -> candidates[]
    for (const c of candidates) {
      if (!byPgId.has(c.pgId)) byPgId.set(c.pgId, []);
      byPgId.get(c.pgId).push(c);
    }

    const collisions = []; // {pgId, kept:[names], dropped:[names]}
    const winners = []; // candidates that get the id
    const losers = []; // {b} overrides that lose to an exact match
    for (const [pgId, cands] of byPgId.entries()) {
      if (cands.length === 1) {
        winners.push(cands[0]);
        continue;
      }
      const exact = cands.filter(c => c.via === 'exact');
      const keep = exact.length ? exact : cands;
      const drop = exact.length ? cands.filter(c => c.via !== 'exact') : [];
      for (const c of keep) winners.push(c);
      for (const c of drop) losers.push(c);
      collisions.push({
        pgId,
        kept: keep.map(c => `${c.b.name} [${c.via}]`),
        dropped: drop.map(c => `${c.b.name} [${c.via}]`),
      });
    }

    // ── Phase 3: build set/unset ops ─────────────────────────────────────────
    const ops = [];
    for (const { b, pgId, via } of winners) {
      if (b.secondBrainId === pgId) {
        matched.push({ name: b.name, pgId, via: `${via} (unchanged)` });
        continue;
      }
      if (b.secondBrainId != null && !OVERWRITE) {
        skippedLinked.push({ name: b.name, current: b.secondBrainId, proposed: pgId });
        continue;
      }
      matched.push({ name: b.name, pgId, via });
      ops.push({
        updateOne: {
          filter: { _id: b._id },
          update: { $set: { secondBrainId: pgId } },
        },
      });
    }
    // Unset brands that lost a collision but are currently linked to that id.
    let unsets = 0;
    for (const { b, pgId } of losers) {
      if (b.secondBrainId === pgId) {
        unsets++;
        ops.push({
          updateOne: {
            filter: { _id: b._id },
            update: { $set: { secondBrainId: null } },
          },
        });
      }
    }

    // Write
    let flushed = 0;
    const total = ops.length;
    while (ops.length > 0) {
      const batch = ops.splice(0, BATCH_SIZE);
      if (!DRY_RUN) await Brand.bulkWrite(batch, { ordered: false });
      flushed += batch.length;
      console.log(`  ${DRY_RUN ? 'Previewed' : 'Wrote'} ${flushed}/${total}`);
    }

    // ── Report ────────────────────────────────────────────────────────────
    console.log('\n========================================================');
    console.log('  Summary');
    console.log('========================================================');
    console.log(`  Mongo brands:              ${brands.length}`);
    console.log(`  Matched (exact+override):  ${matched.length}`);
    console.log(`  Writes ${DRY_RUN ? 'previewed' : 'applied '}:           ${total}`);
    console.log(`  Skipped (already linked):  ${skippedLinked.length}`);
    console.log(`  Unmatched:                 ${unmatched.length}`);
    console.log(`  Override losers unset:     ${unsets}`);
    console.log(`  pgId collisions:           ${collisions.length}`);
    console.log(`  Ambiguous PG name dupes:   ${ambiguousPg.length}`);

    if (collisions.length) {
      console.log('\n  pgId collisions (multiple brands wanted same Second Brain id):');
      for (const c of collisions) {
        console.log(`    - id ${c.pgId}: kept ${c.kept.join(', ')}` +
          (c.dropped.length ? `  | dropped ${c.dropped.join(', ')}` : ''));
      }
    }

    if (ambiguousPg.length) {
      console.log('\n  Postgres names matching multiple rows (used rows[0]):');
      for (const a of ambiguousPg) {
        console.log(`    - ${a.name}  ->  ${a.rows.join(' | ')}`);
      }
    }

    if (skippedLinked.length) {
      console.log('\n  Already-linked brands skipped (set OVERWRITE=1 to relink):');
      for (const s of skippedLinked) {
        console.log(
          `    - ${s.name}  current=${s.current}  proposed=${s.proposed}`
        );
      }
    }

    if (unmatched.length) {
      console.log('\n  Unmatched brands (add to OVERRIDES if a real match exists):');
      for (const u of unmatched) {
        const sugg = u.suggestions.length
          ? `   [suggest: ${u.suggestions.join(' | ')}]`
          : '';
        console.log(`    - ${u.name}${sugg}`);
      }
    }
    console.log('========================================================\n');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
