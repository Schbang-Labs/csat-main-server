/**
 * Update SBU Brands Script - Cycle 6
 * 
 * This script:
 * 1. Reads brand-SBU mapping data from cycle6_brand_*.md files
 * 2. Clears the brands array in each SBU
 * 3. Finds brands from Brand model and maps them to their respective SBUs
 * 4. Updates the brands array in each SBU with the correct brand ObjectIds
 * 5. Removes Amit from SBU Corporate India (leadNames, VP, etc.)
 * 
 * Run with: node scripts/cycle6/updateSBUBrands.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SBU, Brand, Department } from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

/**
 * ============================================================
 * SOLUTIONS DEPARTMENT - Brand to SBU Mapping (from cycle_6_brand_solutions.md)
 * SBU name is mapped via leadNames field
 * ============================================================
 */
const SOLUTIONS_SBU_BRAND_MAP = {
    // Chirag -> SBU Global India
    'SBU Global India': [
        'Glow & Lovely',
        'Bajaj Almond',
        'Bridgestone Tyres',
        'Bookmyshow',
        'Sanofi Allergy',
        'Medimix',
        'Huggies',
        'Gyproc',
        'Amazon SEA',
        'Amazon FUSE',
    ],
    // Samarth -> SBU Next Wave
    'SBU Next Wave': [
        'Marvel + Disney',
        'London Dairy',
        'Allegro',
        'Riot Games - Valorant',
        'Riot Games - League Of Legends',
        'Dominos',
        'Celio',
        'Eureka Forbes',
        'Britannia',
        'Crompton',
        'Fair and Handsome',
        'Exotica / Pure Glow',
        'Voltas',
    ],
    // Shreya -> SBU For the Craft
    'SBU For the Craft': ['ITC Hotels', 'Wok and Roll'],
    // Sumesh -> Bangalore
    'Bangalore': [
        'Himalaya PartySmart',
        'Pot and Bloom',
        'Krafton',
        'ITC Limited Corporate',
        'ITC HR',
    ],
    // Vrinda -> SBU Corporate India
    'SBU Corporate India': ['Jockey', 'Oriana', 'Ample Group'],
    // NOTE: SBU India Prime removed - Amit's brands redistributed below
    // Dhruv + Malka -> SBU Impact India
    'SBU Impact India': [
        'Philips',
        'iQOO',
        'Cavin Kare',
        'Max Protein',
        'IIFL',
        'Optimum Nutrition + Isopure',
        'Dabur Hajmola',
    ],
    // Dhruv + Aniket -> SBU India Rising 1
    // Added: Visa (from Amit)
    'SBU India Rising 1': [
        'Fevicol',
        'Fiama',
        'Kotak 811 + Kotak 811 (Fin For All)',
        'Hobby Ideas',
        'Charmis + Dermafique',
        'Vivel',
        'Engage',
        'Visa', // Moved from Amit
    ],
    // Dhruv + Ria -> SBU India Rising 2
    'SBU India Rising 2': [
        'HDFC Bank',
        'Phoenix Marketcity',
        'Britannia Cakes',
        'Britannia Breads',
        'Britannia Croissant',
        'Britannia Rusk',
        'Britannia Cheese',
        'Britannia Winkin Cow and Come Alive',
        "Dr. Reddy's Laboratories",
    ],
    // Dhruv + Jainik -> SBU India Rising 3
    'SBU India Rising 3': ['Apollo Hospitals'],
    // Rohan + Batul + Reuben -> SBU India on the Move 1
    'SBU India on the Move 1': [
        'HDFC Life',
        'Skybags Luggage',
        'Skybags Backpack',
        'Episoft',
        'Bonito Design',
        'HDFC Ergo',
        'Flair pens',
        'Pierre Cardin',
        'Meraki Habitat',
        'Torrent Electricals',
        'Hauser Germany',
    ],
    // Rohan + Yohann -> SBU India on the Move 2
    // Added: AM/NS, UltraTech Cement, Safari Genie (from Amit)
    'SBU India on the Move 2': [
        'Castrol POWER1',
        'Castrol Magnatec/ Cars',
        'Greencell NueGo',
        'Mahindra Rise',
        'Aditya Birla Paints',
        'CRIF High Mark',
        'AM/NS', // Moved from Amit
        'UltraTech Cement', // Moved from Amit
        'Safari Genie', // Moved from Amit
    ],
    // Afshaad -> SBU Luxe
    // Added: Nerolac, Specta Surfaces, Metro, Mochi, Tata Cliq Lifestyle, TATA Cliq Palette, GAIN by Galderma, Biluma Galderma (from Amit)
    'SBU Luxe': [
        'Kerastase',
        "Kiehl's",
        'Lancome',
        "L'oreal Redken",
        'ICA Pidilite',
        'Simpolo',
        "L'oreal Professionnel",
        'Kumari Jewels',
        'Louis Philippe',
        'Cerave',
        'Nerolac', // Moved from Amit
        'Specta Surfaces', // Moved from Amit
        'Metro', // Moved from Amit
        'Mochi', // Moved from Amit
        'Tata Cliq Lifestyle', // Moved from Amit
        'TATA Cliq Palette', // Moved from Amit
        'GAIN by Galderma', // Moved from Amit
        'Biluma Galderma', // Moved from Amit (NEW brand)
    ],
    // Afshaad + Eric -> SBU For the Arts
    'SBU For the Arts': [
        'Nita Mukesh Ambani Cultural Centre (NMACC)',
        'Encore',
        'Jio World Convention Centre (JWCC)',
        'Vantara',
        'Vantara Niwas',
        'Reliance Jio',
    ],
    // Rohan + Varsha -> SBU GenHer
    // Added: Milton, Treo, Procook (from Amit)
    'SBU GenHer': [
        'Mukul Madhav Foundation',
        'Reliance Foundation',
        'Shiv Nadar Foundation',
        'Godrej Design Labs',
        'Cochlear',
        'INTABCPA',
        'Aditya Birla Novel',
        'Her Circle',
        'Nanhi Kali',
        'Kaabil',
        'Indriya',
        'Milton', // Moved from Amit
        'Treo', // Moved from Amit
        'Procook', // Moved from Amit
    ],
};

