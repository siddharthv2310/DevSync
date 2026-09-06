import { MessageType } from "@prisma/client";
import { z } from "zod";


export const conversationIdParamSchema = z.object({
    conversationId: z.string().uuid("Invalid conversation ID"),
});


export const messageIdParamSchema = z.object({
    messageId: z.string().uuid("Invalid message ID"),
});


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

    /*
     * TEXT messages must contain content.
     */
    if (
        data.type === MessageType.TEXT &&
        !data.content
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["content"],
            message: "Text message content is required",
        });
    }

    /*
     * SYSTEM messages must never be created through
     * the normal user message endpoint.
     */
    if (data.type === MessageType.SYSTEM) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["type"],
            message: "System messages cannot be created directly",
        });
    }

});


export const updateMessageSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Message content cannot be empty")
        .max(10000, "Message content cannot exceed 10000 characters"),
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


export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;