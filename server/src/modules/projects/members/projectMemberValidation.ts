import { z } from "zod";

export const getProjectMembersSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
});

export const getProjectMembersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(50).default(20),

    search: z.string().trim().max(100).optional(),
});


export const addProjectMemberSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),

    role: z
        .enum(["ADMIN", "MEMBER", "VIEWER"])
        .default("MEMBER"),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

export type GetProjectMembersQuery = z.infer<typeof getProjectMembersQuerySchema>;