/**
 * ============================================================
 * SMP DEPARTMENT - Single SBU (from cycle_6_brand_smp.md)
 * SBU ID: 697094d7818800e6498d1f10
 * ============================================================
 */
const SMP_BRANDS = [
    'McCain',
    'Celio',
    'Dabur Hajmola', // Was: Hajmola
    'Britannia',
    'ITC Limited Corporate', // Was: ITC
    'Ample Group', // Was: Ample
    'Louis Philippe',
    'Tata Capital',
    "Dr. Reddy's Laboratories", // Was: Dr Reddys Lab
];

/**
 * ============================================================
 * MEDIA DEPARTMENT - Single SBU (from cycle_6_brand_media.md)
 * SBU Lead: Mrugank Desai (NO SBU)
 * ============================================================
 */
const MEDIA_BRANDS = [
    "Papa Don't Preach",
    'Metro', // Was: Metro Shoes
    'Hobby Ideas',
    'Fevicreate',
    'Specta Surfaces', // Was: Specta
    'NueGo',
    'Cochlear',
    'JLL',
    'Level Supermind',
    'Mahindra Rise',
    'Armaf',
    'Bodycraft Salon',
    'Bodycraft Clinic',
    'Tata Comm',
    'ACCA',
    'Kumari Fine Jewellery',
    'Bridgestone',
    'Simpolo',
    'Oriana',
    'Groviva',
    'Mochi',
    'Medimix',
    'Indriya',
    'Torrent Electricals',
    "Dr. Reddy's Laboratories", // Was: Dr. Reddy
    'Lakeshore',
    'Nikon',
    'London Dairy',
    'Nanhi Kali',
    'Kaabil',
    'Kosmoderma',
];

/**
 * ============================================================
 * FLUENCE DEPARTMENT - Single SBU (from cycle_6_brand_fluence.md)
 * SBU EVP: Divisha Iyer (NO SBU)
 * ============================================================
 */
const FLUENCE_BRANDS = [
    'Huggies',
    'Eureka Forbes',
    'Bridgestone',
    'Adani Realty',
    'Castrol',
    "Dr. Reddy's Laboratories", // Was: Dr. Reddys
    'Jockey',
    'Zespri',
    'Fevicreate',
    'Simpolo',
    'Fevicryl',
    'Indriya',
    'Glow & Lovely',
    'Boheco',
    'Milton Appliances',
    'Motorola',
];

/**
 * ============================================================
 * SEO DEPARTMENT - Single SBU (from cycle_6_brand_seo.md)
 * SBU EVP: Dhaval Doshi (NO SBU)
 * ============================================================
 */
