import { z } from "zod";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const taskAttachmentParamsSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  attachmentId: z.string().uuid().optional(),
});

export const generateTaskAttachmentUploadSchema = z.object({
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.string().refine(
    (type) => allowedMimeTypes.includes(type),
    "Unsupported file type"
  ),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE),
});

export const completeTaskAttachmentUploadSchema = z.object({
  uploadId: z.string().uuid(),
});

export const listTaskAttachmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});



export type GenerateTaskAttachmentUploadInput = z.infer<typeof generateTaskAttachmentUploadSchema>;

export type ListTaskAttachmentsQuery = z.infer< typeof listTaskAttachmentsQuerySchema >;