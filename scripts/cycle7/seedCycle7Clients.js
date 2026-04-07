/**
 * Cycle 7 - Seed Missing Clients & Populate Service Mappings
 *
 * Reads the cycle7-brands-clients.md markdown table and for each row:
 * 1. Finds the brand by name
 * 2. Checks if a client exists by phone number
 * 3. If client exists, verifies brandId and merges serviceMapping
 * 4. If client doesn't exist, creates it with correct brandId and serviceMapping
 *
 * IMPORTANT: Run seedCycle7Brands.js FIRST to ensure all brands exist.
 *
 * Run with: node scripts/cycle7/seedCycle7Clients.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Brand, Client, Department, Service } from '../../src/models/index.js';

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
  'geo / aio': new mongoose.Types.ObjectId('69c38d8cf826eaa47348b5ae'),

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
  if (fromMap !== undefined) return fromMap;

  return null;
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

const normalizePhone = (phone) => {
  if (!phone) return null;
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 10) return digitsOnly || null;
  return digitsOnly.slice(-10);
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
 * Parse markdown table and return all rows with department/service info
 */
const parseClientsFromMarkdown = () => {
  const mdPath = path.join(__dirname, 'cycle7-brands-clients.md');
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');

  const clients = [];

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Brand POC Name')) continue;

    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 5) continue;

    const brandName = cols[0].trim();
    const pocName = cols[1].trim();
    const phone = cols[2].trim();
    const deptsStr = cols[3].trim();
    const svcsStr = cols[4].trim();

    if (!brandName || !pocName || !phone) continue;

    // Parse departments
    const departments = deptsStr !== '-'
      ? deptsStr.split(',').map(d => d.trim()).filter(Boolean)
      : [];

    // Parse services: "dept: svc1, svc2; dept2: svc3"
    const services = new Map();
    if (svcsStr && svcsStr !== '-') {
      const svcGroups = svcsStr.split(';').map(s => s.trim()).filter(Boolean);
      for (const group of svcGroups) {
        const colonIdx = group.indexOf(':');
        if (colonIdx === -1) continue;
        const dept = group.substring(0, colonIdx).trim();
        const svcNames = group.substring(colonIdx + 1).split(',').map(s => s.trim()).filter(Boolean);
        services.set(dept, svcNames);
      }
    }

    clients.push({ brandName, pocName, phone, departments, services });
  }

  return clients;
};

