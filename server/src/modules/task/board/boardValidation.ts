import { z } from "zod";
import { BoardColumnCategory } from "@prisma/client";

export const boardParamsSchema = z.object({
    projectId: z.string().uuid(),
});

export const boardColumnParamsSchema = z.object({
    projectId: z.string().uuid(),
    columnId: z.string().uuid(),
});

export const updateBoardSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
);

export const createBoardColumnSchema = z.object({
    name: z.string().trim().min(1).max(50),
    category: z.nativeEnum(BoardColumnCategory),
    wipLimit: z.number().int().positive().max(1000).nullable().optional(),
});

export const updateBoardColumnSchema = z.object({
    name: z.string().trim().min(1).max(50).optional(),
    category: z.nativeEnum(BoardColumnCategory).optional(),
    wipLimit: z.number().int().positive().max(1000).nullable().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
);

export const boardTasksQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});


export type BoardTasksQuery = z.infer<typeof boardTasksQuerySchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateBoardColumnInput = z.infer<typeof createBoardColumnSchema>;
export type UpdateBoardColumnInput = z.infer<typeof updateBoardColumnSchema>;