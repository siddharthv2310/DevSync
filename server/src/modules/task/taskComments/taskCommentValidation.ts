import { z } from "zod";

export const taskCommentParamsSchema = z.object({
    projectId: z.string().uuid(),
    taskId: z.string().uuid(),
    commentId: z.string().uuid().optional(),
});

export const createTaskCommentSchema = z.object({
    content: z.string()
        .trim()
        .min(1, "Comment cannot be empty")
        .max(10000, "Comment cannot exceed 10000 characters"),

    mentionedUserIds: z.array(z.string().uuid())
        .max(20, "Maximum 20 mentions allowed")
        .optional()
        .default([]),
});

export const updateTaskCommentSchema = z.object({
    content: z.string()
        .trim()
        .min(1, "Comment cannot be empty")
        .max(10000, "Comment cannot exceed 10000 characters"),
});

export const listTaskCommentsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;
export type UpdateTaskCommentInput = z.infer<typeof updateTaskCommentSchema>;
export type ListTaskCommentsQuery = z.infer<typeof listTaskCommentsQuerySchema>;