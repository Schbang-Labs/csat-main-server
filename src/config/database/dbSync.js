import logger from '#config/logger.js';
import {
  Department,
  SBU,
  Brand,
  Client,
  Service,
  Cycle,
  CSATResponse,
  CycleSummary,
  User,
  Session,
  CSATResponseLog,
} from '#models/index.js';
import { isDevelopment } from './connection.js';

/**
 * Database Sync System
 * Environment-aware schema synchronization
 */

const MODELS_CONFIG = [
  { name: 'departments', model: Department },
  { name: 'sbus', model: SBU },
  { name: 'brands', model: Brand },
  { name: 'clients', model: Client },
  { name: 'services', model: Service },
  { name: 'cycles', model: Cycle },
  { name: 'csat_responses', model: CSATResponse },
  { name: 'cycle_summaries', model: CycleSummary },
  { name: 'users', model: User },
  { name: 'sessions', model: Session },
  { name: 'csat_response_logs', model: CSATResponseLog },
];

/**
 * Sync indexes for a model
 */
const syncModelIndexes = async (modelName, model) => {
  try {
    if (isDevelopment) {
      await model.syncIndexes();
      const indexes = await model.collection.listIndexes().toArray();
      logger.info(`  ✓ ${modelName}: ${indexes.length} indexes synced`);
    } else {
      const indexes = await model.collection.listIndexes().toArray();
      logger.info(`  ✓ ${modelName}: ${indexes.length} indexes verified`);
    }
  } catch (error) {
    if (error.code === 26) {
      logger.info(
        `  → ${modelName}: Collection will be created on first write`
      );
      return;
    }
    logger.error(`  ✗ ${modelName}: Error syncing indexes - ${error.message}`);
    throw error;
  }
};

/**
 * Main sync function
 */
const syncDatabase = async () => {
  try {
    const mode = isDevelopment ? 'development' : 'production';
    logger.info(`🔄 Starting database sync (${mode} mode)...`);

    for (const { name, model } of MODELS_CONFIG) {
      await syncModelIndexes(name, model);
    }

    logger.info('✓ Database sync complete');
    return { success: true };
  } catch (error) {
    logger.error('✗ Database sync failed:', error.message);
    throw error;
  }
};

/**
 * Verify database is ready
 */
const verifyDatabase = async () => {
  try {
    const counts = await Promise.all([
      Department.estimatedDocumentCount(),
      SBU.estimatedDocumentCount(),
      Brand.estimatedDocumentCount(),
      Client.estimatedDocumentCount(),
      Service.estimatedDocumentCount(),
      Cycle.estimatedDocumentCount(),
      CSATResponse.estimatedDocumentCount(),
      CycleSummary.estimatedDocumentCount(),
      User.estimatedDocumentCount(),
      Session.estimatedDocumentCount(),
      CSATResponseLog.estimatedDocumentCount(),
    ]);

    logger.info('✓ Database verified');
    logger.info(
      `  Collections: Departments(${counts[0]}), SBUs(${counts[1]}), Brands(${counts[2]}), Clients(${counts[3]}), Services(${counts[4]}), Cycles(${counts[5]}), Responses(${counts[6]}), Summaries(${counts[7]}), Users(${counts[8]}), Sessions(${counts[9]}), ResponseLogs(${counts[10]})`
    );

    return {
      success: true,
      collections: {
        departments: counts[0],
        sbus: counts[1],
        brands: counts[2],
        clients: counts[3],
        services: counts[4],
        cycles: counts[5],
        responses: counts[6],
        summaries: counts[7],
        users: counts[8],
        sessions: counts[9],
        responseLogs: counts[10],
      },
    };
  } catch (error) {
    logger.error('Database verification failed:', error.message);
    throw error;
  }
};

export { syncDatabase, verifyDatabase };
