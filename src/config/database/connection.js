import mongoose from 'mongoose';
import logger from '#config/logger.js';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * MongoDB Connection Configuration
 * Best Practice: Environment-aware settings
 */
const getConnectionOptions = () => {
  const baseOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  };

  // Development: Auto-create indexes for convenience
  // Production: Disable auto-indexing for performance
  if (isDevelopment) {
    return {
      ...baseOptions,
      autoIndex: true,
      autoCreate: true,
    };
  }

  return {
    ...baseOptions,
    autoIndex: false,
    autoCreate: false,
  };
};

/**
 * Connect to MongoDB with retry logic
 * Best Practice: Graceful connection with retries
 */
const connectDB = async (retries = 5) => {
  try {
    const options = getConnectionOptions();

    await mongoose.connect(process.env.MONGO_URI, options);

    logger.info('✓ MongoDB connected successfully');
    logger.info(
      `  - Environment: ${isDevelopment ? 'development' : 'production'}`
    );
    logger.info(
      `  - Auto-indexing: ${options.autoIndex ? 'enabled' : 'disabled'}`
    );
    logger.info(`  - Database: ${mongoose.connection.name}`);

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);

    if (retries > 0) {
      logger.info(`Retrying connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }

    throw error;
  }
};

/**
 * Test database connection
 * Best Practice: Check connection state before operations
 */
const testConnection = async () => {
  try {
    const state = mongoose.connection.readyState;

    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (state === 1) {
      logger.info('✓ Database connection verified');
      return true;
    }

    if (state === 0) {
      await connectDB();
      return true;
    }

    throw new Error(`Invalid connection state: ${state}`);
  } catch (error) {
    logger.error('Database connection test failed:', error.message);
    throw error;
  }
};

/**
 * Graceful disconnect
 * Best Practice: Clean shutdown
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('✓ MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error.message);
    throw error;
  }
};

/**
 * Get connection state
 */
const getConnectionState = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

export {
  connectDB,
  testConnection,
  disconnectDB,
  getConnectionState,
  isDevelopment,
};
