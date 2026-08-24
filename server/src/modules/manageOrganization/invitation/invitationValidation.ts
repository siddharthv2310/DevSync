import { OrganizationRole } from "@prisma/client";
import {z} from "zod";

export const createInvitationSchema = z.object({
    email:z.string().trim().email("Invalid email address"),

    role : z.enum([
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER
    ]).default(OrganizationRole.MEMBER),
})

export const acceptInvitationSchema = z.object({
    token:z. string().min(1,"Invitation token is required"),
})

// type

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;