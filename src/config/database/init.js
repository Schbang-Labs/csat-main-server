import logger from '#config/logger.js';
import {
  Department,
  SBU,
  Brand,
  Client,
  Cycle,
  CSATResponse,
} from '#models/index.js';

/**
 * Initial Departments Data
 */
const INITIAL_DEPARTMENTS = [
  { name: 'solutions' },
  { name: 'media' },
  { name: 'tech' },
  { name: 'seo' },
  { name: 'martech' },
  { name: 'fluence' },
  { name: 'smp' },
];

/**
 * Seed initial data (optional)
 */
const seedInitialData = async () => {
  try {
    logger.info('Checking for initial data...');

    // Seed departments if empty
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      for (const dept of INITIAL_DEPARTMENTS) {
        await Department.findOneAndUpdate(
          { name: dept.name },
          { ...dept, isActive: true },
          { upsert: true, new: true }
        );
      }
      logger.info(`✓ Seeded ${INITIAL_DEPARTMENTS.length} departments`);
    } else {
      logger.info(`Found ${deptCount} existing department(s)`);
    }

    // Check other collections
    const brandCount = await Brand.countDocuments();
    const cycleCount = await Cycle.countDocuments();

    logger.info(`  Brands: ${brandCount}, Cycles: ${cycleCount}`);

    return { success: true };
  } catch (error) {
    logger.error('Error seeding initial data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up database - drops and recreates collections
 */
const cleanupDatabase = async () => {
  try {
    logger.info('Starting database cleanup...');

    const models = [
      { name: 'departments', model: Department },
      { name: 'sbus', model: SBU },
      { name: 'brands', model: Brand },
      { name: 'clients', model: Client },
      { name: 'cycles', model: Cycle },
      { name: 'csat_responses', model: CSATResponse },
    ];

    for (const { name, model } of models) {
      try {
        await model.collection.drop();
        logger.info(`✓ Dropped collection: ${name}`);
      } catch (error) {
        if (error.code !== 26) {
          logger.warn(`Warning dropping ${name}:`, error.message);
        }
      }
    }

    logger.info('✓ Database cleanup complete');
    return { success: true };
  } catch (error) {
    logger.error('Database cleanup failed:', error.message);
    throw error;
  }
};

export { seedInitialData, cleanupDatabase };
