import { MessageType, Prisma, } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { canModerateConversationMessage, requireConversationAccess, validateMentionedUsers } from "../chatPermissions.js";
import { MessageListResponse, MessageResponse } from "./messgeType.js";
import { CreateMessageInput, GetMessagesQuery, UpdateMessageInput } from "./messageValidation.js";
import { decodeCursor, encodeCursor } from "../../../utils/cursorPagination.js";
import { publishEvent } from "../../../realtime/redis/redisPubSub.js";
import { REALTIME_CHANNELS } from "../../../realtime/socketEvents.js";
import { MarkMessagesAsReadInput } from "./messageValidation.js";




//Only expose the User fields that are safe and useful for the chat response.

export const messageSenderSelect = {
    id: true,
    name: true,
    username: true,
    avatar: true,
} satisfies Prisma.UserSelect;



// Common include used whenever we return a message.
export const messageInclude = {
    sender: {
        select: messageSenderSelect,
    },

    mentions: {
        select: {
            id: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                },
            },
        },
    },

    attachments: {
        select: {
            id: true,
            originalName: true,
            storageKey: true,
            mimeType: true,
            sizeBytes: true,
            url: true,
            thumbnailUrl: true,
            createdAt: true,
        },
    },
} satisfies Prisma.MessageInclude;


/*
 * Convert Prisma's Message object into our public API response.
 */
export const toMessageResponse = (message: Prisma.MessageGetPayload<{ include: typeof messageInclude; }>): MessageResponse => {
    return {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,

        type: message.type,
        content: message.content,

        replyToId: message.replyToId,

        isEdited: message.isEdited,
        editedAt: message.editedAt,

        deletedAt: message.deletedAt,
        deletedById: message.deletedById,

        pinnedAt: message.pinnedAt,
        pinnedById: message.pinnedById,

        createdAt: message.createdAt,
        updatedAt: message.updatedAt,

        sender: message.sender,
        mentions: message.mentions,

        attachments: message.attachments,

        threadRootId: message.threadRootId,
    };
};


