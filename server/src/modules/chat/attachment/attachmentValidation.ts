import {z} from "zod"

export const createUploadUrlSchema = z.object({
    originalName: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name is too long"),

  mimeType: z
    .string()
    .trim()
    .min(1, "MIME type is required")
    .max(100),

  sizeBytes: z
    .number()
    .int()
    .positive("File size must be greater than 0"),
});

