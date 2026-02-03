/**
 * Seed Script - Brands & Clients with SBU Mappings (Cycle 6 - Media)
 * 
 * LOGIC FLOW:
 * 1. BRANDS:
 *    - Check if brand exists (by name, alias, or slug)
 *    - If EXISTS → UPDATE: Add/update 'media' service in services array
 *    - If NOT EXISTS → CREATE: New brand with 'media' service
 * 
 * 2. CLIENTS (POCs):
 *    - Check if client exists (by brandId + phone)
 *    - If EXISTS → UPDATE: Merge 'media' into serviceMapping, update name
 *    - If NOT EXISTS → CREATE: New client with serviceMapping from brand
 * 
 * 3. SBU:
 *    - Add all processed brand IDs to the Media SBU's brands array
 *    - Merge with existing brands (no duplicates)
 * 
 * Run with: node scripts/cycle6/media.js
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
 * Brand Data with POC Information - Cycle 6 Media
 * All brands are for Media department under Mrugank Desai's SBU
 */
const MEDIA_BRAND_DATA = [
    {
        name: "Papa Don't Preach",
        pocs: [{ name: 'Viraj Anam', phone: '8767344972' }],
    },
    {
        name: 'Metro Shoes',
        pocs: [
            { name: 'Harsh Shah', phone: '9833345457' },
            { name: 'Aastha Mantri', phone: '9987292109' },
        ],
    },
    {
        name: 'Hobby Ideas',
        pocs: [{ name: 'Jay Desai', phone: '8600801263' }],
    },
    {
        name: 'Fevicreate',
        pocs: [{ name: 'Jay Desai', phone: '8600801263' }],
    },
    {
        name: 'Specta',
        // Note: This may map to "Specta Surfaces" in some cases
        pocs: [{ name: 'Abhishek Agarwal', phone: '7982498162' }],
    },
    {
        name: 'NueGo',
        // Note: This may map to "Greencell NueGo" in some cases
        pocs: [{ name: 'Deepti Sharma', phone: '9654264642' }],
    },
    {
        name: 'Cochlear',
        pocs: [{ name: 'Samantha Mendonsa', phone: '9920238249' }],
    },
    {
        name: 'JLL',
        pocs: [
            { name: 'Omprakash Singh', phone: '9004595090' },
            { name: 'Sahil Suhag', phone: '9582798405' },
        ],
    },
    {
        name: 'Level Supermind',
        pocs: [{ name: 'Pranali Kadu', phone: '9834553221' }],
    },
    {
        name: 'Mahindra Rise',
        pocs: [{ name: 'Avantika Chitlangia', phone: '9833779503' }],
    },
    {
        name: 'Armaf',
        pocs: [
            { name: 'Sufyaan Moosani', phone: '8655077233' },
            { name: 'Zahid Khan', phone: '9833380003' },
        ],
    },
    {
        name: 'Bodycraft Salon',
        pocs: [{ name: 'Riddhi Sharma', phone: '9724320003' }],
    },
    {
        name: 'Bodycraft Clinic',
        pocs: [{ name: 'Riddhi Sharma', phone: '9724320003' }],
    },
    {
        name: 'Tata Comm',
        pocs: [
            { name: 'Isha Chhaya', phone: '8511123564' },
            { name: 'Parag Girotra', phone: '7827067637' },
            { name: 'Nidhi Chauhan', phone: '9971446373' },
            { name: 'Alokita Sharma', phone: '7289986430' },
        ],
    },
    {
        name: 'ACCA',
        pocs: [{ name: 'Saahil Kalvani', phone: '9820835273' }],
    },
    {
        name: 'Kumari Fine Jewellery',
        pocs: [{ name: 'Ashish Sharma', phone: '9819413522' }],
    },
    {
        name: 'Bridgestone',
        // Note: This may map to "Bridgestone Tyres" in database
        pocs: [
            { name: 'Sumedha Sharma', phone: '9953251989' },
            { name: 'Pradeep Alex', phone: '7350016051' },
        ],
    },
    {
        name: 'Simpolo',
        pocs: [{ name: 'Nilotpal Chakraborthy', phone: '9974408808' }],
    },
    {
        name: 'Oriana',
        pocs: [{ name: 'Rajagopalan', phone: '7904206683' }],
    },
    {
        name: 'Groviva',
        pocs: [{ name: 'Anjali Pawar', phone: '7972446697' }],
    },
    {
        name: 'Mochi',
        pocs: [
            { name: 'Harsh Shah', phone: '9833345457' },
            { name: 'Aastha Mantri', phone: '9987292109' },
        ],
    },
    {
        name: 'Medimix',
        pocs: [{ name: 'Pooja Shuchak', phone: '8976075027' }],
    },
    {
        name: 'Indriya',
        pocs: [{ name: 'Rakshana Srikanth', phone: '9445057968' }],
    },
    {
        name: 'Torrent Electricals',
        pocs: [{ name: 'Anjali', phone: '9601986101' }],
    },
    {
        name: 'Dr. Reddy',
        // Note: This may map to "Dr. Reddy's Laboratories" in database
        pocs: [{ name: 'Harshith Chandra', phone: '7989190494' }],
    },
    {
        name: 'Lakeshore',
        pocs: [
            { name: 'Prithvi Hardasani', phone: '7977395820' },
            { name: 'Seema Bansal', phone: '7045367084' },
            { name: 'Janai Khan', phone: '9833285430' },
        ],
    },
    {
        name: 'Nikon',
        pocs: [
            { name: 'Kshitij Arora', phone: '8826144777' },
            { name: 'Arpana Kant', phone: '9873071496' },
        ],
    },
    {
        name: 'London Dairy',
        pocs: [{ name: 'Vipul Yadav', phone: '9833393092' }],
    },
    {
        name: 'Nanhi Kali',
        pocs: [{ name: 'Priyanka Bhanushali', phone: '8452005769' }],
    },
    {
        name: 'Kaabil',
        pocs: [{ name: 'Kamakshi Shaligram', phone: '7738076449' }],
    },
    {
        name: 'Kosmoderma',
        pocs: [{ name: 'Albin', phone: '9980202719' }],
    },
];

