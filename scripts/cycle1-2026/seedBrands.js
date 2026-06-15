/**
 * Cycle 7 - Seed Missing Brands & Populate Department/Service Mappings
 *
 * Reads the cycle1-2026-brands-clients.md markdown table and:
 * 1. Creates any brand that doesn't exist in DB
 * 2. Populates brand.services[] with department entries and subservice ObjectIds
 *
 * Run with: node scripts/cycle7/seedCycle7Brands.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Brand, Department, Service } from '../../src/models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * Hardcoded subservice name → ObjectId mapping.
 * These IDs come directly from the services collection in MongoDB.
 */
const SUBSERVICE_ID_MAP = {
  // SEO department subservices
  'seo': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a9'),
  'seo + content': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a9'),
  'content': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a9'),
  'backlinks': null, // no ID provided — will be skipped
  'cro / growth': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5af'),
  'cro': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5af'),
  'gmb': null, // no ID provided — will be skipped
  'geo / aio': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5ae'), // no ID provided — will be skipped

  // Martech department subservices
  'social listening': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b0'),
  'orm': null, // no ID provided — will be skipped
  'creatives / performance creatives': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b1'),
  'performance creatives': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b1'),
  'whatsapp automation': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b2'),
  'e-mail marketing': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b3'),
  'email marketing': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b3'),
  'marketing automation': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b3'),
  'zoho crm': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b7'),
  'a+ listings': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5b8'),

  // Tech department subservices
  'design': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a5'),
  'development': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a6'),
  'developement': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a6'),
  'design + developement': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a7'),
  'design + development': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5a7'),
  'tech': new mongoose.Types.ObjectId('69cf6eb7b0696c1abe8b1452'),
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

const findBrandByName = async (brandName) => {
  let brand = await Brand.findOne({ name: brandName });
  if (brand) return brand;

  brand = await Brand.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(brandName)}$`, 'i') },
  });
  if (brand) return brand;

  const slug = generateSlug(brandName);
  brand = await Brand.findOne({ slug });
  if (brand) return brand;

  return null;
};

/**
 * Resolve a service name to its ObjectId.
 * Strategy: 1) Try Service model lookup via serviceCache  2) Fallback to hardcoded ID map
 * @param {string} deptName - Department name
 * @param {string} serviceName - The service name from the markdown
 * @param {Map} serviceCache - "deptId:normalizedName" -> serviceId
 * @param {Map} deptIdMap - deptName -> deptId
 * @returns {mongoose.Types.ObjectId|null}
 */
const resolveSubserviceId = (deptName, serviceName, serviceCache, deptIdMap) => {
  const normalized = serviceName.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1) Try Service model lookup
  const deptId = deptIdMap.get(deptName);
  if (deptId) {
    const key = `${deptId}:${normalized}`;
    const fromModel = serviceCache.get(key);
    if (fromModel) return fromModel;
  }

  // 2) Fallback to hardcoded ID map
  const fromMap = SUBSERVICE_ID_MAP[normalized];
  if (fromMap !== undefined) return fromMap; // may be null if explicitly set to null

  return null;
};

/**
 * Parse markdown table and collect per-brand department/service union
 * Returns Map<brandName, { departments: Set<string>, services: Map<dept, Set<serviceName>> }>
 */
const parseBrandDataFromMarkdown = () => {
  const mdPath = path.join(__dirname, 'cycle1-2026-brands-clients.md');
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');

  const brandMap = new Map();

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Brand POC Name')) continue;

    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 5) continue;

    const brandName = cols[0].trim();
    const deptsStr = cols[3].trim();
    const svcsStr = cols[4].trim();

    if (!brandName || deptsStr === '-') continue;

    if (!brandMap.has(brandName)) {
      brandMap.set(brandName, { departments: new Set(), services: new Map() });
    }

    const brandData = brandMap.get(brandName);

    // Parse departments
    const depts = deptsStr.split(',').map(d => d.trim()).filter(Boolean);
    depts.forEach(d => brandData.departments.add(d));

    // Parse services: format is "dept: svc1, svc2; dept2: svc3"
    if (svcsStr && svcsStr !== '-') {
      const svcGroups = svcsStr.split(';').map(s => s.trim()).filter(Boolean);
      for (const group of svcGroups) {
        const colonIdx = group.indexOf(':');
        if (colonIdx === -1) continue;
        const dept = group.substring(0, colonIdx).trim();
        const svcNames = group.substring(colonIdx + 1).split(',').map(s => s.trim()).filter(Boolean);

        if (!brandData.services.has(dept)) {
          brandData.services.set(dept, new Set());
        }
        svcNames.forEach(s => brandData.services.get(dept).add(s));
      }
    }
  }

  return brandMap;
};

async function seedCycle7Brands() {
  console.log('═'.repeat(60));
  console.log('  Cycle 7 - Seed Brands & Department/Service Mappings');
  console.log('═'.repeat(60));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Build department ID lookup (still needed for validation)
    const allDepts = await Department.find({ isActive: true });
    const deptIdMap = new Map();
    for (const dept of allDepts) {
      deptIdMap.set(dept.name, dept._id);
    }
    console.log(`📋 Loaded ${deptIdMap.size} departments: ${[...deptIdMap.keys()].join(', ')}\n`);

    // Build service cache: "deptId:normalizedName" -> serviceId
    const allServices = await Service.find({ isActive: true });
    const serviceCache = new Map();
    for (const svc of allServices) {
      const key = `${svc.departmentId}:${svc.normalizedName}`;
      serviceCache.set(key, svc._id);
    }
    console.log(`📋 Loaded ${serviceCache.size} services\n`);

    const brandMap = parseBrandDataFromMarkdown();
    console.log(`📋 Found ${brandMap.size} unique brands in markdown\n`);

    let existing = 0;
    let created = 0;
    let servicesUpdated = 0;
    let errors = 0;
    const createdBrands = [];
    const errorBrands = [];

    for (const [brandName, brandData] of brandMap) {
      try {
        let brand = await findBrandByName(brandName);
        let isNew = false;

        if (!brand) {
          // Create brand
          const slug = generateSlug(brandName);
          const slugExists = await Brand.findOne({ slug });
          if (slugExists) {
            console.log(`   ⚠️  SLUG CONFLICT: "${brandName}" → slug "${slug}" already used by "${slugExists.name}"`);
            errorBrands.push({ name: brandName, reason: `slug conflict` });
            errors++;
            continue;
          }

          brand = new Brand({
            name: brandName,
            slug,
            services: [],
            isActive: true,
          });
          await brand.save();
          console.log(`   📦 CREATED: "${brandName}" (${brand._id})`);
          createdBrands.push(brandName);
          created++;
          isNew = true;
        } else {
          console.log(`   ✅ EXISTS: "${brandName}" (${brand._id}, DB: "${brand.name}")`);
          existing++;
        }

        // Update services array with departments and subservices
        let modified = false;
        for (const dept of brandData.departments) {
          const existingEntry = brand.services.find(s => s.department === dept);

          // Resolve subservice ObjectIds for this department
          const subserviceIds = [];
          if (brandData.services.has(dept)) {
            for (const svcName of brandData.services.get(dept)) {
              const svcId = resolveSubserviceId(dept, svcName, serviceCache, deptIdMap);
              if (svcId) {
                subserviceIds.push(svcId);
              } else {
                console.log(`      ⚠️  Service not found in ID map: "${svcName}" in dept "${dept}"`);
              }
            }
          }

          if (existingEntry) {
            // Merge subservices into existing entry
            let mergedAny = false;
            for (const svcId of subserviceIds) {
              const alreadyHas = existingEntry.subservices.some(
                id => String(id) === String(svcId)
              );
              if (!alreadyHas) {
                existingEntry.subservices.push(svcId);
                mergedAny = true;
              }
            }
            if (mergedAny) modified = true;
          } else {
            // Add new department entry
            brand.services.push({
              department: dept,
              sbuId: null,
              subservices: subserviceIds,
              isActive: true,
              startDate: new Date(),
            });
            modified = true;
          }
        }

        if (modified) {
          await brand.save();
          const deptList = [...brandData.departments].join(', ');
          console.log(`      🔄 Updated services: [${deptList}]`);
          servicesUpdated++;
        }
      } catch (err) {
        console.error(`   ❌ ERROR: "${brandName}" - ${err.message}`);
        errorBrands.push({ name: brandName, reason: err.message });
        errors++;
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('  Summary');
    console.log('═'.repeat(60));
    console.log(`   Total unique brands:    ${brandMap.size}`);
    console.log(`   Already existed:        ${existing}`);
    console.log(`   Newly created:          ${created}`);
    console.log(`   Services updated:       ${servicesUpdated}`);
    console.log(`   Errors:                 ${errors}`);

    if (createdBrands.length > 0) {
      console.log(`\n   📦 Created brands:`);
      createdBrands.forEach(b => console.log(`      - ${b}`));
    }

    if (errorBrands.length > 0) {
      console.log(`\n   ❌ Error brands:`);
      errorBrands.forEach(b => console.log(`      - ${b.name}: ${b.reason}`));
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Brand seeding completed!');
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

seedCycle7Brands();