const SEO_BRANDS = [
    'Bridgestone',
    'Britannia CheeseitUp',
    'Britannia Corporate',
    'Ecolink',
    'Sriram Life Insurance',
    'Lakme',
    'Britannia AEO-GEO',
    'Birla Opus',
    'HCCB',
    'Jindal Steel',
    'NueGo',
    'UltraTech',
    'Bodycraft',
    'Fevicol',
    'Everest',
    'Kumari',
    'Jockey',
    'Mahindra Rise',
    '5 Paisa',
];

/**
 * ============================================================
 * TECH DEPARTMENT - Single SBU (from cycle_6_brand_tech.md)
 * SBU EVP: Dhaval Doshi (NO SBU)
 * ============================================================
 */
const TECH_BRANDS = [
    'Bridgestone',
    'DHP Heavy',
    'Britannia Corporate',
    'Sriram Life Insurance',
    'Birla Opus',
    'HCCB',
    'Jindal Steel',
    'Pot and Bloom', // Was: Pot & Bloom
    'Bodycraft',
    'Ring (NZ)',
    'NRB bearings',
    'Brookfield',
    'Himatsingka',
    'Mahindra Rise',
];

/**
 * ============================================================
 * MARTECH DEPARTMENT - 3 SBUs (from cycle_6_brand_martech.md)
 * SBU names match actual database values
 * ============================================================
 */
const MARTECH_SBU_BRAND_MAP = {
    // NO SBU (contains Akshay Chatlani in leadNames)
    'NO SBU': [
        'Audi',
        'Crompton',
        'Bridgestone',
        'Jio Hotstar',
    ],
    // SBU Carolyn Fernandes
    'SBU Carolyn Fernandes': [
        'Pot and Bloom',
        'McCain',
        'ICICI prudential',
        'Bayer',
        'JL Morison',
    ],
    // SBU Melissa Thomas
    'SBU Melissa Thomas': [
        'Hamilton',
        'Kotak811',
        'Jockey',
        'Nivea',
        'Mahindra Rise',
        'Eureka Forbes',
    ],
};

/**
 * Brands that need to be created if not found
 * Maps brand name variations to their correct names
 */
const BRAND_NAME_VARIATIONS = {
    'Pot & Bloom': 'Pot and Bloom',
    'Dr Reddys Lab': "Dr. Reddy's Laboratories",
    'Dr. Reddys': "Dr. Reddy's Laboratories",
    'Dr. Reddy': "Dr. Reddy's Laboratories",
    'Metro Shoes': 'Metro',
    'Specta': 'Specta Surfaces',
    'Hajmola': 'Dabur Hajmola',
    'ITC': 'ITC Limited Corporate',
    'Ample': 'Ample Group',
};

/**
 * Generate slug from name
 */
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Find brand by name (case-insensitive, tries multiple variations)
 */