export const createMessage = async (userId: string, conversationId: string, input: CreateMessageInput): Promise<MessageResponse> => {

    const { type, content, replyToId, mentions, attachmentUploadIds, } = input;


    // 1. Check conversation access
    await requireConversationAccess(conversationId, userId);

    // 2. System messages are server-generated
    if (type === MessageType.SYSTEM) {
        throw new ApiErrors(
            400,
            "System messages cannot be created directly"
        );
    }


    const uniqueAttachmentUploadIds = [...new Set(attachmentUploadIds ?? []),];

    // 3. Validate text and file content
    const hasContent = !!content?.trim();
    const hasAttachments = uniqueAttachmentUploadIds.length > 0;

    if (!hasContent && !hasAttachments) {
        throw new ApiErrors(
            400,
            "Message must contain text or at least one attachment"
        );
    }

    // determine the type of message 
    const messageType = !hasContent && hasAttachments ? MessageType.FILE : type;

    // 4. Remove duplicate mentions
    const uniqueMentions = Array.from(
        new Map(
            (mentions ?? []).map((mention) => [
                mention.userId,
                mention,
            ])
        ).values()
    );

    // 5. Validate mentioned users
    if (uniqueMentions.length > 0) {
        await validateMentionedUsers(
            conversationId,
            content?.trim() ?? "",
            uniqueMentions
        );
    }

    // 6. Determine thread root
    let threadRootId: string | null = null;
    const messageId = crypto.randomUUID();

    if (replyToId) {

        const replyMessage =
            await prisma.message.findUnique({
                where: {
                    id: replyToId,
                },
                select: {
                    id: true,
                    conversationId: true,
                    threadRootId: true,
                    deletedAt: true,
                },
            });

        if (!replyMessage) {
            throw new ApiErrors(
                404,
                "Reply message not found"
            );
        }

        // Reply must belong to the same conversation
        if (replyMessage.conversationId !== conversationId) {
            throw new ApiErrors(
                400,
                "Cannot reply to a message from another conversation"
            );
        }

        // Cannot reply to deleted message
        if (replyMessage.deletedAt) {
            throw new ApiErrors(
                400,
                "Cannot reply to a deleted message"
            );
        }

        // Inherit thread root
        threadRootId = replyMessage.threadRootId ?? replyMessage.id;

    } else {

        // Root message
        threadRootId = messageId;
    }


    // this is next part 

    const message = await prisma.$transaction(async (tx) => {

        const attachmentUploads =
            uniqueAttachmentUploadIds.length > 0
                ? await tx.attachmentUpload.findMany({
                    where: {
                        id: {
                            in: uniqueAttachmentUploadIds,
                        },
                        userId,
                        conversationId,
                        status: "COMPLETED",
                    },
                })
                : [];

        if (
            attachmentUploads.length !==
            uniqueAttachmentUploadIds.length
        ) {
            throw new ApiErrors(
                400,
                "One or more attachments are invalid or not completed"
            );
        }

        await tx.message.create({
            data: {
                id: messageId,
                conversationId,
                senderId: userId,
                type: messageType,
                content: content?.trim() || null,
                replyToId: replyToId ?? null,
                threadRootId,

                attachments: {
                    createMany: {
                        data: attachmentUploads.map((upload) => ({
                            uploadedById: upload.userId,
                            originalName: upload.originalName,
                            storageKey: upload.storageKey,
                            mimeType: upload.mimeType,
                            sizeBytes: upload.sizeBytes,
                        })),
                    },
                },
            },
        });

        if (uniqueMentions.length > 0) {
            await tx.messageMention.createMany({
                data: uniqueMentions.map((mention) => ({
                    messageId,
                    userId: mention.userId,
                })),
            });
        }

        if (uniqueAttachmentUploadIds.length > 0) {
            const result = await tx.attachmentUpload.updateMany({
                where: {
                    id: {
                        in: uniqueAttachmentUploadIds,
                    },
                    userId,
                    conversationId,
                    status: "COMPLETED",
                },
                data: {
                    status: "CONSUMED",
                    consumedAt: new Date(),
                },
            });

            if (
                result.count !==
                uniqueAttachmentUploadIds.length
            ) {
                throw new ApiErrors(
                    409,
                    "One or more attachments have already been used"
                );
            }
        }

        return tx.message.findUniqueOrThrow({
            where: {
                id: messageId,
            },
            include: messageInclude,
        });
    });



    try {
        await publishEvent(
            REALTIME_CHANNELS.MESSAGE_CREATED,
            {
                conversationId,
                message: toMessageResponse(message),
            }
        );
    }
    catch (error) {
        console.error(
            "Failed to publish message realtime event:",
            error
        );
    }

    if (replyToId && message.threadRootId) {
        try {
            await publishEvent(REALTIME_CHANNELS.THREAD_REPLY_CREATED,
                {
                    conversationId,
                    threadRootId: message.threadRootId,
                    message: toMessageResponse(message),
                }
            );
        }
        catch (error) {
            console.error(
                "Failed to publish thread-reply-created event:",
                error
            );
        }
    }


    return toMessageResponse(message);
};


