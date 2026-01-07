import 'dotenv/config';
import app from './app.js';
import {
  connectDB,
  disconnectDB,
  isDevelopment,
} from './config/database/connection.js';
import { syncDatabase, verifyDatabase } from './config/database/dbSync.js';
import { seedInitialData, cleanupDatabase } from './config/database/init.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 8080;
const ENV = isDevelopment ? 'development' : 'production';

/**
 * Validate required environment variables
 */
const validateEnvironment = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(
      `✗ Missing required environment variables: ${missing.join(', ')}`
    );
    logger.error('Please configure .env file. See .env.example for reference.');
    process.exit(1);
  }

  logger.info('✓ Environment variables validated');
  logger.info(`  - Environment: ${ENV}`);
  logger.info(`  - Port: ${PORT}`);
};

// Initialize database and start server
const startServer = async () => {
  try {
    // Step 1: Validate environment
    validateEnvironment();

    // Step 2: Connect to database
    await connectDB();

    // Step 3: Handle database cleanup (development only)
    if (process.env.CLEAN_DB === 'true') {
      if (isDevelopment) {
        logger.info('⚠️  CLEAN_DB enabled - performing full reset...');
        await cleanupDatabase();
        logger.info('✓ Database cleaned');
      } else {
        logger.warn('⚠️  CLEAN_DB ignored in production mode');
      }
    }

    // Step 4: Sync database schema and indexes
    await syncDatabase();

    // Step 5: Verify database is ready
    await verifyDatabase();

    // Step 6: Seed initial data (optional)
    if (process.env.SEED_DATA === 'true') {
      await seedInitialData();
      logger.info('✓ Initial data seeded');
    }

    // Step 7: Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info('✓ CSAT Server is ready!');
      logger.info('='.repeat(50));
      logger.info(`  Server: http://localhost:${PORT}`);
      logger.info(`  Health: http://localhost:${PORT}/health`);
      logger.info(`  API: http://localhost:${PORT}/api/v1`);
      logger.info(`  Environment: ${ENV}`);
      logger.info('='.repeat(50));
    });

    // Graceful shutdown handler
    const shutdown = async signal => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('✓ HTTP server closed');

        try {
          await disconnectDB();
          logger.info('✓ Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('✗ Error during shutdown:', error.message);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('✗ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
