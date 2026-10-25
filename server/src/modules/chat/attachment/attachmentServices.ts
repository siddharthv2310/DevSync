import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { canDeleteAttachmentByRole , requireConversationAccess } from "../chatPermissions.js";

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



const PRESIGNED_DOWNLOAD_URL_EXPIRES_IN = 5 * 60;

export const generateDownloadUrl = async ( conversationId: string, attachmentId: string) => {
    const attachment = await prisma.messageAttachment.findFirst({
        where: {
            id: attachmentId,
            message: {
                conversationId,
            },
        },
        select: {
            id: true,
            originalName: true,
            storageKey: true,
            mimeType: true,
        },
    });

    if (!attachment) {
        throw new ApiErrors(404, "Attachment not found");
    }

    const command = new GetObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: attachment.storageKey,
        ResponseContentType: attachment.mimeType,
        ResponseContentDisposition:
            `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
    });

    const downloadUrl = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: PRESIGNED_DOWNLOAD_URL_EXPIRES_IN,
        }
    );

    return {
        attachmentId: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        downloadUrl,
        expiresIn: PRESIGNED_DOWNLOAD_URL_EXPIRES_IN,
    };
};

export const deleteAttachment = async ( conversationId: string, attachmentId: string, userId: string ): Promise<void> => {

    const attachment = await prisma.messageAttachment.findFirst({
        where: {
            id: attachmentId,
            message: { conversationId },
        },
        select: {
            id: true,
            storageKey: true,
            uploadedById: true,
            deletionPending: true,
        },
    });

    if (!attachment) {
        throw new ApiErrors(404, "Attachment not found");
    }

    // 3. The uploader can delete their own attachment.
    // Otherwise, verify role hierarchy.
    if (attachment.uploadedById !== userId) {

        if(!attachment.uploadedById){
            throw new ApiErrors(400, "Attachment was not uploaded by a user");
        }

        const allowed = await canDeleteAttachmentByRole(
            conversationId,
            userId,
            attachment.uploadedById
        );

        if (!allowed) {
            throw new ApiErrors(403,"You do not have permission to delete this attachment" );
        }
    }

    // 4. Claim deletion so concurrent requests do not process
    // the same attachment simultaneously.
    if (!attachment.deletionPending) {
        const claimed = await prisma.messageAttachment.updateMany({
            where: {
                id: attachment.id,
                deletionPending: false,
            },
            data: { deletionPending: true },
        });

        if (claimed.count !== 1) {
            throw new ApiErrors(409,"Attachment deletion is already in progress");
        }
    }

    // 5. Delete from S3, then delete the database record.
    // If S3 fails, reset the flag so the request can be retried.
    try {
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: AWS_CONFIG.bucketName,
                Key: attachment.storageKey,
            })
        );
    } catch (error) {
        await prisma.messageAttachment.updateMany({
            where: { id: attachment.id },
            data: { deletionPending: false },
        });

        throw new ApiErrors(502, "Failed to delete attachment from storage");
    }

    try {
        await prisma.messageAttachment.delete({
            where: { id: attachment.id },
        });
    } catch (error) {
        // Keep deletionPending=true. A retry can repeat the S3 delete
        // and then retry removal of the database record.
        throw new ApiErrors( 500, "File was removed from storage, but its database record could not be removed. Retry deletion." );
    }
};