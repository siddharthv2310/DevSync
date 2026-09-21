import {HeadBucketCommand, } from "@aws-sdk/client-s3";
  import s3Client from "./s3.js";
  import { AWS_CONFIG } from "./aws.js"; 
  
  const testS3 = async () => {
    try {
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: AWS_CONFIG.bucketName,
        })
      );
  
      console.log("✅ S3 connection successful");
    } 
    catch (error) {
      console.error("❌ S3 connection failed:", error);
    }
  };
  
  testS3();