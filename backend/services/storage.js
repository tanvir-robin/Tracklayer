const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function uploadToMinIO(fileBuffer, originalName, mimetype) {
  const ext = path.extname(originalName);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: filename,
    Body: fileBuffer,
    ContentType: mimetype,
  });

  await s3.send(command);

  const fileUrl = `${process.env.MINIO_CDN_URL}/${filename}`;
  return fileUrl;
}

module.exports = { uploadToMinIO };
