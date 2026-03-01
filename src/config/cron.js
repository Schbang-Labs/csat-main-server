import cron from 'node-cron';
import logger from './logger.js';
import { createBackup } from './backup.js';

export const initCronJobs = () => {
    // Schedule backup for the 1st of every month at 8:20 PM (20:20)
    cron.schedule('20 20 1 * *', async () => {
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
