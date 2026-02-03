/**
 * Seed Script - Brands & Clients with SBU Mappings (Cycle 6 - Fluence)
 * 
 * LOGIC FLOW:
 * 1. BRANDS:
 *    - Check if brand exists (by name, alias, or slug)
 *    - If EXISTS → UPDATE: Add/update 'fluence' service in services array
 *    - If NOT EXISTS → CREATE: New brand with 'fluence' service
 * 
 * 2. CLIENTS (POCs):
 *    - Check if client exists (by brandId + phone)
 *    - If EXISTS → UPDATE: Merge 'fluence' into serviceMapping, update name
 *    - If NOT EXISTS → CREATE: New client with serviceMapping from brand
 * 
 * 3. SBU:
 *    - Add all processed brand IDs to the Fluence SBU's brands array
 *    - Merge with existing brands (no duplicates)
 * 
 * Run with: node scripts/cycle6/fluence.js
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
 * Brand Data with POC Information - Cycle 6 Fluence
 * All brands are for Fluence department under single SBU
 */
const FLUENCE_BRAND_DATA = [
    {
        name: 'Huggies',
        pocs: [
            { name: 'Pratik Jain', phone: '9953948545' },
            { name: 'Iti Bhandani', phone: '9953895484' },
        ],
    },
    {
        name: 'Eureka Forbes',
        pocs: [
            { name: 'Shreya Naithani', phone: '7838552269' },
            { name: 'Arth Patel', phone: '8000759596' },
            { name: 'Manisha Fudani', phone: '9662970080' },
        ],
    },
    {
        name: 'Bridgestone',
        pocs: [{ name: 'Sumedha', phone: '9953251989' }],
    },
    {
        name: 'Adani Realty',
        pocs: [{ name: 'Sakshi', phone: '9825085451' }],
    },
    {
        name: 'Castrol',
        pocs: [
            { name: 'Rhea', phone: '8879972041' },
            { name: 'Shweta Pawar', phone: '9820394737' },
            { name: 'Ayush Garg', phone: '9654170396' },
            { name: 'Gaurav Khatri', phone: '9130098805' },
        ],
    },
    {
        name: 'Dr. Reddys',
        pocs: [{ name: 'Harshith Chandra', phone: '7989190494' }],
    },
    {
        name: 'Jockey',
        pocs: [{ name: 'Sourav Das', phone: '7829546760' }],
    },
    {
        name: 'Zespri',
        pocs: [{ name: 'Akshay Pai', phone: '9901929760' }],
    },
    {
        name: 'Fevicreate',
        pocs: [{ name: 'Jay Desai', phone: '8600801263' }],
    },
    {
        name: 'Simpolo',
        pocs: [{ name: 'Nilotpal', phone: '9974408808' }],
    },
    {
        name: 'Fevicryl',
        pocs: [{ name: 'Isha Amin', phone: '9987024742' }],
    },
    {
        name: 'Indriya',
        pocs: [{ name: 'Simran Talwar', phone: '9769808077' }],
    },
    {
        name: 'Glow & Lovely',
        pocs: [{ name: 'Suraj', phone: '9702859986' }],
    },
    {
        name: 'Boheco',
        pocs: [{ name: 'Tejas Wani', phone: '8779074002' }],
    },
    {
        name: 'Milton Appliances',
        pocs: [{ name: 'Ayush Sharma', phone: '9039380557' }],
    },
    {
        name: 'Motorola',
        pocs: [{ name: 'Himalay', phone: '9873676622' }],
    },
];

/**
 * Brand name aliases - maps input names to database names
 */
