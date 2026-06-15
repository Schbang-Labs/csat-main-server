/**
 * Cycle 1 (2026) - Sync Client.isActive from the roster (phone-based)
 *
 * The Cycle 1 (26-27) sheet is the COMPLETE active roster. This marks every
 * client whose phone is in cycle1-2026-brands-clients.md as active, and every
 * other client inactive — so dashboard fill-rates reflect only this cycle's POCs.
 *
 * Matching is by phone (last 10 digits) — the same key the webhook uses — which
 * is far more reliable than name matching. Only the Client.isActive flag changes.
 *
 * Preview:  DRY_RUN=1 node scripts/cycle1-2026/syncClientIsActive.js
 * Apply:            node scripts/cycle1-2026/syncClientIsActive.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '../../src/models/index.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONGODB_URI = process.env.MONGO_URI;
const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
if (!MONGODB_URI) { console.error('❌ MONGO_URI is not defined'); process.exit(1); }

const last10 = p => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : d; };

function activePhones() {
  const md = fs.readFileSync(path.join(__dirname, 'cycle1-2026-brands-clients.md'), 'utf8');
  const set = new Set();
  for (const line of md.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Brand POC Name')) continue;
    const c = line.split('|').map(x => x.trim()).filter(Boolean);
    if (c.length >= 3) { const p = last10(c[2]); if (p) set.add(p); }
  }
  return set;
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Cycle 1 (2026) - Sync Client.isActive' + (DRY_RUN ? '  [DRY RUN]' : ''));
  console.log('═'.repeat(60));
  const phones = activePhones();
  console.log(`📋 Active phones in roster: ${phones.size}`);
  await mongoose.connect(MONGODB_URI);

  const clients = await Client.find({}, { _id: 1, phone: 1, isActive: 1 }).lean();
  let activate = 0, deactivate = 0, keptActive = 0, keptInactive = 0;
  const ops = [];
  for (const c of clients) {
    const should = phones.has(last10(c.phone));
    const cur = c.isActive !== false;
    if (should === cur) { cur ? keptActive++ : keptInactive++; continue; }
    should ? activate++ : deactivate++;
    ops.push({ updateOne: { filter: { _id: c._id }, update: { $set: { isActive: should } } } });
  }
  if (!DRY_RUN && ops.length) {
    for (let i = 0; i < ops.length; i += 500) await Client.bulkWrite(ops.slice(i, i + 500), { ordered: false });
  }
  console.log('─'.repeat(60));
  console.log(`   Total clients in DB:   ${clients.length}`);
  console.log(`   Will ACTIVATE:         ${activate}`);
  console.log(`   Will DEACTIVATE:       ${deactivate}`);
  console.log(`   Kept active:           ${keptActive}`);
  console.log(`   Kept inactive:         ${keptInactive}`);
  console.log(`   Active AFTER:          ${keptActive + activate}  (target ≈ roster phones)`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'APPLIED'}`);
  console.log('─'.repeat(60));
  await mongoose.disconnect();
}
main().catch(e => { console.error('❌', e); process.exit(1); });
