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


export const removeProjectMemberSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
    userId: z.string().uuid("invalid user ID"),
})


export const updateProjectMemberRoleSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),

});


export const updateProjectMemberRoleBodySchema = z.object({
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});


export const transferProjectOwnershipSchema = z.object({
    targetUserId: z.string().uuid("Invalid target user ID"),
});




export type TransferProjectOwnershipInput = z.infer< typeof transferProjectOwnershipSchema>;

export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>;

export type removeProjectMemberInput = z.infer<typeof removeProjectMemberSchema>;

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

export type GetProjectMembersQuery = z.infer<typeof getProjectMembersQuerySchema>;