import { z } from "zod";

export const organizationConversationSchema = z.object({
    organizationId: z.string().uuid(),
});

export const teamConversationSchema = z.object({
    organizationId: z.string().uuid(),
    teamId: z.string().uuid(),
});

export const projectConversationSchema = z.object({
    organizationId: z.string().uuid(),
    projectId: z.string().uuid(),
});

export const directConversationSchema = z.object({
    otherUserId: z.string().uuid(),
});

export const conversationSchema = z.object({
    conversationId: z.string().uuid(),
});