/**
 * Brand name aliases - maps input names to database names
 * Used when the same brand has different names in spreadsheet vs database
 */
const BRAND_NAME_ALIASES = {
    'Metro Shoes': 'Metro',
    'Specta': 'Specta Surfaces',
    'NueGo': 'Greencell NueGo',
    'Bridgestone': 'Bridgestone Tyres',
    'Dr. Reddy': "Dr. Reddy's Laboratories",
    'Pooja Shuchak': 'Pooja Suchak', // POC name fix
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
    // First try exact match
    let brand = await Brand.findOne({
        name: { $regex: new RegExp(`^${brandName}$`, 'i') }
    });

    if (brand) return brand;

    // Try alias
    const aliasName = BRAND_NAME_ALIASES[brandName];
    if (aliasName) {
        brand = await Brand.findOne({
            name: { $regex: new RegExp(`^${aliasName}$`, 'i') }
        });
        if (brand) return brand;
    }

    // Try by slug
    const slug = generateSlug(brandName);
    brand = await Brand.findOne({ slug });
    if (brand) return brand;

    // Try alias slug
    if (aliasName) {
        const aliasSlug = generateSlug(aliasName);
        brand = await Brand.findOne({ slug: aliasSlug });
    }

    return brand;
}

/**
 * Add or update Media service in brand's services array
 */
const addMediaService = (existingServices, mediaSbuId) => {
    const services = [...(existingServices || [])];

    // Check if media service already exists
    const existingMediaIndex = services.findIndex(s => s.department === 'media');

    const mediaService = {
        department: 'media',
        isActive: true,
        startDate: new Date(),
        sbuId: mediaSbuId,
    };

    if (existingMediaIndex >= 0) {
        // Update existing media service
        services[existingMediaIndex] = {
            ...services[existingMediaIndex],
            ...mediaService,
        };
    } else {
        // Add new media service
        services.push(mediaService);
    }

    return services;
};

