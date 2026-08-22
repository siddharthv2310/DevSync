import { OrganizationRole } from "@prisma/client";
import {z} from "zod";

export const createInvitationSchema = z.object({
    email:z.string().trim().email("Invalid email address"),

    role : z.enum([
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER
    ]).default(OrganizationRole.MEMBER),
})

// type

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;