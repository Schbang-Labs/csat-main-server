import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export const uploadToS3 = async (filePath, fileName) => {
    try {
        const fileStream = fs.createReadStream(filePath);

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `backups/${fileName}`,
            Body: fileStream,
        };

        console.log(`☁️ Uploading ${fileName} to S3 bucket ${process.env.AWS_BUCKET_NAME}...`);

        const command = new PutObjectCommand(uploadParams);
        const response = await s3Client.send(command);

        console.log(`✅ Successfully uploaded ${fileName} to S3`);
        return response;
    } catch (error) {
        console.error('❌ Error uploading to S3:', error);
        throw error;
    }
};
