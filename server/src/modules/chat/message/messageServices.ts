import { ConversationType, MessageType, OrganizationRole, Prisma, projectRole, TeamRole,} from "@prisma/client";

import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { requireConversationAccess } from "../chatPermissions.js";
import { MessageListResponse, MessageResponse } from "./messgeType.js";
import { CreateMessageInput, GetMessagesQuery, UpdateMessageInput } from "./messageValidation.js";




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
export const createMessage = async (userId: string,conversationId: string, input: CreateMessageInput): Promise<MessageResponse> => {

    const {type,content,replyToId} = input;



    // 1. Verify that the user can access the conversation

    await requireConversationAccess(conversationId,userId);


    // 2. System messages cannot be created by this endpoint

    if (type === MessageType.SYSTEM) {
        throw new ApiErrors(400,"System messages cannot be created directly");
    }


    // 3. Validate message content


    if (type === MessageType.TEXT &&!content?.trim())
    {
        throw new ApiErrors( 400,"Text message content is required");
    }


    // 4. Validate reply message

    if (replyToId) {

        const replyMessage = await prisma.message.findUnique({
            where: {
                id: replyToId,
            },

            select: {
                id: true,
                conversationId: true,
                deletedAt: true,
            },
        });


        if (!replyMessage) {
            throw new ApiErrors(404,"Reply message not found");
        }


         // A message can only reply to another message in the same conversation.
         
        if (replyMessage.conversationId !== conversationId)
        {
            throw new ApiErrors( 400, "Cannot reply to a message from another conversation");
        }


        
        //We don't allow replying to a deleted message.
        
        if (replyMessage.deletedAt) {
            throw new ApiErrors(400,"Cannot reply to a deleted message");
        }
    }


    // 5. Create message

    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId: userId,
            type,
            content: content?.trim() || null,
            replyToId: replyToId ?? null,
        },

        include: messageInclude,
    });


    return toMessageResponse(message);
};


//Get messages from a conversation.
//Newest messages are returned first.
 
export const getMessages = async ( userId: string, conversationId: string, query: GetMessagesQuery): Promise<MessageListResponse> => {

    // 1. Authorization


    await requireConversationAccess( conversationId,userId );


    const {limit,cursor,} = query;


    // 2. Fetch one extra message

    const messages = await prisma.message.findMany({
        where: {
            conversationId,
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

        ...(cursor
            ? {
                cursor: {
                    id: cursor,
                },

                skip: 1,
            }
            : {}),

        include: messageInclude,
    });


    // 3. Determine whether another page exists

    const hasMore = messages.length > limit;

    const pageMessages = hasMore
        ? messages.slice(0, limit)
        : messages;


    const nextCursor = hasMore
        ? pageMessages.at(-1)?.id ?? null
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


 // Determine whether a user has moderator-level authority over a particular conversation.

const canModerateConversationMessage = async (conversationId: string,userId: string): Promise<boolean> => {

    const conversation = await prisma.conversation.findUnique({
        where: {
            id: conversationId,
        },

        select: {
            type: true,
            organizationId: true,
            teamId: true,
            projectId: true,
        },
    });


    if (!conversation) {
        throw new ApiErrors( 404, "Conversation not found");
    }


    // ORGANIZATION CHAT

    if ( conversation.type === ConversationType.ORGANIZATION) {

        if (!conversation.organizationId) {
            throw new ApiErrors( 500, "Invalid organization conversation");
        }


        const membership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: conversation.organizationId,
                        userId,
                    },
                },
                select: {
                    role: true,
                },
            });


        return ( membership?.role === OrganizationRole.OWNER ||  membership?.role === OrganizationRole.ADMIN);
    }


    // TEAM CHAT

    if ( conversation.type === ConversationType.TEAM ) {

        if (!conversation.teamId) {
            throw new ApiErrors( 500, "Invalid team conversation" );
        }

        const team = await prisma.team.findUnique({
            where: {
                id: conversation.teamId,
            },

            select: {
                organizationId: true,
            },
        });


        if (!team) {
            throw new ApiErrors( 404, "Team not found");
        }


        // Organization OWNER / ADMIN
        const organizationMembership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId:
                            team.organizationId,
                        userId,
                    },
                },

                select: {
                    role: true,
                },
            });


        if (organizationMembership?.role === OrganizationRole.OWNER ||  organizationMembership?.role === OrganizationRole.ADMIN ) 
        {
            return true;
        }


        // Team OWNER / ADMIN
        const teamMembership = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId: conversation.teamId,
                        userId,
                    },
                },

                select: {
                    role: true,
                },
            });


        return ( teamMembership?.role === TeamRole.OWNER ||  teamMembership?.role === TeamRole.ADMIN);
    }


    // PROJECT CHAT

    if ( conversation.type === ConversationType.PROJECT) 
    {

        if (!conversation.projectId) {
            throw new ApiErrors( 500, "Invalid project conversation");
        }


        const project = await prisma.project.findUnique({
            where: {
                id: conversation.projectId,
            },

            select: {
                organizationId: true,
            },
        });


        if (!project) {
            throw new ApiErrors( 404, "Project not found");
        }


        // Organization OWNER / ADMIN
        const organizationMembership =  await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId:
                            project.organizationId,
                        userId,
                    },
                },

                select: {
                    role: true,
                },
            });

            if (organizationMembership?.role === OrganizationRole.OWNER ||  organizationMembership?.role === OrganizationRole.ADMIN ) 
                {
                    return true;
                }


        // Project OWNER / ADMIN
        const projectMembership = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId: conversation.projectId,
                        userId,
                    },
                },

                select: {
                    role: true,
                },
            });


        return ( projectMembership?.role === projectRole.OWNER || projectMembership?.role === projectRole.ADMIN );
    }


    // DIRECT CHAT

    return false;
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