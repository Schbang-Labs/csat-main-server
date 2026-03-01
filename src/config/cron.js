import cron from 'node-cron';
import logger from './logger.js';
import { createBackup } from './backup.js';

export const initCronJobs = () => {
    // Schedule backup for the 1st of every month at 8:40 PM (20:40) in IST
    cron.schedule('40 20 1 * *', async () => {
        logger.info('🕒 Running scheduled monthly database backup...');
        try {
            await createBackup();
            logger.info('✅ Scheduled database backup completed successfully.');
        } catch (error) {
            logger.error('❌ Scheduled database backup failed:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    logger.info('🕒 Scheduled Cron jobs initialized successfully');
};