/**
 * Seed or Update Brands with Media service
 * 
 * LOGIC:
 * - For each brand in MEDIA_BRAND_DATA:
 *   1. Try to find existing brand by name/alias/slug
 *   2. If found → UPDATE: Add media service to existing services array
 *   3. If not found → CREATE: New brand with media service only
 *   4. Collect brand ID for SBU brands array update
 */
async function seedMediaBrands(mediaSbu) {
    console.log('\n🏷️  Seeding/Updating Cycle 6 Media Brands...');

    // Track brands for SBU update
    const brandIds = [];

    let created = 0;
    let updated = 0;

    for (const brandData of MEDIA_BRAND_DATA) {
        try {
            // Try to find existing brand
            let brand = await findBrandByNameOrAlias(brandData.name);

            if (brand) {
                // Update existing brand - add/update Media service
                const updatedServices = addMediaService(brand.services, mediaSbu._id);

                brand = await Brand.findByIdAndUpdate(
                    brand._id,
                    { services: updatedServices, isActive: true },
                    { new: true }
                );
                updated++;
                console.log(`  ✓ Updated (added Media): ${brand.name}`);
            } else {
                // Create new brand with Media service
                const slug = generateSlug(brandData.name);
                const services = [{
                    department: 'media',
                    isActive: true,
                    startDate: new Date(),
                    sbuId: mediaSbu._id,
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

    console.log(`\n✅ Brands: ${created} created, ${updated} updated with Media service`);

    return brandIds;
}

/**
 * Seed or Update Clients (POCs) for Media brands
 * 
 * LOGIC:
 * - For each brand's POCs:
 *   1. Find the brand in database
 *   2. For each POC, check if client exists (by brandId + phone)
 *   3. If found → UPDATE: Merge 'media' into serviceMapping, update name
 *   4. If not found → CREATE: New client with all brand's services + media
 */
async function seedMediaClients() {
    console.log('\n👥 Seeding/Updating Cycle 6 Media Clients (POCs)...');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const brandData of MEDIA_BRAND_DATA) {
        try {
            // Find the brand
            const brand = await findBrandByNameOrAlias(brandData.name);

            if (!brand) {
                console.log(`  ⚠ Brand not found: ${brandData.name}, skipping POCs...`);
                skipped += brandData.pocs.length;
                continue;
            }

            for (const poc of brandData.pocs) {
                // Skip if phone is empty or NA
                if (!poc.phone || poc.phone === 'NA' || poc.phone.trim() === '') {
                    console.log(`  ⚠ Skipping ${poc.name} (no valid phone)`);
                    skipped++;
                    continue;
                }

                // Normalize phone number
                const normalizedPhone = poc.phone.replace(/\s+/g, '').replace(/-/g, '');

                try {
                    // Check if client exists for this brand and phone
                    const existingClient = await Client.findOne({
                        brandId: brand._id,
                        phone: normalizedPhone,
                    });

                    // Build service mapping - include media
                    const serviceMapping = brand.services
                        .filter(s => s.isActive)
                        .map(s => ({
                            department: s.department,
                            isActive: true,
                        }));

                    // Ensure media is in the service mapping
                    if (!serviceMapping.find(s => s.department === 'media')) {
                        serviceMapping.push({ department: 'media', isActive: true });
                    }

                    if (existingClient) {
                        // Update existing client - merge service mappings
                        const existingMappings = existingClient.serviceMapping || [];
                        const mergedMappings = [...existingMappings];

                        // Add media if not present
                        if (!mergedMappings.find(s => s.department === 'media')) {
                            mergedMappings.push({ department: 'media', isActive: true });
                        }

                        await Client.findByIdAndUpdate(existingClient._id, {
                            name: poc.name,
                            serviceMapping: mergedMappings,
                            isActive: true,
                        });
                        updated++;
                        console.log(`  ✓ Updated POC: ${poc.name} (${brand.name})`);
                    } else {
                        // Create new client
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
                        // Duplicate key error - try to update instead
                        console.log(`  ⚠ Duplicate POC found, updating: ${poc.name}`);
                        const existingClient = await Client.findOne({
                            brandId: brand._id,
                            phone: normalizedPhone,
                        });
                        if (existingClient) {
                            const mergedMappings = [...(existingClient.serviceMapping || [])];
                            if (!mergedMappings.find(s => s.department === 'media')) {
                                mergedMappings.push({ department: 'media', isActive: true });
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
 * Update Media SBU with brand references
 * 
 * LOGIC:
 * - Get existing brands array from SBU
 * - Merge new brand IDs with existing (no duplicates)
 * - Update SBU with combined brands array
 */
async function updateMediaSBUBrands(mediaSbu, brandIds) {
    console.log('\n🔗 Updating Media SBU with brand references...');

    try {
        // Get existing brands for this SBU
        const existingBrandIds = (mediaSbu.brands || []).map(id => id.toString());

        // Merge existing and new brand IDs (avoid duplicates)
        const allBrandIds = [...new Set([
            ...existingBrandIds,
            ...brandIds.map(id => id.toString())
        ])];

        await SBU.findByIdAndUpdate(mediaSbu._id, {
            brands: allBrandIds.map(id => new mongoose.Types.ObjectId(id))
        });

        console.log(`✅ Updated Media SBU with ${brandIds.length} brand references`);
    } catch (error) {
        console.error(`  ✗ Failed to update Media SBU:`, error.message);
    }
}

/**
 * Main Seed Function
 */
async function seed() {
    console.log('🌱 Starting Cycle 6 Media Brand & Client Seeding...\n');
    console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

    try {
        await mongoose.connect(MONGODB_URI);

        console.log('✅ Connected to MongoDB');

        // Get Media department
        const mediaDept = await Department.findOne({ name: 'media' });
        if (!mediaDept) {
            console.error('❌ Media department not found! Run seedDatabase.js first.');
            process.exit(1);
        }
        console.log(`📋 Found Media department: ${mediaDept._id}`);

        // Get or find Media SBU (NO SBU - Mrugank Desai)
        let mediaSbu = await SBU.findOne({
            departmentId: mediaDept._id,
            slug: 'media-no-sbu'
        });

        if (!mediaSbu) {
            // Try finding by name
            mediaSbu = await SBU.findOne({
                departmentId: mediaDept._id,
                name: 'NO SBU'
            });
        }

        if (!mediaSbu) {
            console.error('❌ Media SBU not found! Run seedSBUs.js first.');
            process.exit(1);
        }
        console.log(`📋 Found Media SBU: ${mediaSbu.name} (EVP: ${mediaSbu.executiveVP})`);

        // Seed/Update Brands with Media service
        const brandIds = await seedMediaBrands(mediaSbu);

        // Update Media SBU with brand references
        await updateMediaSBUBrands(mediaSbu, brandIds);

        // Seed/Update Clients (POCs)
        await seedMediaClients();

        console.log('\n🎉 Cycle 6 Media Brand & Client seeding completed successfully!');

        // Summary
        const totalBrands = await Brand.countDocuments();
        const mediaBrands = await Brand.countDocuments({ 'services.department': 'media' });
        const totalClients = await Client.countDocuments();
        const mediaClients = await Client.countDocuments({ 'serviceMapping.department': 'media' });

        console.log('\n📊 Database Summary:');
        console.log(`   Total Brands: ${totalBrands}`);
        console.log(`   Media Brands: ${mediaBrands}`);
        console.log(`   Total Clients (POCs): ${totalClients}`);
        console.log(`   Media Clients: ${mediaClients}`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Export for use in other scripts
export { MEDIA_BRAND_DATA, BRAND_NAME_ALIASES };

// Run seed
seed();
