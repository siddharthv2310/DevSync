import { z } from "zod";

export const createTeamSchema = z.object({

    name: z
        .string()
        .trim()
        .min(2, "Team name must contain at least 2 characters")
        .max(100, "Team name cannot exceed 100 characters"),

    slug: z
        .string()
        .trim()
        .min(2, "Team slug must contain at least 2 characters")
        .max(100, "Team slug cannot exceed 100 characters")
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug can only contain lowercase letters, numbers and hyphens"
        ),

    description: z
        .string()
        .trim()
        .max(
            500,
            "Team description cannot exceed 500 characters"
        )
        .optional(),

    avatar: z
        .string()
        .url("Avatar must be a valid URL")
        .optional()
        .or(z.literal(""))
});

export type CreateTeamInput = z.infer< typeof createTeamSchema >;