import { z } from "zod";

export const createTeamJoinRequestSchema = z.object({
    message: z
        .string()
        .trim()
        .max(500, "Message cannot exceed 500 characters")
        .optional()
});

export type createTeamJoinRequestInput = z.infer<typeof createTeamJoinRequestSchema>;