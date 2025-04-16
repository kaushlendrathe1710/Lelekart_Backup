import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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

// Initialize S3 client for AWS SDK v3
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

// Generate presigned URL for downloading files
export async function getPresignedDownloadUrl(fileUrl: string): Promise<string> {
  try {
    console.log("Generating download URL for file:", fileUrl);
    
    // Extract S3 object key from URL
    let fileKey = '';
    
    if (fileUrl.includes('amazonaws.com')) {
      // Handle different S3 URL formats
      
      if (fileUrl.includes('.s3.') || fileUrl.includes('.s3-') || fileUrl.includes('s3.amazonaws.com')) {
        // Format: https://bucket-name.s3.region.amazonaws.com/key
        // or https://s3.region.amazonaws.com/bucket-name/key
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        if (url.hostname.includes('s3.amazonaws.com')) {
          // Format: https://s3.amazonaws.com/bucket-name/key
          // Skip the first part (bucket name)
          fileKey = pathParts.slice(1).join('/');
        } else {
          // Format: https://bucket-name.s3.region.amazonaws.com/key
          fileKey = pathParts.join('/');
        }
      } else {
        // Just extract the last part as key
        fileKey = fileUrl.split('/').pop() || '';
      }
    } else {
      // For direct keys or other formats
      fileKey = fileUrl.split('/').pop() || '';
    }
    
    console.log("Extracted S3 key:", fileKey);
    
    if (!fileKey) {
      throw new Error("Could not extract file key from URL");
    }
    
    // Create command to get the object
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: fileKey,
    });
    
    // Generate presigned URL (valid for 15 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    console.log("Generated presigned URL successfully");
    
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned download URL:", error);
    throw new Error("Failed to generate download URL");
  }
}