const BRAND_NAME_ALIASES = {
    'Bridgestone': 'Bridgestone Tyres',
    'Dr. Reddys': "Dr. Reddy's Laboratories",
    'Castrol': 'Castrol POWER1', // Map to one of the Castrol brands
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
 * Add or update Fluence service in brand's services array
 */
const addFluenceService = (existingServices, fluenceSbuId) => {
    const services = [...(existingServices || [])];
    const existingIndex = services.findIndex(s => s.department === 'fluence');

    const fluenceService = {
        department: 'fluence',
        isActive: true,
        startDate: new Date(),
        sbuId: fluenceSbuId,
    };

    if (existingIndex >= 0) {
        services[existingIndex] = {
            ...services[existingIndex],
            ...fluenceService,
        };
    } else {
        services.push(fluenceService);
    }

    return services;
};

/**
 * Seed or Update Brands with Fluence service
 */
async function seedFluenceBrands(fluenceSbu) {
    console.log('\n🏷️  Seeding/Updating Cycle 6 Fluence Brands...');

    const brandIds = [];
    let created = 0;
    let updated = 0;

    for (const brandData of FLUENCE_BRAND_DATA) {
        try {
            let brand = await findBrandByNameOrAlias(brandData.name);

            if (brand) {
                const updatedServices = addFluenceService(brand.services, fluenceSbu._id);
                brand = await Brand.findByIdAndUpdate(
                    brand._id,
                    { services: updatedServices, isActive: true },
                    { new: true }
                );
                updated++;
                console.log(`  ✓ Updated (added Fluence): ${brand.name}`);
            } else {
                const slug = generateSlug(brandData.name);
                const services = [{
                    department: 'fluence',
                    isActive: true,
                    startDate: new Date(),
                    sbuId: fluenceSbu._id,
                }];

                brand = await Brand.create({
                    name: brandData.name,
                    slug,
                    services,
                    isActive: true,
                });
                created++;
                console.log(`  ✓ Created: ${brandData.name}`);
            }

            brandIds.push(brand._id);
        } catch (error) {
            console.error(`  ✗ Failed to seed ${brandData.name}:`, error.message);
        }
    }

    console.log(`\n✅ Brands: ${created} created, ${updated} updated with Fluence service`);

    return brandIds;
}

/**
 * Seed or Update Clients (POCs) for Fluence brands
 */
async function seedFluenceClients() {
    console.log('\n👥 Seeding/Updating Cycle 6 Fluence Clients (POCs)...');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const brandData of FLUENCE_BRAND_DATA) {
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

                    if (!serviceMapping.find(s => s.department === 'fluence')) {
                        serviceMapping.push({ department: 'fluence', isActive: true });
                    }

                    if (existingClient) {
                        const existingMappings = existingClient.serviceMapping || [];
                        const mergedMappings = [...existingMappings];

                        if (!mergedMappings.find(s => s.department === 'fluence')) {
                            mergedMappings.push({ department: 'fluence', isActive: true });
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
                            if (!mergedMappings.find(s => s.department === 'fluence')) {
                                mergedMappings.push({ department: 'fluence', isActive: true });
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
 * Update Fluence SBU with brand references
 */
async function updateFluenceSBUBrands(fluenceSbu, brandIds) {
    console.log('\n🔗 Updating Fluence SBU with brand references...');

    try {
        const existingBrandIds = (fluenceSbu.brands || []).map(id => id.toString());
        const allBrandIds = [...new Set([
            ...existingBrandIds,
            ...brandIds.map(id => id.toString())
        ])];

        await SBU.findByIdAndUpdate(fluenceSbu._id, {
            brands: allBrandIds.map(id => new mongoose.Types.ObjectId(id))
        });

        console.log(`✅ Updated Fluence SBU with ${brandIds.length} brand references`);
    } catch (error) {
        console.error(`  ✗ Failed to update Fluence SBU:`, error.message);
    }
}

/**
 * Main Seed Function
 */
async function seed() {
    console.log('🌱 Starting Cycle 6 Fluence Brand & Client Seeding...\n');
    console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get Fluence department
        const fluenceDept = await Department.findOne({ name: 'fluence' });
        if (!fluenceDept) {
            console.error('❌ Fluence department not found! Run seedDatabase.js first.');
            process.exit(1);
        }
        console.log(`📋 Found Fluence department: ${fluenceDept._id}`);

        // Get Fluence SBU (NO SBU - Divisha Iyer)
        let fluenceSbu = await SBU.findOne({
            departmentId: fluenceDept._id,
            slug: 'fluence-no-sbu'
        });

        if (!fluenceSbu) {
            fluenceSbu = await SBU.findOne({
                departmentId: fluenceDept._id,
                name: 'NO SBU'
            });
        }

        if (!fluenceSbu) {
            console.error('❌ Fluence SBU not found! Run seedSBUs.js first.');
            process.exit(1);
        }
        console.log(`📋 Found Fluence SBU: ${fluenceSbu.name} (EVP: ${fluenceSbu.executiveVP})`);

        // Seed/Update Brands with Fluence service
        const brandIds = await seedFluenceBrands(fluenceSbu);

        // Update Fluence SBU with brand references
        await updateFluenceSBUBrands(fluenceSbu, brandIds);

        // Seed/Update Clients (POCs)
        await seedFluenceClients();

        console.log('\n🎉 Cycle 6 Fluence Brand & Client seeding completed successfully!');

        // Summary
        const totalBrands = await Brand.countDocuments();
        const fluenceBrands = await Brand.countDocuments({ 'services.department': 'fluence' });
        const totalClients = await Client.countDocuments();
        const fluenceClients = await Client.countDocuments({ 'serviceMapping.department': 'fluence' });

        console.log('\n📊 Database Summary:');
        console.log(`   Total Brands: ${totalBrands}`);
        console.log(`   Fluence Brands: ${fluenceBrands}`);
        console.log(`   Total Clients (POCs): ${totalClients}`);
        console.log(`   Fluence Clients: ${fluenceClients}`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Export for use in other scripts
export { FLUENCE_BRAND_DATA, BRAND_NAME_ALIASES };

// Run seed
seed();
