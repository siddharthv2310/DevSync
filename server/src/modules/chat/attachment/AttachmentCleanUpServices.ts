
import {DeleteObjectCommand,HeadObjectCommand,} from "@aws-sdk/client-s3";

import prisma from "../../../config/prisma.js";
import s3Client from "../../../config/s3.js";
import { AWS_CONFIG } from "../../../config/aws.js";
import { AttachmentUploadStatus } from "@prisma/client";

export const cleanupAbandonedUploads = async () => {
    const now = new Date();

    // Find expired uploads that were never attached to a message.
    const uploads = await prisma.attachmentUpload.findMany({
        where: {
            status: {
                in: [
                    AttachmentUploadStatus.PENDING,
                    AttachmentUploadStatus.COMPLETED,
                ],
            },
            expiresAt: {
                lt: now,
            },
        },
        select: {
            id: true,
            storageKey: true,
            status: true,
        },
        take: 100,
        orderBy: {
            expiresAt: "asc",
        },
    });

    let cleaned = 0;
    let failed = 0;

    for (const upload of uploads) {
        try {
            // Only delete the object if it actually exists.
            try {
                await s3Client.send(
                    new HeadObjectCommand({
                        Bucket: AWS_CONFIG.bucketName,
                        Key: upload.storageKey,
                    })
                );

                await s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: AWS_CONFIG.bucketName,
                        Key: upload.storageKey,
                    })
                );
            } 
            catch (error: any) {
                // A missing S3 object is okay; other failures are not.
                if (
                    error?.name !== "NotFound" &&
                    error?.$metadata?.httpStatusCode !== 404
                ) {
                    throw error;
                }
            }

            // Change status only after storage cleanup succeeds.
            await prisma.attachmentUpload.updateMany({
                where: {
                    id: upload.id,
                    status: upload.status,
                    expiresAt: { lt: now },
                },
                data: {
                    status: AttachmentUploadStatus.EXPIRED,
                },
            });

            cleaned++;
        } 
        catch (error) {
            failed++;
            console.error(`Failed to clean abandoned upload ${upload.id}:`,error);
        }
    }

    return {
        checked: uploads.length,
        cleaned,
        failed,
    };
};
