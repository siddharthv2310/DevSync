import { OrganizationRole } from "@prisma/client";
import {z} from "zod";

export const createOrganizationSchema = z.object({
    name:z
    .string()
    .trim()
    .min(2,"Organization name must be at least 2 characters long")
    .max(50,"Organization name must be less than 50 characters long"),

    slug:z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must not exceed 50 characters")
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers and hyphens"
    ),

    description : z
    .string()
    .trim()
    .max(1000,"Description must not exceed 1000 characters")
    .optional(),

    avatar:z
    .string()
    .trim()
    .url("Avatar must be a valid URL")
    .optional(),
})

export const organizationMembersQuerySchema = z.object({
    page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

    limit:z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)

})
export const updateMemberRoleSchema = z.object({
    role: z.enum([
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER
    ])
});

export const transferOwnershipSchema = z.object({
    userId: z.string().uuid("Invalid user ID")
});


// type define

export type createOrganisationinput =z.infer<typeof createOrganizationSchema>;
export type OrganizationMembersQuery = z.infer< typeof organizationMembersQuerySchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;