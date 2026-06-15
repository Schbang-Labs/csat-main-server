/**
 * Cycle 1 (2026) - Verify brand→SBU mapping
 *
 * For every row in cycle1-2026-brand-sbu.md, confirms the brand is in the
 * named SBU's brands[] for that department AND brand.services[<dept>].sbuId
 * points to that SBU. Prints every mismatch. Goal: zero mismatches.
 *
 * Run: node scripts/cycle1-2026/verifySBUBrands.js
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
if (!MONGODB_URI) { console.error('❌ MONGO_URI is not defined'); process.exit(1); }

const BRAND_NAME_ALIASES = {}; // data file already uses exact prod brand names
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
async function findBrand(raw) {
  const name = BRAND_NAME_ALIASES[raw] || raw;
  return (
    (await Brand.findOne({ name })) ||
    (await Brand.findOne({ name: { $regex: new RegExp(`^${esc(name)}$`, 'i') } })) ||
    (await Brand.findOne({ slug: slugify(name) })) || null
  );
}
function parseRows() {
  const md = fs.readFileSync(path.join(__dirname, 'cycle1-2026-brand-sbu.md'), 'utf8');
  const rows = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Department')) continue;
    const c = line.split('|').map(x => x.trim()).filter(Boolean);
    if (c.length >= 3) rows.push({ brand: c[0], dept: c[1], sbu: c[2] });
  }
  return rows;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const depts = await Department.find({});
  const deptId = new Map(depts.map(d => [d.name, String(d._id)]));
  const sbus = await SBU.find({});
  const sbuMap = new Map();
  sbus.forEach(s => sbuMap.set(`${String(s.departmentId)}::${String(s.name).toLowerCase()}`, s));

  const rows = parseRows();
  let ok = 0; const mismatches = [];
  for (const r of rows) {
    const did = deptId.get(r.dept);
    const brand = await findBrand(r.brand);
    const sbu = did ? sbuMap.get(`${did}::${r.sbu.toLowerCase()}`) : null;
    if (!brand) { mismatches.push(`brand not found: ${r.brand} [${r.dept}]`); continue; }
    if (!sbu) { mismatches.push(`SBU not found: ${r.sbu} [${r.dept}]`); continue; }
    const inSbu = (sbu.brands || []).some(id => String(id) === String(brand._id));
    const svc = (brand.services || []).find(s => s.department === r.dept);
    const svcOk = svc && String(svc.sbuId || '') === String(sbu._id);
    if (inSbu && svcOk) ok++;
    else mismatches.push(`${r.brand} [${r.dept}] -> ${r.sbu}: inSBU.brands=${inSbu} services.sbuId=${svcOk}`);
  }
  console.log(`verified OK: ${ok}/${rows.length}`);
  console.log(`mismatches : ${mismatches.length}`);
  mismatches.slice(0, 50).forEach(m => console.log('  ✗ ' + m));
  console.log(mismatches.length === 0 ? '\n✅ All brand→SBU mappings correct.' : '\n⚠️  Fix mismatches above.');
  await mongoose.disconnect();
}
main().catch(e => { console.error('❌', e); process.exit(1); });