const findBrandByName = async (brandName) => {
    // Check if there's a known variation for this brand name
    const normalizedName = BRAND_NAME_VARIATIONS[brandName] || brandName;

    // Try exact match first
    let brand = await Brand.findOne({ name: normalizedName });
    if (brand) return brand;

    // Try original name exact match
    brand = await Brand.findOne({ name: brandName });
    if (brand) return brand;

    // Try case-insensitive match
    brand = await Brand.findOne({ name: { $regex: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i') } });
    if (brand) return brand;

    // Try original name case-insensitive
    brand = await Brand.findOne({ name: { $regex: new RegExp(`^${escapeRegex(brandName)}$`, 'i') } });
    if (brand) return brand;

    // Try slug match
    const slug = generateSlug(normalizedName);
    brand = await Brand.findOne({ slug });
    if (brand) return brand;

    // Try original slug match
    const originalSlug = generateSlug(brandName);
    brand = await Brand.findOne({ slug: originalSlug });
    if (brand) return brand;

    return null;
};

/**
 * Escape regex special characters
 */
const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Create a brand if it doesn't exist
 */
const createBrandIfNotExists = async (brandName, departmentCode, sbuId) => {
    const slug = generateSlug(brandName);

    let brand = await Brand.findOne({ slug });
    if (brand) {
        console.log(`     📌 Brand "${brandName}" already exists`);
        return brand;
    }

    brand = new Brand({
        name: brandName,
        slug,
        services: [{
            department: departmentCode,
            sbuId: sbuId,
            isActive: true,
            startDate: new Date(),
        }],
        isActive: true,
    });

    await brand.save();
    console.log(`     ✨ Created new brand "${brandName}" for ${departmentCode}`);
    return brand;
};

/**
 * Update brands array for an SBU and also update brand.services[].sbuId
 */
const updateSBUBrands = async (sbuName, brandNames, departmentCode) => {
    // Find the SBU
    const department = await Department.findOne({ name: departmentCode });
    if (!department) {
        console.log(`  ⚠️  Department ${departmentCode} not found`);
        return { updated: false, reason: 'Department not found' };
    }

    const sbu = await SBU.findOne({
        name: sbuName,
        departmentId: department._id
    });

    if (!sbu) {
        console.log(`  ⚠️  SBU "${sbuName}" not found in ${departmentCode}`);
        return { updated: false, reason: 'SBU not found' };
    }

    // Find all brand ObjectIds and update their services array
    const brandIds = [];
    const notFound = [];
    let brandsUpdated = 0;

    for (const brandName of brandNames) {
        const brand = await findBrandByName(brandName);
        if (brand) {
            brandIds.push(brand._id);

            // Update the brand's services array - set sbuId for this department
            let serviceFound = false;
            if (brand.services && brand.services.length > 0) {
                for (const service of brand.services) {
                    if (service.department === departmentCode) {
                        service.sbuId = sbu._id;
                        serviceFound = true;
                    }
                }
            }

            // If department not found in services, add it
            if (!serviceFound) {
                if (!brand.services) {
                    brand.services = [];
                }
                brand.services.push({
                    department: departmentCode,
                    sbuId: sbu._id,
                    isActive: true,
                    startDate: new Date(),
                });
            }

            await brand.save();
            brandsUpdated++;
        } else {
            notFound.push(brandName);
        }
    }

    // Clear and update brands array in SBU
    sbu.brands = brandIds;
    await sbu.save();

    console.log(`  ✅ Updated SBU "${sbuName}": ${brandIds.length} brands added, ${brandsUpdated} brands' services updated`);
    if (notFound.length > 0) {
        console.log(`     ⚠️  Brands not found: ${notFound.join(', ')}`);
    }

    return { updated: true, brandCount: brandIds.length, brandsUpdated, notFound };
};

/**
 * Update single-SBU department (find the only active SBU for the department)
 * Also updates brand.services[].sbuId for each brand
 */
const updateSingleSBUDepartment = async (departmentCode, brandNames) => {
    const department = await Department.findOne({ name: departmentCode });
    if (!department) {
        console.log(`  ⚠️  Department ${departmentCode} not found`);
        return { updated: false, reason: 'Department not found' };
    }

    // Find the single SBU for this department
    const sbu = await SBU.findOne({
        departmentId: department._id,
        isActive: true
    });

    if (!sbu) {
        console.log(`  ⚠️  No active SBU found for ${departmentCode}`);
        return { updated: false, reason: 'SBU not found' };
    }

    // Find all brand ObjectIds and update their services array
    const brandIds = [];
    const notFound = [];
    let brandsUpdated = 0;

    for (const brandName of brandNames) {
        const brand = await findBrandByName(brandName);
        if (brand) {
            brandIds.push(brand._id);

            // Update the brand's services array - set sbuId for this department
            let serviceFound = false;
            if (brand.services && brand.services.length > 0) {
                for (const service of brand.services) {
                    if (service.department === departmentCode) {
                        service.sbuId = sbu._id;
                        serviceFound = true;
                    }
                }
            }

            // If department not found in services, add it
            if (!serviceFound) {
                if (!brand.services) {
                    brand.services = [];
                }
                brand.services.push({
                    department: departmentCode,
                    sbuId: sbu._id,
                    isActive: true,
                    startDate: new Date(),
                });
            }

            await brand.save();
            brandsUpdated++;
        } else {
            notFound.push(brandName);
        }
    }

    // Clear and update brands array in SBU
    sbu.brands = brandIds;
    await sbu.save();

    console.log(`  ✅ Updated SBU "${sbu.name}": ${brandIds.length} brands added, ${brandsUpdated} brands' services updated`);
    if (notFound.length > 0) {
        console.log(`     ⚠️  Brands not found: ${notFound.join(', ')}`);
    }

    return { updated: true, brandCount: brandIds.length, brandsUpdated, notFound };
};

/**
 * Remove Amit from SBU Corporate India
 */
const removeAmitFromCorporateIndia = async () => {
    console.log('\n🔧 Removing Amit from SBU Corporate India...');

    const department = await Department.findOne({ name: 'solutions' });
    if (!department) {
        console.log('  ⚠️  Solutions department not found');
        return;
    }

    const sbu = await SBU.findOne({
        name: 'SBU Corporate India',
        departmentId: department._id
    });

    if (!sbu) {
        console.log('  ⚠️  SBU Corporate India not found');
        return;
    }

    // Remove Amit from leadNames
    if (sbu.leadNames && sbu.leadNames.length > 0) {
        const originalLeadNames = [...sbu.leadNames];
        sbu.leadNames = sbu.leadNames.filter(name =>
            !name.toLowerCase().includes('amit')
        );
        console.log(`  📝 leadNames: ${originalLeadNames.join(', ')} -> ${sbu.leadNames.join(', ') || '(empty)'}`);
    }

    // Remove Amit from executiveVP if present
    if (sbu.executiveVP && sbu.executiveVP.toLowerCase().includes('amit')) {
        console.log(`  📝 executiveVP: "${sbu.executiveVP}" -> null`);
        sbu.executiveVP = null;
    }

    // Remove Amit from associateVP if present
    if (sbu.associateVP && sbu.associateVP.toLowerCase().includes('amit')) {
        console.log(`  📝 associateVP: "${sbu.associateVP}" -> null`);
        sbu.associateVP = null;
    }

    // Remove Amit from associateVPs array if present
    if (sbu.associateVPs && sbu.associateVPs.length > 0) {
        const originalAVPs = [...sbu.associateVPs];
        sbu.associateVPs = sbu.associateVPs.filter(name =>
            !name.toLowerCase().includes('amit')
        );
        if (originalAVPs.length !== sbu.associateVPs.length) {
            console.log(`  📝 associateVPs: ${originalAVPs.join(', ')} -> ${sbu.associateVPs.join(', ') || '(empty)'}`);
        }
    }

    await sbu.save();
    console.log('  ✅ Amit removed from SBU Corporate India');
};

/**
 * Main execution
 */
const main = async () => {
    console.log('🚀 Starting SBU Brands Update Script (Cycle 6)');
    console.log('================================================\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // ============================================================
        // STEP 1: Remove Amit from SBU Corporate India
        // ============================================================
        await removeAmitFromCorporateIndia();

        // ============================================================
        // STEP 2: Clear ALL SBU brands arrays first
        // ============================================================
        console.log('\n🧹 Clearing all SBU brands arrays...');
        const clearResult = await SBU.updateMany({}, { $set: { brands: [] } });
        console.log(`  ✅ Cleared brands array for ${clearResult.modifiedCount} SBUs\n`);

        // ============================================================
        // STEP 3: Update Solutions Department SBUs
        // ============================================================
        console.log('📦 Updating SOLUTIONS Department SBUs...');
        for (const [sbuName, brands] of Object.entries(SOLUTIONS_SBU_BRAND_MAP)) {
            await updateSBUBrands(sbuName, brands, 'solutions');
        }

        // ============================================================
        // STEP 4: Update SMP Department (Single SBU)
        // ============================================================
        console.log('\n📦 Updating SMP Department SBU...');
        await updateSingleSBUDepartment('smp', SMP_BRANDS);

        // ============================================================
        // STEP 5: Update Media Department (Single SBU)
        // ============================================================
        console.log('\n📦 Updating MEDIA Department SBU...');
        await updateSingleSBUDepartment('media', MEDIA_BRANDS);

        // ============================================================
        // STEP 6: Update Fluence Department (Single SBU)
        // ============================================================
        console.log('\n📦 Updating FLUENCE Department SBU...');
        await updateSingleSBUDepartment('fluence', FLUENCE_BRANDS);

        // ============================================================
        // STEP 7: Update SEO Department (Single SBU)
        // ============================================================
        console.log('\n📦 Updating SEO Department SBU...');
        await updateSingleSBUDepartment('seo', SEO_BRANDS);

        // ============================================================
        // STEP 8: Update Tech Department (Single SBU)
        // ============================================================
        console.log('\n📦 Updating TECH Department SBU...');
        await updateSingleSBUDepartment('tech', TECH_BRANDS);

        // ============================================================
        // STEP 9: Update MarTech Department SBUs
        // ============================================================
        console.log('\n📦 Updating MARTECH Department SBUs...');
        for (const [sbuName, brands] of Object.entries(MARTECH_SBU_BRAND_MAP)) {
            await updateSBUBrands(sbuName, brands, 'martech');
        }

        console.log('\n================================================');
        console.log('✅ SBU Brands Update Complete!');
        console.log('================================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run the script
main();
