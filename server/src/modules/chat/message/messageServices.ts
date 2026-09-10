import { MessageType, Prisma,} from "@prisma/client";

import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { canModerateConversationMessage, requireConversationAccess } from "../chatPermissions.js";
import { MessageListResponse, MessageResponse } from "./messgeType.js";
import { CreateMessageInput, GetMessagesQuery, UpdateMessageInput } from "./messageValidation.js";
import { decodeCursor, encodeCursor } from "../../../utils/cursorPagination.js";




//Only expose the User fields that are safe and useful for the chat response.
 
const messageSenderSelect = {
    id: true,
    name: true,
    username: true,
    avatar: true,
} satisfies Prisma.UserSelect;



// Common include used whenever we return a message.
const messageInclude = {
    sender: {
        select: messageSenderSelect,
    },
} satisfies Prisma.MessageInclude;


/*
 * Convert Prisma's Message object into our public API response.
 */
const toMessageResponse = (message: Prisma.MessageGetPayload<{ include: typeof messageInclude;}>): MessageResponse => {
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
    };
};


/**
 * Create a new message.
 */
export const createMessage = async (userId: string,conversationId:string,input: CreateMessageInput): Promise<MessageResponse> => {

    const { type, content,replyToId,} = input;

    await requireConversationAccess(conversationId,userId);
    
    // 2. System messages are server-generated

    if (type === MessageType.SYSTEM) {
        throw new ApiErrors(400,"System messages cannot be created directly");
    }


    // 3. Validate text content

    if ( type === MessageType.TEXT && !content?.trim()) {
        throw new ApiErrors(400, "Text message content is required");
    }


    // 4. Determine thread root

    let threadRootId: string;

    if (replyToId) {

        const replyMessage = await prisma.message.findUnique({
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
            throw new ApiErrors(404,"Reply message not found");
        }

        // Reply must belong to the same conversation

        if ( replyMessage.conversationId !== conversationId) {
            throw new ApiErrors( 400,"Cannot reply to a message from another conversation");
        }


        // Cannot reply to deleted message

        if (replyMessage.deletedAt) {
            throw new ApiErrors( 400, "Cannot reply to a deleted message");
        }


        
         // If the target is already part of a thread, inherit that thread's root.
         // Otherwise the target itself is the root.
       
        threadRootId = replyMessage.threadRootId ?? replyMessage.id;

    } 
    else {

        // This is a root message.
        // We generate its ID ourselves so that the same ID can be used as both:
        // id = message ID
        // threadRootId = thread root ID

        threadRootId = crypto.randomUUID();
    }

    // 5. Generate message ID
    // if message is reply message then the message id shiuld be different to the reply message Id and 
    // if not reply message then both should be same 

    const messageId = replyToId ? crypto.randomUUID() : threadRootId;


    // 6. Create message

    const message = await prisma.message.create({
        data: {
            id: messageId,

            conversationId,

            senderId: userId,

            type,

            content: content?.trim() || null,

            replyToId: replyToId ?? null,

            threadRootId,
        },

        include: messageInclude,
    });


    return toMessageResponse(message);
};

 
export const getMessages = async (userId: string,conversationId: string,query: GetMessagesQuery): Promise<MessageListResponse> => {

    await requireConversationAccess(conversationId,userId);


    const { limit, cursor,} = query;


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
export const getMessageById = async ( userId: string,  messageId: string): Promise<MessageResponse> => {

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },

        include: messageInclude,
    });


    if (!message) {
        throw new ApiErrors( 404, "Message not found");
    }


    await requireConversationAccess(message.conversationId,userId);


    return toMessageResponse(message);
};


// Edit a message.
// Only the original sender can edit their message.
export const updateMessage = async (userId: string,messageId: string,input: UpdateMessageInput): Promise<MessageResponse> => {

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
        throw new ApiErrors( 404, "Message not found");
    }


    // 1. User must have conversation access

    await requireConversationAccess( message.conversationId, userId);


    // 2. Only sender can edit

    if (message.senderId !== userId) {
        throw new ApiErrors( 403, "You can only edit your own messages");
    }


    // 3. Deleted messages cannot be edited

    if (message.deletedAt) {
        throw new ApiErrors( 400, "Deleted messages cannot be edited");
    }


    // 4. Only text messages can currently be edited

    if (message.type !== MessageType.TEXT) {
        throw new ApiErrors( 400, "Only text messages can be edited");
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


    return toMessageResponse(updatedMessage);
};


export const deleteMessage = async ( userId: string, messageId: string): Promise<void> => {

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
        throw new ApiErrors( 404, "Message not found");
    }


    // 2. Verify conversation access

    await requireConversationAccess(message.conversationId,userId);

    // 3. Already deleted

    if (message.deletedAt) {
        throw new ApiErrors(400, "Message is already deleted")
    }


    const isSender =  message.senderId === userId;


    if (!isSender) {

        const canModerate = await canModerateConversationMessage( message.conversationId, userId);


        if (!canModerate) {
            throw new ApiErrors(403,"You do not have permission to delete this message" );
        }
    }


    // 6. Soft delete

    await prisma.message.update({
        where: {
            id: messageId,
        },

        data: {
            deletedAt: new Date(),
            deletedById: userId,
        },
    });
};