async function seedCycle7Clients() {
  console.log('═'.repeat(60));
  console.log('  Cycle 7 - Seed Clients & Service Mappings');
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
    console.log(`📋 Loaded ${deptIdMap.size} departments\n`);

    // Build service cache: "deptId:normalizedName" -> serviceId
    const allServices = await Service.find({ isActive: true });
    const serviceCache = new Map();
    for (const svc of allServices) {
      const key = `${svc.departmentId}:${svc.normalizedName}`;
      serviceCache.set(key, svc._id);
    }
    console.log(`📋 Loaded ${serviceCache.size} services\n`);

    const clientRows = parseClientsFromMarkdown();
    console.log(`📋 Found ${clientRows.length} client rows in markdown\n`);

    let existingCorrect = 0;
    let existingFixed = 0;
    let serviceMappingUpdated = 0;
    let created = 0;
    let skipped = 0;
    let errors = 0;
    const createdClients = [];
    const fixedClients = [];
    const errorClients = [];

    // Cache brand lookups
    const brandCache = new Map();

    for (const row of clientRows) {
      const { brandName, pocName, phone, departments, services } = row;

      try {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone || normalizedPhone.length < 7) {
          console.log(`   ⏭️  SKIP: "${pocName}" (${brandName}) - invalid phone "${phone}"`);
          skipped++;
          continue;
        }

        // Find brand (with cache)
        let brand;
        if (brandCache.has(brandName)) {
          brand = brandCache.get(brandName);
        } else {
          brand = await findBrandByName(brandName);
          brandCache.set(brandName, brand);
        }

        if (!brand) {
          console.log(`   ❌ BRAND NOT FOUND: "${brandName}" - cannot process "${pocName}"`);
          errorClients.push({ pocName, brandName, phone, reason: 'brand not found' });
          errors++;
          continue;
        }

        // Build serviceMapping from this row's departments/services
        const serviceMapping = [];
        for (const dept of departments) {
          const subserviceIds = [];
          if (services.has(dept)) {
            for (const svcName of services.get(dept)) {
              const svcId = resolveSubserviceId(dept, svcName, serviceCache, deptIdMap);
              if (svcId) {
                subserviceIds.push(svcId);
              }
            }
          }
          serviceMapping.push({
            department: dept,
            subservices: subserviceIds,
            isActive: true,
          });
        }

        // Find client by phone
        let client = await Client.findOne({
          phone: { $regex: normalizedPhone },
        });

        if (client) {
          let modified = false;

          // Check brandId
          if (String(client.brandId) !== String(brand._id)) {
            const oldBrandId = client.brandId;
            client.brandId = brand._id;
            modified = true;
            console.log(`   🔧 FIXED brandId: "${pocName}" (${normalizedPhone}) → was ${oldBrandId}, now ${brand._id}`);
            fixedClients.push({ pocName, brandName, phone: normalizedPhone });
            existingFixed++;
          } else {
            existingCorrect++;
          }

          // Merge serviceMapping
          for (const newMapping of serviceMapping) {
            const existingMapping = client.serviceMapping.find(
              m => m.department === newMapping.department
            );

            if (existingMapping) {
              // Merge subservices
              for (const svcId of newMapping.subservices) {
                const alreadyHas = existingMapping.subservices.some(
                  id => String(id) === String(svcId)
                );
                if (!alreadyHas) {
                  existingMapping.subservices.push(svcId);
                  modified = true;
                }
              }
            } else {
              // Add new department entry
              client.serviceMapping.push(newMapping);
              modified = true;
            }
          }

          if (modified) {
            await client.save();
            if (serviceMapping.length > 0) {
              const deptList = serviceMapping.map(m => m.department).join(', ');
              console.log(`      🔄 Updated serviceMapping: [${deptList}] for "${pocName}"`);
              serviceMappingUpdated++;
            }
          } else {
            console.log(`   ✅ EXISTS: "${pocName}" (${normalizedPhone}) → "${brandName}" ✓`);
          }
        } else {
          // Create new client
          const newClient = new Client({
            brandId: brand._id,
            name: pocName,
            phone: normalizedPhone,
            serviceMapping,
            isActive: true,
          });
          await newClient.save();

          const deptList = serviceMapping.map(m => m.department).join(', ') || 'none';
          console.log(`   📦 CREATED: "${pocName}" (${normalizedPhone}) → "${brandName}" [${deptList}]`);
          createdClients.push({ pocName, brandName, phone: normalizedPhone });
          created++;
        }
      } catch (err) {
        if (err.code === 11000) {
          console.log(`   ⚠️  DUPLICATE: "${pocName}" (${phone}) - already exists`);
          existingCorrect++;
        } else {
          console.error(`   ❌ ERROR: "${pocName}" (${brandName}, ${phone}) - ${err.message}`);
          errorClients.push({ pocName, brandName, phone, reason: err.message });
          errors++;
        }
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('  Summary');
    console.log('═'.repeat(60));
    console.log(`   Total rows:              ${clientRows.length}`);
    console.log(`   Already correct:         ${existingCorrect}`);
    console.log(`   BrandId fixed:           ${existingFixed}`);
    console.log(`   ServiceMapping updated:  ${serviceMappingUpdated}`);
    console.log(`   Newly created:           ${created}`);
    console.log(`   Skipped (invalid phone): ${skipped}`);
    console.log(`   Errors:                  ${errors}`);

    if (createdClients.length > 0) {
      console.log(`\n   📦 Created clients:`);
      createdClients.forEach(c => console.log(`      - ${c.pocName} (${c.phone}) → ${c.brandName}`));
    }

    if (fixedClients.length > 0) {
      console.log(`\n   🔧 Fixed brandId:`);
      fixedClients.forEach(c => console.log(`      - ${c.pocName} (${c.phone}) → ${c.brandName}`));
    }

    if (errorClients.length > 0) {
      console.log(`\n   ❌ Errors:`);
      errorClients.forEach(c => console.log(`      - ${c.pocName} (${c.brandName}, ${c.phone}) - ${c.reason}`));
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Client seeding completed!');
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

seedCycle7Clients();
