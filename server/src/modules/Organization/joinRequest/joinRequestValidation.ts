import { joinRequestStatus } from "@prisma/client";
import { z } from "zod";

export const createJoinRequestSchema = z.object({
    message: z
        .string()
        .trim()
        .max(500, "Message cannot exceed 500 characters")
        .optional()
});


export const getJoinRequestsQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

    status: z
        .enum([
            joinRequestStatus.PENDING,
            joinRequestStatus.APPROVED,
            joinRequestStatus.REJECTED
        ])
        .optional()
});


//type
export type CreateJoinRequestInput = z.infer<typeof createJoinRequestSchema>;
export type GetJoinRequestsQuery = z.infer<typeof getJoinRequestsQuerySchema>;