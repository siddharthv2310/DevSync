import { TeamRole } from "@prisma/client";
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

export const getTeamsQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20),

    search: z
        .string()
        .trim()
        .max(100)
        .optional(),

    includeInactive: z.coerce
        .boolean()
        .default(false)
});

export const getTeamMembersQuerySchema = z.object({

    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20),

    search: z
        .string()
        .trim()
        .max(100)
        .optional()
});

export const addTeamMemberSchema = z.object({

    userId: z
        .string()
        .uuid("Invalid user ID"),

    role: z
        .nativeEnum(TeamRole)
        .default(TeamRole.MEMBER)
});

export const updateTeamMemberRoleSchema = z.object({
    role: z.enum([
        TeamRole.ADMIN,
        TeamRole.MEMBER
    ])
});

export const transferTeamOwnershipSchema = z.object({
    newOwnerId: z
        .string()
        .uuid("Invalid new owner ID")
});

export const updateTeamSchema = z.object({

    name: z
        .string()
        .trim()
        .min(2, "Team name must contain at least 2 characters")
        .max(100, "Team name cannot exceed 100 characters")
        .optional(),

    slug: z
        .string()
        .trim()
        .min(2, "Team slug must contain at least 2 characters")
        .max(100, "Team slug cannot exceed 100 characters")
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug can only contain lowercase letters, numbers and hyphens"
        )
        .optional(),

    description: z
        .string()
        .trim()
        .max(
            500,
            "Team description cannot exceed 500 characters"
        )
        .nullable()
        .optional(),

    avatar: z
        .string()
        .url("Avatar must be a valid URL")
        .nullable()
        .optional()

})
    .refine(
        data => Object.keys(data).length > 0,
        {
            message: "At least one field is required"
        }
    );




export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type GetTeamsQuery = z.infer<typeof getTeamsQuerySchema>;
export type GetTeamMembersQuery = z.infer<typeof getTeamMembersQuerySchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type UpdateTeamMemberRoleInput = z.infer<typeof updateTeamMemberRoleSchema>;
export type TransferTeamOwnershipInput = z.infer<typeof transferTeamOwnershipSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

