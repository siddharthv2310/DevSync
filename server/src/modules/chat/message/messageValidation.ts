import { MessageType } from "@prisma/client";
import { z } from "zod";

export const createMessageSchema = z.object({
    type: z.nativeEnum(MessageType).default(MessageType.TEXT),

    content: z
        .string()
        .trim()
        .min(1, "Message content cannot be empty")
        .max(10000, "Message content cannot exceed 10,000 characters")
        .optional(),

    replyToId: z
        .string()
        .uuid("Invalid reply message ID")
        .optional(),
}).superRefine((data, ctx) => {
    if (data.type === MessageType.TEXT && !data.content) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["content"],
            message: "Text message must contain content",
        });
    }

    if (
        data.type !== MessageType.TEXT &&
        !data.content
    ) {
        // Non-text messages may initially have no content.
        // Attachments will be handled separately.
    }
});

export const updateMessageSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Message content cannot be empty")
        .max(10000, "Message content cannot exceed 10,000 characters"),
});

export const getMessagesQuerySchema = z.object({
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(30),

    cursor: z
        .string()
        .uuid("Invalid message cursor")
        .optional(),
});

export const messageIdParamSchema = z.object({
    messageId: z.string().uuid("Invalid message ID"),
});

export const conversationIdParamSchema = z.object({
    conversationId: z.string().uuid("Invalid conversation ID"),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;