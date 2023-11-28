// s3Uploader.js

const aws = require('aws-sdk');
import dotenv from 'dotenv';

dotenv.config();

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  ACL: 'public-read',
});

const uploadToS3 = (file: any) => {
  return new Promise<string>((resolve, reject) => {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
    };

    s3.upload(params, (err: any, data: any) => {
      if (err) {
        reject('Error uploading file to S3.');
      } else {
        resolve(data.Location);
      }
    });
  });
};

export default uploadToS3;
