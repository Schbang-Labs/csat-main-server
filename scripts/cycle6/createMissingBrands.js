/**
 * Create Missing Brands and Update Clients/SBUs Script
 * 
 * This script:
 * 1. Creates 6 new brands: Aster, Exotica, McCain Retail, Prakriti, Pure Glow, TCP
 * 2. Updates/creates clients with the correct brandId
 * 3. Updates SBU brands arrays to include new brand IDs
 * 4. Updates brand.services with correct sbuId
 * 
 * Brand-SBU Mapping:
 * - Aster -> SBU Sumesh (Bangalore) [solutions]
 * - Exotica -> SBU Samarth (Next Wave) [solutions]
 * - McCain Retail -> SBU Shreya (For the Craft) [solutions] + Carolyn Fernandes [martech]
 * - Prakriti -> SBU Shreya (For the Craft) [solutions]
 * - Pure Glow -> SBU Samarth (Next Wave) [solutions]
 * - TCP (Tata Consumer Products) -> SBU Shreya (For the Craft) [solutions]
 * 
 * Run: node scripts/cycle6/createMissingBrands.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import Brand from '../../src/models/brand.model.js';
import Client from '../../src/models/client.model.js';
import SBU from '../../src/models/sbu.model.js';
import Department from '../../src/models/department.model.js';

/**
 * Brand configurations with SBU and department mappings
 */
const BRANDS_TO_CREATE = [
  {
    name: 'Aster',
    slug: 'aster',
    sbuLeadName: 'Sumesh',
    departments: ['solutions'],
    pocs: [
      { name: 'Shaheen', phone: '9945542392' }
    ]
  },
  {
    name: 'Exotica',
    slug: 'exotica',
    sbuLeadName: 'Samarth',
    departments: ['solutions'],
    pocs: [
      { name: 'Vijay Gupta', phone: '9819945331' }
    ]
  },
  {
    name: 'McCain Retail',
    slug: 'mccain-retail',
    sbuLeadName: 'Shreya', // For solutions
    martechSbuName: 'SBU Carolyn Fernandes', // For martech
    departments: ['solutions', 'martech'],
    pocs: [
      { name: 'Sumati Kapoor', phone: '9953526233' }
    ]
  },
  {
    name: 'Prakriti',
    slug: 'prakriti',
    sbuLeadName: 'Shreya',
    departments: ['solutions'],
    pocs: [
      { name: 'Tanya', phone: '8178388440' }
    ]
  },
  {
    name: 'Pure Glow',
    slug: 'pure-glow',
    sbuLeadName: 'Samarth',
    departments: ['solutions'],
    pocs: [
      { name: 'Vijay Gupta', phone: '9819945331' }
    ]
  },
  {
    name: 'TCP (Tata Consumer Products)',
    slug: 'tcp-tata-consumer-products',
    sbuLeadName: 'Shreya',
    departments: ['solutions'],
    pocs: [
      { name: 'Bob', phone: '7506366446' }
    ]
  }
];

/**
 * Find SBU by lead name and department
 */
const findSBUByLeadName = async (leadName, departmentId) => {
  // Try to find SBU where leadNames array contains the lead name
  const sbu = await SBU.findOne({
    departmentId,
    $or: [
      { leadNames: { $regex: new RegExp(leadName, 'i') } },
      { executiveVP: { $regex: new RegExp(leadName, 'i') } }
    ],
    isActive: true
  });
  return sbu;
};

/**
 * Normalize phone number
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/[^0-9]/g, '').slice(-10);
};

/**
 * Main function
 */
