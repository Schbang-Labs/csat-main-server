/**
 * Cycle 1 (2026) - Sync Brand.isActive from the roster
 *
 * The Cycle 1 (26-27) sheet is the COMPLETE active roster. This marks every
 * brand present in cycle1-2026-brands-clients.md as active, and every other
 * brand inactive. Brand matching mirrors seedBrands (name / case-insensitive /
 * slug), so the exact brands seeded are the ones kept active.
 *
 * Preview:  DRY_RUN=1 node scripts/cycle1-2026/syncBrandIsActive.js
 * Apply:            node scripts/cycle1-2026/syncBrandIsActive.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Brand } from '../../src/models/index.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONGODB_URI = process.env.MONGO_URI;
const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
if (!MONGODB_URI) { console.error('❌ MONGO_URI is not defined'); process.exit(1); }

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
async function findBrand(name) {
  return (
    (await Brand.findOne({ name })) ||
    (await Brand.findOne({ name: { $regex: new RegExp(`^${esc(name)}$`, 'i') } })) ||
    (await Brand.findOne({ slug: slugify(name) })) || null
  );
}
function rosterBrandNames() {
  const md = fs.readFileSync(path.join(__dirname, 'cycle1-2026-brands-clients.md'), 'utf8');
  const set = new Set();
  for (const line of md.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Brand POC Name')) continue;
    const c = line.split('|').map(x => x.trim()).filter(Boolean);
    if (c.length >= 1 && c[0]) set.add(c[0]);
  }
  return [...set];
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Cycle 1 (2026) - Sync Brand.isActive' + (DRY_RUN ? '  [DRY RUN]' : ''));
  console.log('═'.repeat(60));
  await mongoose.connect(MONGODB_URI);

  const names = rosterBrandNames();
  const activeIds = new Set();
  const notFound = [];
  for (const n of names) { const b = await findBrand(n); if (b) activeIds.add(String(b._id)); else notFound.push(n); }
  console.log(`📋 Roster brands: ${names.length}  → matched in DB: ${activeIds.size}  notFound: ${notFound.length}`);

  const brands = await Brand.find({}, { _id: 1, name: 1, isActive: 1 }).lean();
  let activate = 0, deactivate = 0, keptActive = 0, keptInactive = 0;
  const ops = [];
  for (const b of brands) {
    const should = activeIds.has(String(b._id));
    const cur = b.isActive !== false;
    if (should === cur) { cur ? keptActive++ : keptInactive++; continue; }
    should ? activate++ : deactivate++;
    ops.push({ updateOne: { filter: { _id: b._id }, update: { $set: { isActive: should } } } });
  }
  if (!DRY_RUN && ops.length) {
    for (let i = 0; i < ops.length; i += 500) await Brand.bulkWrite(ops.slice(i, i + 500), { ordered: false });
  }
  console.log('─'.repeat(60));
  console.log(`   Total brands in DB:    ${brands.length}`);
  console.log(`   Will ACTIVATE:         ${activate}`);
  console.log(`   Will DEACTIVATE:       ${deactivate}`);
  console.log(`   Kept active:           ${keptActive}`);
  console.log(`   Kept inactive:         ${keptInactive}`);
  console.log(`   Active AFTER:          ${keptActive + activate}  (target ≈ roster brands matched)`);
  if (notFound.length) console.log(`   ⚠️  roster brands not found in DB: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? ' …' : ''}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'APPLIED'}`);
  console.log('─'.repeat(60));
  await mongoose.disconnect();
}
main().catch(e => { console.error('❌', e); process.exit(1); });