export const getMessages = async (userId: string, conversationId: string, query: GetMessagesQuery): Promise<MessageListResponse> => {

    await requireConversationAccess(conversationId, userId);


    const { limit, cursor, } = query;


    let decodedCursor:
        | {
            createdAt: string;
            id: string;
        }
        | undefined;


    if (cursor) {
        decodedCursor = decodeCursor(cursor);
    }


    const cursorCondition:
        | Prisma.MessageWhereInput
        | undefined = decodedCursor
            ? {
                OR: [
                    {
                        createdAt: {
                            lt: new Date(
                                decodedCursor.createdAt
                            ),
                        },
                    },
                    {
                        createdAt: new Date(
                            decodedCursor.createdAt
                        ),

                        id: {
                            lt: decodedCursor.id,
                        },
                    },
                ],
            }
            : undefined;


    const messages = await prisma.message.findMany({
        where: {
            conversationId,

            ...(cursorCondition
                ? cursorCondition
                : {}),
        },

        orderBy: [
            {
                createdAt: "desc",
            },
            {
                id: "desc",
            },
        ],

        take: limit + 1,

        include: messageInclude,
    });


    const hasMore = messages.length > limit;

    const pageMessages = hasMore
        ? messages.slice(0, limit)
        : messages;


    const lastMessage = pageMessages.at(-1);


    const nextCursor =
        hasMore && lastMessage
            ? encodeCursor({
                createdAt:
                    lastMessage.createdAt.toISOString(),

                id:
                    lastMessage.id,
            })
            : null;


    return {
        messages: pageMessages.map(toMessageResponse),

        nextCursor,

        hasMore,
    };
};


//Get one message.
export const getMessageById = async (userId: string, messageId: string): Promise<MessageResponse> => {

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },

        include: messageInclude,
    });


    if (!message) {
        throw new ApiErrors(404, "Message not found");
    }


    await requireConversationAccess(message.conversationId, userId);


    return toMessageResponse(message);
};


// Edit a message.
// Only the original sender can edit their message.
export const updateMessage = async (userId: string, messageId: string, input: UpdateMessageInput): Promise<MessageResponse> => {

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },

        select: {
            id: true,
            conversationId: true,
            senderId: true,
            type: true,
            deletedAt: true,
        },
    });


    if (!message) {
        throw new ApiErrors(404, "Message not found");
    }


    // 1. User must have conversation access

    await requireConversationAccess(message.conversationId, userId);


    // 2. Only sender can edit

    if (message.senderId !== userId) {
        throw new ApiErrors(403, "You can only edit your own messages");
    }


    // 3. Deleted messages cannot be edited

    if (message.deletedAt) {
        throw new ApiErrors(400, "Deleted messages cannot be edited");
    }


    // 4. Only text messages can currently be edited

    if (message.type !== MessageType.TEXT) {
        throw new ApiErrors(400, "Only text messages can be edited");
    }


    // 5. Update

    const updatedMessage = await prisma.message.update({
        where: {
            id: messageId,
        },

        data: {
            content: input.content.trim(),
            isEdited: true,
            editedAt: new Date(),
        },

        include: messageInclude,
    });


    const response = toMessageResponse(updatedMessage);

    try {
        await publishEvent(REALTIME_CHANNELS.MESSAGE_UPDATED, {
            conversationId: message.conversationId,
            message: response,
        });
    }
    catch (error) {
        console.error(
            "Failed to publish message-updated event:",
            error
        );
    }

    return response;
};


export const deleteMessage = async (userId: string, messageId: string): Promise<void> => {

    // 1. Find message

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },

        select: {
            id: true,
            conversationId: true,
            senderId: true,
            deletedAt: true,
        },
    });


    if (!message) {
        throw new ApiErrors(404, "Message not found");
    }


    // 2. Verify conversation access

    await requireConversationAccess(message.conversationId, userId);

    // 3. Already deleted

    if (message.deletedAt) {
        throw new ApiErrors(400, "Message is already deleted")
    }


    const isSender = message.senderId === userId;


    if (!isSender) {

        const canModerate = await canModerateConversationMessage(message.conversationId, userId);


        if (!canModerate) {
            throw new ApiErrors(403, "You do not have permission to delete this message");
        }
    }


    // 6. Soft delete

    const deletedAt = new Date();

    await prisma.message.update({
        where: {
            id: messageId,
        },
        data: {
            deletedAt,
            deletedById: userId,
        },
    });

    try {
        await publishEvent(REALTIME_CHANNELS.MESSAGE_DELETED, {
            conversationId: message.conversationId,
            messageId: message.id,
            deletedAt,
            deletedById: userId,
        });
    }
    catch (error) {
        console.error(
            "Failed to publish message-deleted event:",
            error
        );
    }
};


