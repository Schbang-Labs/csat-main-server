/**
 * Cycle 1 (2026) - Assign brands to SBUs (mapping-driven)
 *
 * Reads cycle1-2026-brand-sbu.md rows: "| Brand | Department | SBU |"
 * For each row:
 *   1. find the brand (name / case-insensitive / slug, with aliases)
 *   2. find the SBU by exact name WITHIN that department
 *   3. add brand._id to SBU.brands[]  ($addToSet)
 *   4. set brand.services[<dept>].sbuId = sbu._id
 *
 * The webhook matches SBU via SBU.brands[] first, then brand.services[].sbuId,
 * so we set both. Run seedBrands.js + seedClients.js FIRST.
 *
 * Preview:  DRY_RUN=1 node scripts/cycle1-2026/assignBrandsToSBU.js
 * Apply:            node scripts/cycle1-2026/assignBrandsToSBU.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Brand, SBU, Department } from '../../src/models/index.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONGODB_URI = process.env.MONGO_URI;
const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

// The data file (cycle1-2026-brand-sbu.md) already uses exact production brand
// names (the 7 aliases were applied during generation), so no aliasing here.
const BRAND_NAME_ALIASES = {};

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function findBrand(raw) {
  const name = BRAND_NAME_ALIASES[raw] || raw;
  return (
    (await Brand.findOne({ name })) ||
    (await Brand.findOne({ name: { $regex: new RegExp(`^${esc(name)}$`, 'i') } })) ||
    (await Brand.findOne({ slug: slugify(name) })) ||
    null
  );
}

function parseRows() {
  const md = fs.readFileSync(path.join(__dirname, 'cycle1-2026-brand-sbu.md'), 'utf8');
  const rows = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Department')) continue;
    const c = line.split('|').map(x => x.trim()).filter(Boolean);
    if (c.length < 3) continue;
    rows.push({ brand: c[0], dept: c[1], sbu: c[2] });
  }
  return rows;
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Cycle 1 (2026) - Assign Brands to SBUs' + (DRY_RUN ? '  [DRY RUN]' : ''));
  console.log('═'.repeat(60));
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const depts = await Department.find({});
  const deptId = new Map(depts.map(d => [d.name, String(d._id)]));
  const sbus = await SBU.find({});
  const sbuMap = new Map(); // `${deptId}::${nameLower}` -> sbu doc
  sbus.forEach(s => sbuMap.set(`${String(s.departmentId)}::${String(s.name).toLowerCase()}`, s));

  const rows = parseRows();
  console.log(`📋 Parsed ${rows.length} brand→SBU rows\n`);

  let addedToSbu = 0, svcSet = 0, alreadyOk = 0, brandNF = 0, sbuNF = 0;
  const issues = [];

  for (const r of rows) {
    const did = deptId.get(r.dept);
    if (!did) { issues.push(`dept not found: ${r.dept}`); continue; }
    const brand = await findBrand(r.brand);
    if (!brand) { brandNF++; issues.push(`BRAND NOT FOUND: "${r.brand}" [${r.dept}]`); continue; }
    const sbu = sbuMap.get(`${did}::${r.sbu.toLowerCase()}`);
    if (!sbu) { sbuNF++; issues.push(`SBU NOT FOUND: "${r.sbu}" [${r.dept}] for "${r.brand}"`); continue; }

    const inSbu = (sbu.brands || []).some(id => String(id) === String(brand._id));
    const svc = (brand.services || []).find(s => s.department === r.dept);
    if (!svc) issues.push(`no service entry for dept "${r.dept}" on brand "${r.brand}" (run seedBrands first)`);
    const svcNeedsSet = svc && String(svc.sbuId || '') !== String(sbu._id);

    if (inSbu && !svcNeedsSet) { alreadyOk++; continue; }
    if (DRY_RUN) { if (!inSbu) addedToSbu++; if (svcNeedsSet) svcSet++; continue; }

    if (!inSbu) { await SBU.updateOne({ _id: sbu._id }, { $addToSet: { brands: brand._id } }); addedToSbu++; }
    if (svcNeedsSet) { svc.sbuId = sbu._id; await brand.save(); svcSet++; }
  }

  console.log('─'.repeat(60));
  console.log(`   Added to SBU.brands[]:        ${addedToSbu}`);
  console.log(`   brand.services[].sbuId set:   ${svcSet}`);
  console.log(`   Already correct:              ${alreadyOk}`);
  console.log(`   Brand not found:              ${brandNF}`);
  console.log(`   SBU not found:                ${sbuNF}`);
  if (issues.length) {
    console.log(`\n   ⚠️  Issues (${issues.length}):`);
    issues.slice(0, 50).forEach(i => console.log('      - ' + i));
  }
  console.log('─'.repeat(60));
  await mongoose.disconnect();
  console.log('👋 Disconnected');
}

main().catch(e => { console.error('❌', e); process.exit(1); });
