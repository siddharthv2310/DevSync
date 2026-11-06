import { z } from "zod";

export const createProjectInvitationSchema = z.object({
  invitedUserId: z.string().uuid("Invalid user ID"),

  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),

  message: z.string().trim().max(500).optional(),
});


export const getProjectInvitationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
    "EXPIRED",
  ]).optional(),

  search: z.string().trim().optional(),
});


export const acceptProjectInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export type AcceptProjectInvitationInput = z.infer<typeof acceptProjectInvitationSchema>;
export type GetProjectInvitationsQuery = z.infer<typeof getProjectInvitationsQuerySchema>;
export type CreateProjectInvitationInput = z.infer<typeof createProjectInvitationSchema>;