import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import util from 'util';
import dotenv from 'dotenv';
import { uploadToS3 } from '../utils/s3Upload.js';

const execPromise = util.promisify(exec);

// Load environment variables if not already loaded
dotenv.config();

const installMongoTools = async () => {
    try {
        // Check if mongodump is already installed
        await execPromise('mongodump --version');
        console.log('✅ MongoDB Database Tools are already installed.');
    } catch (e) {
        console.log('⚠️ MongoDB Database Tools not found. Attempting to install via brew...');
        try {
            // Assuming macOS environment as per context. Adjust if deploying to a Linux server.
            await execPromise('brew tap mongodb/brew && brew install mongodb-database-tools');
            console.log('✅ MongoDB Database Tools installed successfully.');
        } catch (installErr) {
            console.error('❌ Failed to install MongoDB Database Tools. Please install it manually:', installErr.message);
            throw installErr;
        }
    }
};

const createBackup = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error('❌ MONGO_URI is not defined in .env');
        return;
    }

    try {
        // Step 1: Install MongoDB Database Tools
        console.log('🔄 Step 1: Checking for MongoDB Database Tools...');
        await installMongoTools();

        const dateStr = new Date().toISOString().split('T')[0];

        // Use a unique folder name in the temp directory to prevent collisions
        const backupFolderName = `backup-${dateStr}-${Date.now()}`;
        const backupDirPath = path.join(os.tmpdir(), backupFolderName);

        // Step 2: Create MongoDB dump into a temporary folder
        console.log('🔄 Step 2: Creating database dump in temp directory...');
        const dumpCommand = `mongodump --uri="${mongoUri}" --out="${backupDirPath}"`;
        await execPromise(dumpCommand);
        console.log(`✅ Database dump created in ${backupDirPath}/`);

        // Step 3: Compress the folder into a .tar.gz archive
        console.log('🔄 Step 3: Compressing the backup folder into a tar archive...');
        const tarFileName = `test-backup-${dateStr}.tar.gz`;
        const tarFilePath = path.join(os.tmpdir(), tarFileName);

        // Change directory to the temp dir to create the archive cleanly
        const tarCommand = `cd "${os.tmpdir()}" && tar -czvf "${tarFileName}" "${backupFolderName}"/`;
        await execPromise(tarCommand);
        console.log(`✅ Backup compressed successfully: ${tarFilePath}`);

        // Step 4: Upload to S3
        console.log('🔄 Step 4: Uploading to S3...');
        await uploadToS3(tarFilePath, tarFileName);

        // Step 5: Clean up Both the uncompressed folder and the tar file
        console.log('🔄 Step 5: Cleaning up temporary files...');
        if (fs.existsSync(backupDirPath)) {
            fs.rmSync(backupDirPath, { recursive: true, force: true });
            console.log('✅ Temporary backup folder deleted.');
        }
        if (fs.existsSync(tarFilePath)) {
            fs.rmSync(tarFilePath, { force: true });
            console.log('✅ Temporary tar backup file deleted.');
        }

        console.log('🎉 Backup process completed successfully!');
    } catch (error) {
        console.error('❌ Error during the backup process:', error);
    }
};

export {
    createBackup,
};