// mark message as read 

export const markMessagesAsRead = async ( userId: string,conversationId: string,input: MarkMessagesAsReadInput ) => {
    await requireConversationAccess(conversationId, userId);

    const { messageIds } = input;

    // Validate that every requested message belongs to this conversation.
    const messages = await prisma.message.findMany({
        where: {
            id: { in: messageIds },
            conversationId,
        },
        select: {
            id: true,
            senderId: true,
            deletedAt: true,
        },
    });

    if (messages.length !== messageIds.length) {
        throw new ApiErrors(404,"One or more messages were not found in this conversation");
    }

    // Users should not create read receipts for their own messages.
    const eligibleMessageIds = messages.filter( (message) =>
            message.senderId !== userId &&
            message.deletedAt === null
        )
        .map((message) => message.id);

    if (eligibleMessageIds.length === 0) {
        return {
            markedCount: 0,
            messageIds: [],
        };
    }

    // Find existing receipts so we can publish only newly observed reads.
    const existingReads = await prisma.messageRead.findMany({
        where: {
            userId,
            messageId: { in: eligibleMessageIds },
        },
        select: {
            messageId: true,
        },
    });

    const existingMessageIds = new Set(
        existingReads.map((read) => read.messageId)
    );

    const result = await prisma.messageRead.createMany({
        data: eligibleMessageIds.map((messageId) => ({
            messageId,
            userId,
        })),
        skipDuplicates: true,
    });

    const newlyReadMessageIds = eligibleMessageIds.filter(
        (messageId) => !existingMessageIds.has(messageId)
    );

    if (newlyReadMessageIds.length > 0) {
        try {
            await publishEvent(REALTIME_CHANNELS.MESSAGE_READ, {
                conversationId,
                messageIds: newlyReadMessageIds,
                userId,
                readAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error(
                "Failed to publish message-read event:",
                error
            );
        }
    }

    return {
        markedCount: result.count,
        messageIds: eligibleMessageIds,
    };
};

export const getMessageReadReceipts = async (userId: string,messageId: string) => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
            id: true,
            conversationId: true,
        },
    });

    if (!message) {
        throw new ApiErrors(404, "Message not found");
    }

    await requireConversationAccess( message.conversationId, userId);

    const receipts = await prisma.messageRead.findMany({
        where: {
            messageId,
        },
        select: {
            userId: true,
            readAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            readAt: "asc",
        },
    });

    return {
        messageId: message.id,
        conversationId: message.conversationId,
        readers: receipts.map((receipt) => ({
            userId: receipt.userId,
            readAt: receipt.readAt,
            user: receipt.user,
        })),
        readerCount: receipts.length,
    };
};

export const pinMessage = async (
    userId: string,
    messageId: string
  ): Promise<MessageResponse> => {
  
    // 1. Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        pinnedAt: true,
        deletedAt: true,
      },
    });
  
    if (!message) {
      throw new ApiErrors(404, "Message not found");
    }
  
    // 2. Verify conversation access
    await requireConversationAccess(message.conversationId, userId);
  
    // 3. Deleted messages cannot be pinned
    if (message.deletedAt) {
      throw new ApiErrors(400, "Deleted messages cannot be pinned");
    }
  
    // 4. Prevent duplicate pinning
    if (message.pinnedAt) {
      throw new ApiErrors(409, "Message is already pinned");
    }
  
    // 5. Atomic update to protect against concurrent requests
    const result = await prisma.message.updateMany({
      where: {
        id: messageId,
        pinnedAt: null,
        deletedAt: null,
      },
      data: {
        pinnedAt: new Date(),
        pinnedById: userId,
      },
    });
  
    if (result.count === 0) {
      throw new ApiErrors(409, "Message could not be pinned. It may have changed.");
    }
  
    // 6. Fetch updated message
    const updatedMessage = await prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: messageInclude,
    });
  
    return toMessageResponse(updatedMessage);
  };