const main = async () => {
  console.log('🚀 Create Missing Brands and Update Clients/SBUs Script');
  console.log('=========================================================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Solutions department
    const solutionsDept = await Department.findOne({ name: 'solutions' });
    if (!solutionsDept) {
      console.log('❌ Solutions department not found!');
      return;
    }
    console.log(`📂 Found Solutions department: ${solutionsDept._id}\n`);

    // Get MarTech department
    const martechDept = await Department.findOne({ name: 'martech' });
    if (!martechDept) {
      console.log('⚠️  MarTech department not found!');
    } else {
      console.log(`📂 Found MarTech department: ${martechDept._id}\n`);
    }

    const createdBrands = [];
    const updatedClients = [];
    const createdClients = [];
    const updatedSBUs = [];

    for (const brandConfig of BRANDS_TO_CREATE) {
      console.log(`\n📦 Processing brand: ${brandConfig.name}`);
      console.log('─'.repeat(50));

      // 1. Check if brand already exists
      let brand = await Brand.findOne({
        $or: [
          { name: brandConfig.name },
          { slug: brandConfig.slug }
        ]
      });

      if (brand) {
        console.log(`  ⚠️  Brand already exists: ${brand.name} (${brand._id})`);
      } else {
        // 2. Find SBU for solutions department
        const solutionsSBU = await findSBUByLeadName(brandConfig.sbuLeadName, solutionsDept._id);

        if (!solutionsSBU) {
          console.log(`  ❌ SBU not found for lead: ${brandConfig.sbuLeadName}`);
          continue;
        }
        console.log(`  ✅ Found Solutions SBU: ${solutionsSBU.name} (${solutionsSBU._id})`);

        // Build services array
        const services = [{
          department: 'solutions',
          sbuId: solutionsSBU._id,
          isActive: true,
          startDate: new Date()
        }];

        // Add martech service if applicable
        if (brandConfig.departments.includes('martech') && martechDept) {
          let martechSBU;
          if (brandConfig.martechSbuName) {
            martechSBU = await SBU.findOne({
              name: brandConfig.martechSbuName,
              departmentId: martechDept._id,
              isActive: true
            });
          }
          if (martechSBU) {
            console.log(`  ✅ Found MarTech SBU: ${martechSBU.name} (${martechSBU._id})`);
            services.push({
              department: 'martech',
              sbuId: martechSBU._id,
              isActive: true,
              startDate: new Date()
            });
          }
        }

        // 3. Create the brand
        brand = new Brand({
          name: brandConfig.name,
          slug: brandConfig.slug,
          services,
          isActive: true
        });

        await brand.save();
        createdBrands.push(brand);
        console.log(`  ✨ Created brand: ${brand.name} (${brand._id})`);

        // 4. Update SBU brands array
        if (!solutionsSBU.brands.includes(brand._id)) {
          solutionsSBU.brands.push(brand._id);
          await solutionsSBU.save();
          updatedSBUs.push({ sbuName: solutionsSBU.name, brandName: brand.name });
          console.log(`  📝 Added brand to SBU: ${solutionsSBU.name}`);
        }
      }

      // 5. Process POCs/Clients
      for (const poc of brandConfig.pocs) {
        const normalizedPhone = normalizePhone(poc.phone);

        if (!normalizedPhone) {
          console.log(`  ⚠️  Skipping POC with invalid phone: ${poc.name}`);
          continue;
        }

        // Check if client exists by phone
        let client = await Client.findOne({
          phone: { $regex: normalizedPhone }
        });

        if (client) {
          // Client exists - check if brandId needs update
          if (!client.brandId || !client.brandId.equals(brand._id)) {
            const oldBrandId = client.brandId;
            client.brandId = brand._id;
            client.name = poc.name;

            // Ensure serviceMapping has solutions
            const hasService = client.serviceMapping?.some(s => s.department === 'solutions');
            if (!hasService) {
              client.serviceMapping = client.serviceMapping || [];
              client.serviceMapping.push({
                department: 'solutions',
                isActive: true
              });
            }

            await client.save();
            updatedClients.push({
              name: poc.name,
              phone: normalizedPhone,
              brandName: brand.name,
              oldBrandId
            });
            console.log(`  📝 Updated client brandId: ${poc.name} (${normalizedPhone})`);
          } else {
            console.log(`  ✔️  Client already linked: ${poc.name} (${normalizedPhone})`);
          }
        } else {
          // Client doesn't exist - create new
          client = new Client({
            brandId: brand._id,
            name: poc.name,
            phone: normalizedPhone,
            serviceMapping: brandConfig.departments.map(dept => ({
              department: dept,
              isActive: true
            })),
            isActive: true
          });

          await client.save();
          createdClients.push({
            name: poc.name,
            phone: normalizedPhone,
            brandName: brand.name
          });
          console.log(`  ✨ Created client: ${poc.name} (${normalizedPhone})`);
        }
      }
    }

    // Summary Report
    console.log('\n=========================================================');
    console.log('📋 SUMMARY REPORT');
    console.log('=========================================================\n');

    if (createdBrands.length > 0) {
      console.log('✨ CREATED BRANDS:');
      createdBrands.forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.name} (${b._id})`);
      });
      console.log();
    }

    if (createdClients.length > 0) {
      console.log('✨ CREATED CLIENTS:');
      createdClients.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name} (${c.phone}) -> ${c.brandName}`);
      });
      console.log();
    }

    if (updatedClients.length > 0) {
      console.log('📝 UPDATED CLIENTS (brandId changed):');
      updatedClients.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name} (${c.phone}) -> ${c.brandName}`);
      });
      console.log();
    }

    if (updatedSBUs.length > 0) {
      console.log('📝 UPDATED SBUs (brands array):');
      updatedSBUs.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.sbuName} <- ${s.brandName}`);
      });
      console.log();
    }

    console.log('📊 TOTALS:');
    console.log(`  Brands created: ${createdBrands.length}`);
    console.log(`  Clients created: ${createdClients.length}`);
    console.log(`  Clients updated: ${updatedClients.length}`);
    console.log(`  SBUs updated: ${updatedSBUs.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

main();
