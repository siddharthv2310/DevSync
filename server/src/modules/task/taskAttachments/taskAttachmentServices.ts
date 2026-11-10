import crypto from "crypto";
import path from "path";

import {AttachmentUploadStatus,Prisma,} from "@prisma/client";

import { PutObjectCommand,HeadObjectCommand,GetObjectCommand,} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import prisma from "../../../config/prisma.js";
import s3Client from "../../../config/s3.js";
import { AWS_CONFIG } from "../../../config/aws.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import {GenerateTaskAttachmentUploadInput,ListTaskAttachmentsQuery, } from "./taskAttachmentValidation.js";

const UPLOAD_URL_EXPIRY = 300;
const DOWNLOAD_URL_EXPIRY = 300;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface TaskAccessInput {
  projectId: string;
  taskId: string;
  userId: string;
  canManageAnyTask: boolean;
}

const sanitizeFileName = (name: string) => {
  return path.basename(name).replace(/[\u0000-\u001F\u007F]/g, "");
};

const getTaskWithAccess = async (input: TaskAccessInput,requireWriteAccess: boolean) => {
  const task = await prisma.task.findFirst({
    where: {
      id: input.taskId,
      projectId: input.projectId,
    },
    include: {
      assignees: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!task) {
    throw new ApiErrors(404, "Task not found");
  }

  if (requireWriteAccess && !input.canManageAnyTask) {
    const isCreator = task.createdById === input.userId;

    const isAssignee = task.assignees.some(
      (assignee) => assignee.userId === input.userId
    );

    if (!isCreator && !isAssignee) {
      throw new ApiErrors(
        403,
        "You can only manage attachments on tasks you created or are assigned to"
      );
    }
  }

  return task;
};


// 1. Generate S3 upload URL


export const generateTaskAttachmentUploadUrl = async (input: TaskAccessInput & {  file: GenerateTaskAttachmentUploadInput;}) => {

  await getTaskWithAccess(input, true);

  const originalName = sanitizeFileName(input.file.originalName);

  if (!originalName) {
    throw new ApiErrors(400, "Invalid file name");
  }

  if (input.file.sizeBytes > MAX_FILE_SIZE) {
    throw new ApiErrors(400, "Maximum file size is 25 MB");
  }

  const uploadId = crypto.randomUUID();

  const extension = path.extname(originalName).toLowerCase();

  const storageKey = `tasks/${input.projectId}/${input.taskId}/${input.userId}/` + `${uploadId}${extension}`;

  const expiresAt = new Date(Date.now() + UPLOAD_URL_EXPIRY * 1000);

  await prisma.taskAttachmentUpload.create({
    data: {
      id: uploadId,
      taskId: input.taskId,
      userId: input.userId,
      originalName,
      storageKey,
      mimeType: input.file.mimeType,
      sizeBytes: input.file.sizeBytes,
      expiresAt,
      status: AttachmentUploadStatus.PENDING,
    },
  });

  try {
    const command = new PutObjectCommand({
      Bucket: AWS_CONFIG.bucketName,
      Key: storageKey,
      ContentType: input.file.mimeType,
      ContentLength: input.file.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: UPLOAD_URL_EXPIRY,
    });

    return {
      uploadId,
      uploadUrl,
      storageKey,
      expiresAt,
      requiredHeaders: {
        "Content-Type": input.file.mimeType,
      },
    };
  } 
  
  catch (error) {
    await prisma.taskAttachmentUpload.updateMany({
      where: {
        id: uploadId,
        status: AttachmentUploadStatus.PENDING,
      },
      data: {
        status: AttachmentUploadStatus.FAILED,
      },
    });

    throw error;
  }
};


// 2. Complete upload

export const completeTaskAttachmentUpload = async ( input: TaskAccessInput & { uploadId: string;}) => {
  await getTaskWithAccess(input, true);

  const upload = await prisma.taskAttachmentUpload.findFirst({
    where: {
      id: input.uploadId,
      taskId: input.taskId,
      userId: input.userId,
    },
  });

  if (!upload) {
    throw new ApiErrors(404, "Upload not found");
  }

  // Idempotent response if this upload was already consumed.
  if (upload.status === AttachmentUploadStatus.CONSUMED) {
    const existingAttachment = await prisma.taskAttachment.findUnique({
      where: {
        storageKey: upload.storageKey,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (existingAttachment) {
      return existingAttachment;
    }

    throw new ApiErrors(409, "Upload has already been consumed");
  }

  if (upload.status !== AttachmentUploadStatus.PENDING) {
    throw new ApiErrors(400, "Upload is not in a pending state");
  }

  if (upload.expiresAt <= new Date()) {
    await prisma.taskAttachmentUpload.updateMany({
      where: {
        id: upload.id,
        status: AttachmentUploadStatus.PENDING,
      },
      data: {
        status: AttachmentUploadStatus.EXPIRED,
      },
    });

    throw new ApiErrors(400, "Upload URL has expired");
  }

  // Verify that the object actually exists in S3.
  const headObject = await s3Client.send(
    new HeadObjectCommand({
      Bucket: AWS_CONFIG.bucketName,
      Key: upload.storageKey,
    })
  );

  if (headObject.ContentLength !== upload.sizeBytes) {
    throw new ApiErrors(400, "Uploaded file size does not match");
  }

  if (headObject.ContentType !== upload.mimeType) {
    throw new ApiErrors(400, "Uploaded file type does not match");
  }

  // Atomically consume the upload and create its attachment record.
  const attachment = await prisma.$transaction(async (tx) => {
    const claimed = await tx.taskAttachmentUpload.updateMany({
      where: {
        id: upload.id,
        taskId: input.taskId,
        userId: input.userId,
        status: AttachmentUploadStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        status: AttachmentUploadStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (claimed.count !== 1) {
      throw new ApiErrors(409, "Upload has already been processed");
    }

    const createdAttachment = await tx.taskAttachment.create({
      data: {
        taskId: input.taskId,
        originalName: upload.originalName,
        storageKey: upload.storageKey,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        uploadedById: input.userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.taskAttachmentUpload.update({
      where: {
        id: upload.id,
      },
      data: {
        status: AttachmentUploadStatus.CONSUMED,
        consumedAt: new Date(),
      },
    });

    return createdAttachment;
  });

  return attachment;
};


// 3. List attachments

export const getTaskAttachments = async (input: TaskAccessInput & { pagination: ListTaskAttachmentsQuery;}) => {

  await getTaskWithAccess(input, false);

  const { page, limit } = input.pagination;

  const where = {
    taskId: input.taskId,
    deletionPending: false,
  };

  const [attachments, total] = await Promise.all([
    prisma.taskAttachment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.taskAttachment.count({
      where,
    }),
  ]);

  return {
    attachments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 4. Generate download URL


export const generateTaskAttachmentDownloadUrl = async (input: TaskAccessInput & {attachmentId: string;}) => {

  await getTaskWithAccess(input, false);

  const attachment = await prisma.taskAttachment.findFirst({
    where: {
      id: input.attachmentId,
      taskId: input.taskId,
      deletionPending: false,
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
      `attachment; filename*=UTF-8''${encodeURIComponent(
        attachment.originalName
      )}`,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY,
  });

  return {
    downloadUrl,
    expiresIn: DOWNLOAD_URL_EXPIRY,
    attachment: {
      id: attachment.id,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    },
  };
};


// 5. Delete attachment

export const deleteTaskAttachment = async (input: TaskAccessInput & {  attachmentId: string; } ) => {
  await getTaskWithAccess(input, true);

  await prisma.$transaction(async (tx) => {
    const attachment = await tx.taskAttachment.findFirst({
      where: {
        id: input.attachmentId,
        taskId: input.taskId,
        deletionPending: false,
      },
    });

    if (!attachment) {
      throw new ApiErrors(404, "Attachment not found");
    }

    // Queue S3 deletion. The existing worker will process this job.
    await tx.storageDeletionJob.create({
      data: {
        storageKey: attachment.storageKey,
      },
    });

    await tx.taskAttachment.delete({
      where: {
        id: attachment.id,
      },
    });
  });

  return {
    attachmentId: input.attachmentId,
  };
};