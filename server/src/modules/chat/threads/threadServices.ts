import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { requireConversationAccess } from "../chatPermissions.js";
import { MessageListResponse, MessageResponse } from "../message/messgeType.js";
import { decodeCursor, encodeCursor } from "../../../utils/cursorPagination.js";

const messageSenderSelect = {
    id: true,
    name: true,
    username: true,
    avatar: true,
} satisfies Prisma.UserSelect;


const messageInclude = {
    sender: {
        select: messageSenderSelect,
    },
} satisfies Prisma.MessageInclude;


type MessageWithSender = Prisma.MessageGetPayload<{
    include: typeof messageInclude;
}>;


const toMessageResponse = ( message: MessageWithSender): MessageResponse => {

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


 
// export const getThreadRoot = async ( userId: string, messageId: string): Promise<MessageResponse> => {

//     const message = await prisma.message.findUnique({
//         where: {
//             id: messageId,
//         },

//         select: {
//             id: true,
//             conversationId: true,
//             threadRootId: true,
//         },
//     });


//     if (!message) {
//         throw new ApiErrors(404, "Message not found");
//     }


//     await requireConversationAccess( message.conversationId,userId);


//     const rootMessageId = message.threadRootId ?? message.id;


//     const rootMessage = await prisma.message.findUnique({
//         where: {
//             id: rootMessageId,
//         },

//         include: messageInclude,
//     });


//     if (!rootMessage) {
//         throw new ApiErrors( 404, "Thread root message not found");
//     }


//     // Defensive consistency check.
//     // The root must belong to the same conversation as the requested message.
    
//     if ( rootMessage.conversationId !== message.conversationId) {
//         throw new ApiErrors( 500, "Invalid thread relationship");
//     }


//     return toMessageResponse(rootMessage);
// };


export const getThreadReplies = async (userId: string, messageId: string, limit: number, cursor?: string): Promise<MessageListResponse> => {

    // 1. Find requested message

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },

        select: {
            id: true,
            conversationId: true,
            threadRootId: true,
        },
    });


    if (!message) {
        throw new ApiErrors(404, "Message not found" );
    }


    // 2. Authorization

    await requireConversationAccess( message.conversationId, userId);


    // 3. Determine thread root

    const threadRootId = message.threadRootId ?? message.id;


    // 4. Decode cursor

    let decodedCursor:
        | {
            createdAt: string;
            id: string;
        }
        | undefined;


    if (cursor) {
        decodedCursor = decodeCursor(cursor);
    }


    // 5. Build keyset pagination condition

    const cursorCondition:
        | Prisma.MessageWhereInput
        | undefined = decodedCursor
            ? {
                OR: [
                    {
                        createdAt: {
                            gt: new Date(
                                decodedCursor.createdAt
                            ),
                        },
                    },
                    {
                        createdAt: new Date(
                            decodedCursor.createdAt
                        ),

                        id: {
                            gt: decodedCursor.id,
                        },
                    },
                ],
            }
            : undefined;


    // 6. Fetch messages

    const messages = await prisma.message.findMany({
        where: {
            threadRootId,

            ...(cursorCondition
                ? cursorCondition
                : {}),
        },

        orderBy: [
            {
                createdAt: "asc",
            },
            {
                id: "asc",
            },
        ],

        take: limit + 1,

        include: messageInclude,
    });


    // 7. Determine pagination

    const hasMore = messages.length > limit;


    const pageMessages = hasMore
        ? messages.slice(0, limit)
        : messages;



    // 8. Generate next cursor


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


    // 9. Return response

    return {
        messages: pageMessages.map( toMessageResponse ),

        nextCursor,

        hasMore,
    };
};