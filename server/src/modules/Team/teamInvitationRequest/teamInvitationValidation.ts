import { TeamInvitationStatus } from "@prisma/client";
import { z } from "zod";


export const createTeamInvitationSchema = z.object({
    userId: z
        .string()
        .uuid("Invalid user ID"),

    message: z
        .string()
        .trim()
        .max(500, "Message cannot exceed 500 characters")
        .optional(),
})

export const getTeamInvitationsQuerySchema = z.object({
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
        .nativeEnum(TeamInvitationStatus)
        .optional()
});

export const acceptTeamInvitationSchema = z.object({
    token: z
        .string()
        .min(1, "Invitation token is required")
});



export type createTeamInvitationInput = z.infer<typeof createTeamInvitationSchema>;
export type GetTeamInvitationsQuery = z.infer<typeof getTeamInvitationsQuerySchema>;