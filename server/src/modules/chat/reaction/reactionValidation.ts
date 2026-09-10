import { z } from "zod";

export const messageIdParamSchema = z.object({
    messageId: z.string().uuid("Invalid message ID"),
});

export const reactionSchema = z.object({
    emoji: z
        .string()
        .trim()
        .min(1, "Emoji is required")
        .max(20, "Emoji is too long"),
});

export const reactionEmojiParamSchema = z.object({
    messageId: z.string().uuid("Invalid message ID"),
    emoji: z.string().min(1, "Emoji is required"),
});

//type

export type ReactionInput = z.infer<typeof reactionSchema>;