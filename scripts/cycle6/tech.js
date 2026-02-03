/**
 * Seed Script - Brands & Clients with SBU Mappings (Cycle 6 - Tech)
 * 
 * LOGIC FLOW:
 * 1. BRANDS:
 *    - Check if brand exists (by name, alias, or slug)
 *    - If EXISTS → UPDATE: Add/update 'tech' service in services array
 *    - If NOT EXISTS → CREATE: New brand with 'tech' service
 *    - Assign to correct SBU based on SBU Lead mapping
 * 
 * 2. CLIENTS (POCs):
 *    - Check if client exists (by brandId + phone)
 *    - If EXISTS → UPDATE: Merge 'tech' into serviceMapping, update name
 *    - If NOT EXISTS → CREATE: New client with serviceMapping from brand
 * 
 * 3. SBU:
 *    - Add processed brand IDs to respective SBU's brands array
 *    - Merge with existing brands (no duplicates)
 * 
 * SBU Lead to SBU ID Mapping:
 * - Akshay Chatlani → 697094a94a30795777e84b48
 * - Carolyn Fernandes → 697094d7818800e6498d1682
 * - Melissa Thomas → 697094d7818800e6498d1684
 * 
 * Run with: node scripts/cycle6/tech.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SBU, Brand, Client, Department } from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

/**
 * SBU Lead to SBU ObjectId Mapping
 */
const SBU_LEAD_TO_ID = {
    'Akshay Chatlani': '697094a94a30795777e84b48',
    'Carolyn Fernandes': '697094d7818800e6498d1682',
    'Melissa Thomas': '697094d7818800e6498d1684',
};

/**
 * Brand Data with POC Information - Cycle 6 Tech
 * Each brand has an sbuLead property to map to the correct SBU
 */
const TECH_BRAND_DATA = [
    {
        name: 'Bridgestone',
        sbuLead: 'Akshay Chatlani',
        pocs: [
            { name: 'Sumedha Sharma', phone: '9953251989' },
            { name: 'Paritosh Koppikar', phone: '9967002720' },
        ],
    },
    {
        name: 'DHP Heavy',
        sbuLead: 'Akshay Chatlani',
        pocs: [{ name: 'Bhavesh Goel', phone: '8879694015' }],
    },
    {
        name: 'Britannia Corporate',
        sbuLead: 'Akshay Chatlani',
        pocs: [{ name: 'Prabakaran K', phone: '9986416717' }],
    },
    {
        name: 'Sriram Life Insurance',
        sbuLead: 'Akshay Chatlani',
        pocs: [
            { name: 'Rahul Adaniya', phone: '9930577107' },
            { name: 'Sravan Kumar', phone: '9704191860' },
        ],
    },
    {
        name: 'Birla Opus',
        sbuLead: 'Carolyn Fernandes',
        pocs: [{ name: 'Aastha Narula', phone: '9999513285' }],
    },
    {
        name: 'HCCB',
        sbuLead: 'Carolyn Fernandes',
        pocs: [{ name: 'Chiththarthann', phone: '8012047626' }],
    },
    {
        name: 'Jindal Steel',
        sbuLead: 'Carolyn Fernandes',
        pocs: [{ name: 'Isha Sahni', phone: '9599698449' }],
    },
    {
        name: 'Pot & Bloom',
        sbuLead: 'Carolyn Fernandes',
        pocs: [
            { name: 'Harpreet Kaur', phone: '9008325588' },
            { name: 'Anand T R', phone: '9740455788' },
        ],
    },
    {
        name: 'Bodycraft',
        sbuLead: 'Carolyn Fernandes',
        pocs: [{ name: 'Roshni Khatri', phone: '9884076488' }],
    },
    {
        name: 'Ring (NZ)',
        sbuLead: 'Carolyn Fernandes',
        pocs: [
            { name: 'Varun Khanna', phone: '+61432089955' },
            { name: 'Corrine Cheng', phone: '+61405236602' },
        ],
    },
    {
        name: 'NRB bearings',
        sbuLead: 'Carolyn Fernandes',
        pocs: [
            { name: 'Kanishk Kansal', phone: '7045754285' },
            { name: 'Yohan Baria', phone: '971509700525' },
        ],
    },
    {
        name: 'Brookfield',
        sbuLead: 'Melissa Thomas',
        pocs: [
            { name: 'Salil Phatak', phone: '7709403778' },
            { name: 'Karthik Pillai', phone: '9833993177' },
        ],
    },
    {
        name: 'Himatsingka',
        sbuLead: 'Melissa Thomas',
        pocs: [
            { name: 'Rohith Narayan', phone: '7760972675' },
            { name: 'Rithika Gandhi', phone: '9110201796' },
        ],
    },
    {
        name: 'Mahindra Rise',
        sbuLead: 'Melissa Thomas',
        pocs: [{ name: 'Brendon Fernandes', phone: '9930591739' }],
    },
];

