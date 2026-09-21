import { MessageType } from "@prisma/client";
import { z } from "zod";


export const conversationIdParamSchema = z.object({
    conversationId: z.string().uuid("Invalid conversation ID"),
});


export const messageIdParamSchema = z.object({
    messageId: z.string().uuid("Invalid message ID"),
});


const mentionSchema = z.object({
    userId: z.string().uuid("Invalid mentioned user ID"),
    username: z
        .string()
        .trim()
        .min(1, "Mention username is required"),
});

export const createMessageSchema = z.object({
    
    type: z.nativeEnum(MessageType).default(MessageType.TEXT),

    content: z.string().trim().max(10000).optional(),

    replyToId: z.string().uuid().optional(),

    mentions: z
        .array(
            z.object({
                userId: z.string().uuid(),
                username: z.string().trim().min(1),
            })
        )
        .max(50)
        .optional(),

    attachmentUploadIds: z
        .array(z.string().uuid())
        .max(10)
        .optional(),
})
    .superRefine((data, ctx) => {
        const hasContent = !!data.content?.trim();
        const hasAttachments = !!data.attachmentUploadIds?.length;

        if (!hasContent && !hasAttachments) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Message must contain text or at least one attachment",
                path: ["content"],
            });
        }

        if (data.type === MessageType.SYSTEM) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "SYSTEM messages cannot be created manually",
                path: ["type"],
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