import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

import s3Client from "../../../config/s3.js";
import { AWS_CONFIG } from "../../../config/aws.js";
import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { AttachmentUploadStatus } from "@prisma/client";

const PRESIGNED_URL_EXPIRES_IN = 5 * 60;

export const generateUploadUrl = async (conversationId: string, userId: string, originalName: string, mimeType: string, sizeBytes: number) => {

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


export const completeUpload = async (conversationId: string, uploadId: string, userId: string) => {
    const upload = await prisma.attachmentUpload.findFirst({
        where: {
            id: uploadId,
            conversationId,
            userId,
        }
    });

    if (!upload) {
        throw new ApiErrors(404, "Upload not found");
    }

    if (upload.status !== AttachmentUploadStatus.PENDING) {
        throw new ApiErrors(409, " Upload is not pending")
    }

    if (upload.expiresAt < new Date()) {
        await prisma.attachmentUpload.update({
            where: {
                id: upload.id,
            },
            data: {
                status: AttachmentUploadStatus.EXPIRED,
            },
        });

        throw new ApiErrors(410, "Upload has expired");
    }

    const object = await s3Client.send(
        new HeadObjectCommand({
            Bucket: AWS_CONFIG.bucketName,
            Key: upload.storageKey,
        })
    );

    if (!object.ContentLength) {
        throw new ApiErrors(400, "Uploaded file is empty or missing");
    }

    if (object.ContentLength !== upload.sizeBytes) {
        throw new ApiErrors(400, "Uploaded file size does not match");
    }

    if (object.ContentType !== upload.mimeType) {
        throw new ApiErrors(400, "Uploaded file type does not match");
    }

    const completedUpload = await prisma.attachmentUpload.update({
        where: {
            id: upload.id,
        },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
        },
    });

    return completedUpload;

};