/**
 * Brand name aliases - maps input names to database names
 */
const BRAND_NAME_ALIASES = {
    'Bridgestone': 'Bridgestone Tyres',
    'Pot & Bloom': 'Pot and Bloom',
    'Sriram Life Insurance': 'Shriram Life Insurance',
};

/**
 * Generate slug from brand name
 */
const generateSlug = name => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Find brand by name or alias
 */
async function findBrandByNameOrAlias(brandName) {
    const escapedName = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let brand = await Brand.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
    });

    if (brand) return brand;

    const aliasName = BRAND_NAME_ALIASES[brandName];
    if (aliasName) {
        const escapedAlias = aliasName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        brand = await Brand.findOne({
            name: { $regex: new RegExp(`^${escapedAlias}$`, 'i') }
        });
        if (brand) return brand;
    }

    const slug = generateSlug(brandName);
    brand = await Brand.findOne({ slug });
    if (brand) return brand;

    if (aliasName) {
        const aliasSlug = generateSlug(aliasName);
        brand = await Brand.findOne({ slug: aliasSlug });
    }

    return brand;
}

/**
 * Add or update Tech service in brand's services array with specific SBU
 */
const addTechService = (existingServices, sbuId) => {
    const services = [...(existingServices || [])];
    const existingTechIndex = services.findIndex(s => s.department === 'tech');

    const techService = {
        department: 'tech',
        isActive: true,
        startDate: new Date(),
        sbuId: sbuId,
    };

    if (existingTechIndex >= 0) {
        services[existingTechIndex] = {
            ...services[existingTechIndex],
            ...techService,
        };
    } else {
        services.push(techService);
    }

    return services;
};

/**
 * Seed or Update Brands with Tech service
 * Maps each brand to its respective SBU based on sbuLead
 */
async function seedTechBrands() {
    console.log('\n🏷️  Seeding/Updating Cycle 6 Tech Brands...');

    // Track brands per SBU for later update
    const sbuBrandMap = {
        'Akshay Chatlani': [],
        'Carolyn Fernandes': [],
        'Melissa Thomas': [],
    };

    let created = 0;
    let updated = 0;

    for (const brandData of TECH_BRAND_DATA) {
        try {
            const sbuId = SBU_LEAD_TO_ID[brandData.sbuLead];
            if (!sbuId) {
                console.error(`  ✗ Unknown SBU Lead: ${brandData.sbuLead}`);
                continue;
            }

            let brand = await findBrandByNameOrAlias(brandData.name);

            if (brand) {
                const updatedServices = addTechService(brand.services, new mongoose.Types.ObjectId(sbuId));
                brand = await Brand.findByIdAndUpdate(
                    brand._id,
                    { services: updatedServices, isActive: true },
                    { new: true }
                );
                updated++;
                console.log(`  ✓ Updated (added Tech): ${brand.name} → ${brandData.sbuLead}`);
            } else {
                const slug = generateSlug(brandData.name);
                const services = [{
                    department: 'tech',
                    isActive: true,
                    startDate: new Date(),
                    sbuId: new mongoose.Types.ObjectId(sbuId),
                }];

                brand = await Brand.create({
                    name: brandData.name,
                    slug,
                    services,
                    isActive: true,
                });
                created++;
                console.log(`  ✓ Created: ${brandData.name} → ${brandData.sbuLead}`);
            }

            sbuBrandMap[brandData.sbuLead].push(brand._id);
        } catch (error) {
            console.error(`  ✗ Failed to seed ${brandData.name}:`, error.message);
        }
    }

    console.log(`\n✅ Brands: ${created} created, ${updated} updated with Tech service`);

    return sbuBrandMap;
}

/**
 * Seed or Update Clients (POCs) for Tech brands
 */
