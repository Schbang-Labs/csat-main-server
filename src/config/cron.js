import cron from 'node-cron';
import logger from './logger.js';
import { createBackup } from './backup.js';

export const initCronJobs = () => {
    // Schedule backup for the 1st of every month at midnight (00:00)
    cron.schedule('0 0 1 * *', async () => {
        logger.info('🕒 Running scheduled monthly database backup...');
        try {
            await createBackup();
            logger.info('✅ Scheduled database backup completed successfully.');
        } catch (error) {
            logger.error('❌ Scheduled database backup failed:', error);
        }
    });

    logger.info('🕒 Scheduled Cron jobs initialized successfully');
};
