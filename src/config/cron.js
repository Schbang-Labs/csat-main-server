import cron from 'node-cron';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import logger from './logger.js';
import { createBackup } from './backup.js';
import { recordBackupSuccess, recordBackupFailure } from '../utils/otelMetrics.js';

const tracer = trace.getTracer('csat-server');

export const initCronJobs = () => {
    // Schedule backup for the 1st of every month at 8:40 PM (20:40) in IST.
    // Wrap in an explicit span so the backup pipeline (mongodump → tar →
    // s3 upload) shows up as one trace tree in Tempo.
    cron.schedule('40 20 1 * *', async () => {
        await tracer.startActiveSpan(
            'cron.monthly_backup',
            {
                attributes: {
                    'cron.expression': '40 20 1 * *',
                    'cron.timezone': 'Asia/Kolkata',
                },
            },
            async span => {
                logger.info('🕒 Running scheduled monthly database backup...');
                const startedAt = Date.now();
                try {
                    await createBackup();
                    const durationSeconds = (Date.now() - startedAt) / 1000;
                    recordBackupSuccess(durationSeconds);
                    span.setStatus({ code: SpanStatusCode.OK });
                    logger.info(`✅ Scheduled database backup completed successfully in ${durationSeconds.toFixed(1)}s.`);
                } catch (error) {
                    const durationSeconds = (Date.now() - startedAt) / 1000;
                    recordBackupFailure(durationSeconds);
                    span.recordException(error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                    logger.error(`❌ Scheduled database backup failed after ${durationSeconds.toFixed(1)}s: ${error.message}`);
                } finally {
                    span.end();
                }
            }
        );
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    logger.info('🕒 Scheduled Cron jobs initialized successfully');
};
