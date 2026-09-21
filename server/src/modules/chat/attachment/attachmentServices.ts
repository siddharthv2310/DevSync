import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import s3Client from "../../../config/s3.js";
import { AWS_CONFIG } from "../../../config/aws.js";
import prisma from "../../../config/prisma.js";

const PRESIGNED_URL_EXPIRES_IN = 5 * 60;

export const generateUploadUrl = async (conversationId: string,userId: string,originalName: string,mimeType: string,sizeBytes: number) => {

  const uploadId = crypto.randomUUID();

  const extension = originalName.includes(".")
    ? originalName.substring(originalName.lastIndexOf("."))
    : "";

  const storageKey = `chat/${conversationId}/${userId}/${uploadId}${extension}`;

  await prisma.attachmentUpload.create({
    data: {
      id: uploadId,
      userId,
      conversationId,
      originalName,
      storageKey,
      mimeType,
      sizeBytes,
      status: "PENDING",
      expiresAt: new Date(
        Date.now() + PRESIGNED_URL_EXPIRES_IN * 1000
      ),
    },
  });

  const command = new PutObjectCommand({
    Bucket: AWS_CONFIG.bucketName,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  const uploadUrl = await getSignedUrl(
    s3Client,
    command,
    {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    }
  );

  return {
    uploadId,
    uploadUrl,
    expiresIn: PRESIGNED_URL_EXPIRES_IN,
  };
};