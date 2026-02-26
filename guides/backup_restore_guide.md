# Restoring MongoDB Backup from S3

If you need to restore the database from a backup stored in S3, follow these steps:

## Prerequisites
1. Ensure you have MongoDB Database Tools installed (`mongorestore`).
2. Have the MongoDB connection URI handy.

## Step 1: Download and Extract
1. Download the highly compressed `.tar.gz` backup file from your **AWS S3 Bucket**.
2. Extract the file using your standard archive extractor or via terminal:
   ```bash
   tar -xzvf test-backup-YYYY-MM-DD.tar.gz
   ```
3. A folder will be created (e.g., `backup-YYYY-MM-DD-timestamp`). **Rename this folder to `backup`**:
   ```bash
   mv backup-YYYY-MM-DD-timestamp backup
   ```

## Step 2: Run `mongorestore`
Run the following command in your terminal within the directory containing the `backup` folder.

> **Note**: Replace the database URL inside the `--uri` option with your target cluster's connection string, and adjust `--nsTo` if restoring to a specific database name.

```bash
mongorestore \
--uri="mongodb+srv://wa_db_user:T1dIkbuvQocw16qw@cluster0.lpwhlrz.mongodb.net/?appName=Cluster0" \
--nsFrom="test.*" \
--nsTo="test1.*" \
backup/test
```

### Explanation of flags:
- `--uri`: Specifies the cluster you are connecting to.
- `--nsFrom="test.*"`: The original database namespace inside the backup dumps (usually `test`).
- `--nsTo="test1.*"`: The target database namespace you are restoring into. This will inject the data into the `test1` database.
- `backup/test`: The path pointing to the specific BSON/JSON files inside the extracted and renamed `backup` directory.

Once completed, the script will output the number of documents successfully restored to the cluster!