async function seedTechClients() {
    console.log('\n👥 Seeding/Updating Cycle 6 Tech Clients (POCs)...');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const brandData of TECH_BRAND_DATA) {
        try {
            const brand = await findBrandByNameOrAlias(brandData.name);

            if (!brand) {
                console.log(`  ⚠ Brand not found: ${brandData.name}, skipping POCs...`);
                skipped += brandData.pocs.length;
                continue;
            }

            for (const poc of brandData.pocs) {
                if (!poc.phone || poc.phone === 'NA' || poc.phone.trim() === '') {
                    console.log(`  ⚠ Skipping ${poc.name} (no valid phone)`);
                    skipped++;
                    continue;
                }

                const normalizedPhone = poc.phone.replace(/\s+/g, '').replace(/-/g, '');

                try {
                    const existingClient = await Client.findOne({
                        brandId: brand._id,
                        phone: normalizedPhone,
                    });

                    const serviceMapping = brand.services
                        .filter(s => s.isActive)
                        .map(s => ({ department: s.department, isActive: true }));

                    if (!serviceMapping.find(s => s.department === 'tech')) {
                        serviceMapping.push({ department: 'tech', isActive: true });
                    }

                    if (existingClient) {
                        const existingMappings = existingClient.serviceMapping || [];
                        const mergedMappings = [...existingMappings];

                        if (!mergedMappings.find(s => s.department === 'tech')) {
                            mergedMappings.push({ department: 'tech', isActive: true });
                        }

                        await Client.findByIdAndUpdate(existingClient._id, {
                            name: poc.name,
                            serviceMapping: mergedMappings,
                            isActive: true,
                        });
                        updated++;
                        console.log(`  ✓ Updated POC: ${poc.name} (${brand.name})`);
                    } else {
                        await Client.create({
                            brandId: brand._id,
                            name: poc.name,
                            phone: normalizedPhone,
                            serviceMapping,
                            isActive: true,
                        });
                        created++;
                        console.log(`  ✓ Created POC: ${poc.name} (${brand.name})`);
                    }
                } catch (error) {
                    if (error.code === 11000) {
                        console.log(`  ⚠ Duplicate POC found, updating: ${poc.name}`);
                        const existingClient = await Client.findOne({
                            brandId: brand._id,
                            phone: normalizedPhone,
                        });
                        if (existingClient) {
                            const mergedMappings = [...(existingClient.serviceMapping || [])];
                            if (!mergedMappings.find(s => s.department === 'tech')) {
                                mergedMappings.push({ department: 'tech', isActive: true });
                            }
                            await Client.findByIdAndUpdate(existingClient._id, {
                                name: poc.name,
                                serviceMapping: mergedMappings,
                                isActive: true,
                            });
                        }
                        updated++;
                    } else {
                        console.error(`  ✗ Failed to seed POC ${poc.name}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error(`  ✗ Failed to process brand ${brandData.name}:`, error.message);
        }
    }

    console.log(`\n✅ Clients (POCs): ${created} created, ${updated} updated, ${skipped} skipped`);
}

/**
 * Update each SBU with brand references
 */
async function updateSBUBrands(sbuBrandMap) {
    console.log('\n🔗 Updating SBUs with brand references...');

    for (const [sbuLead, brandIds] of Object.entries(sbuBrandMap)) {
        if (brandIds.length === 0) continue;

        try {
            const sbuId = SBU_LEAD_TO_ID[sbuLead];
            const sbu = await SBU.findById(sbuId);

            if (!sbu) {
                console.log(`  ⚠ SBU not found for ${sbuLead}`);
                continue;
            }

            const existingBrandIds = (sbu.brands || []).map(id => id.toString());
            const allBrandIds = [...new Set([
                ...existingBrandIds,
                ...brandIds.map(id => id.toString())
            ])];

            await SBU.findByIdAndUpdate(sbuId, {
                brands: allBrandIds.map(id => new mongoose.Types.ObjectId(id))
            });

            console.log(`  ✓ Updated SBU (${sbuLead}): +${brandIds.length} brands`);
        } catch (error) {
            console.error(`  ✗ Failed to update SBU for ${sbuLead}:`, error.message);
        }
    }
}

/**
 * Main Seed Function
 */
async function seed() {
    console.log('🌱 Starting Cycle 6 Tech Brand & Client Seeding...\n');
    console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get Tech department
        const techDept = await Department.findOne({ name: 'tech' });
        if (!techDept) {
            console.error('❌ Tech department not found! Run seedDatabase.js first.');
            process.exit(1);
        }
        console.log(`📋 Found Tech department: ${techDept._id}`);

        console.log('\n📋 SBU Lead Mapping:');
        for (const [lead, id] of Object.entries(SBU_LEAD_TO_ID)) {
            const sbu = await SBU.findById(id);
            console.log(`   ${lead} → ${sbu?.name || 'NOT FOUND'} (${id})`);
        }

        // Seed/Update Brands with Tech service
        const sbuBrandMap = await seedTechBrands();

        // Update SBUs with brand references
        await updateSBUBrands(sbuBrandMap);

        // Seed/Update Clients (POCs)
        await seedTechClients();

        console.log('\n🎉 Cycle 6 Tech Brand & Client seeding completed successfully!');

        // Summary
        const totalBrands = await Brand.countDocuments();
        const techBrands = await Brand.countDocuments({ 'services.department': 'tech' });
        const totalClients = await Client.countDocuments();
        const techClients = await Client.countDocuments({ 'serviceMapping.department': 'tech' });

        console.log('\n📊 Database Summary:');
        console.log(`   Total Brands: ${totalBrands}`);
        console.log(`   Tech Brands: ${techBrands}`);
        console.log(`   Total Clients (POCs): ${totalClients}`);
        console.log(`   Tech Clients: ${techClients}`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Export for use in other scripts
export { TECH_BRAND_DATA, BRAND_NAME_ALIASES, SBU_LEAD_TO_ID };

// Run seed
seed();
