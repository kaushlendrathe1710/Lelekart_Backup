import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// AWS configuration
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || '';
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: AWS_REGION,
});

// Set up CORS for the bucket
async function configureBucketCORS() {
  try {
    const corsParams = {
      Bucket: AWS_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'], // For development, allow all origins
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };
    
    await s3.putBucketCors(corsParams).promise();
    console.log('S3 bucket CORS configured successfully');
  } catch (error) {
    console.error('Error configuring S3 bucket CORS:', error);
  }
}

// Configure CORS on startup
configureBucketCORS();

// Upload file to S3
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const fileKey = `${uuidv4()}-${fileName}`;
  
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: contentType,
    // ACL removed due to 'AccessControlListNotSupported' error
    // AWS S3 buckets now use bucket policies instead of ACLs
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location; // Return the URL of the uploaded file
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

// Delete file from S3
export async function deleteFile(fileUrl: string): Promise<void> {
  // Extract the key from the URL
  const fileKey = fileUrl.split('/').pop() || '';
  
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}