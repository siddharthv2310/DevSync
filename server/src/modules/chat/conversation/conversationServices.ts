import { ConversationType, OrganizationRole, projectRole } from "@prisma/client";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma from "../../../config/prisma.js";
import { Prisma } from "@prisma/client";
import { requireConversationAccess } from "../chatPermissions.js";
import { messageInclude, toMessageResponse } from "../message/messageServices.js";
import { decodeCursor, encodeCursor } from "../../../utils/cursorPagination.js";

export const getConversationWithMembers = async (conversationId: string) => {
    return await prisma.conversation.findUnique({
        where: {
            id: conversationId,
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            }
        }
    });
};

export const getOrCreateOrganizationConversation = async (organizationId: string, userId: string) => {

    const organizationMember = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
        select: {
            id: true,
        },
    });

    if (!organizationMember) {
        throw new ApiErrors(
            403,
            "You are not a member of this organization"
        );
    }

    const existingConversation = await prisma.conversation.findFirst({
        where: {
            organizationId,
            type: ConversationType.ORGANIZATION,
        },
    });

    if (existingConversation) {
        return getConversationWithMembers(existingConversation.id);
    }

    const conversation = await prisma.conversation.create({
        data: {
            type: ConversationType.ORGANIZATION,
            organizationId,
        },
    });

    return getConversationWithMembers(conversation.id);

};

export const getOrCreateTeamConversation = async (organizationId: string, teamId: string, userId: string) => {

    const team = await prisma.team.findUnique({
        where: {
            id: teamId,
            organizationId,
            isActive: true,
        },
        select: {
            id: true,
        },
    });

    if (!team) {
        throw new ApiErrors(404, "Team not found");
    }

    const organizationMember = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
        select: {
            role: true,
        },
    });

    if (organizationMember?.role !== OrganizationRole.OWNER && organizationMember?.role !== OrganizationRole.ADMIN) {

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
            select: {
                id: true,
            },
        });

        if (!teamMember) {
            throw new ApiErrors(403, "You do not have access to this team conversation");
        }
    }

    const existingConversation = await prisma.conversation.findUnique({
        where: {
            teamId,
        },
    });

    if (existingConversation) {
        return getConversationWithMembers(existingConversation.id);
    }

    const conversation = await prisma.conversation.create({
        data: {
            type: ConversationType.TEAM,
            organizationId,
            teamId,
        },
    });

    return getConversationWithMembers(
        conversation.id
    );

}

export const getOrCreateProjectConversation = async (organizationId: string, projectId: string, userId: string) => {

    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
            organizationId,
            isArchieved: false,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        throw new ApiErrors(404, "Project not found");
    }

    const organizationMember =
        await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
            select: {
                role: true,
            },
        });

    if (organizationMember?.role !== OrganizationRole.OWNER && organizationMember?.role !== OrganizationRole.ADMIN) {

        const projectMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
            select: {
                role: true,
            },
        });

        if (
            projectMember?.role !== projectRole.OWNER &&
            projectMember?.role !== projectRole.ADMIN &&
            projectMember?.role !== projectRole.MEMBER
        ) {

            throw new ApiErrors(403, "You do not have access to this project conversation");
        }
    }

    const existingConversation = await prisma.conversation.findUnique({
        where: {
            projectId,
        },
    });

    if (existingConversation) {
        return getConversationWithMembers(
            existingConversation.id
        );
    }

    const conversation = await prisma.conversation.create({
        data: {
            type: ConversationType.PROJECT,
            organizationId,
            projectId,
        },
    });

    return getConversationWithMembers(
        conversation.id
    );

}

const createDirectKey = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join(":");
};

export const getOrCreateDirectConversation = async (userId: string, otherUserId: string) => {
    if (userId === otherUserId) {
        throw new ApiErrors(400, "You cannot create a direct conversation with yourself");
    }

    const otherUser = await prisma.user.findUnique({
        where: {
            id: otherUserId,
        },
        select: {
            id: true,
        },
    });

    if (!otherUser) {
        throw new ApiErrors(404, "User not found");
    }

    const directKey = createDirectKey(userId, otherUserId);

    const existingConversation = await prisma.conversation.findUnique({
        where: {
            directKey,
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            }
        }
    })

    if (existingConversation) {
        return existingConversation;
    }

    try {
        const conversation = await prisma.$transaction(async (tx) => {

            const newConversation = await tx.conversation.create({
                data: {
                    type: ConversationType.DIRECT,
                    directKey,
                },
            });

            await tx.conversationMember.createMany({
                data: [
                    {
                        conversationId: newConversation.id,
                        userId,
                    },
                    {
                        conversationId: newConversation.id,
                        userId: otherUserId,
                    },
                ],
            });

            // here this query will find the unique value othervise it will return error but in findUnique it will return null instead of error
            return tx.conversation.findUniqueOrThrow({
                where: {
                    id: newConversation.id,
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });


        });

        return conversation;

    }
    catch (error) {

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const conversation = await prisma.conversation.findUnique({
                where: {
                    directKey,
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });

            if (conversation) {
                return conversation;
            }
        }

        throw error;

    }

}


export const markConversationAsRead = async (conversationId: string, userId: string, messageId: string) => {

    await requireConversationAccess(conversationId, userId);


    const message = await prisma.message.findFirst({
        where: {
            id: messageId,
            conversationId,
            deletedAt: null,
        },
        select: {
            id: true,
            createdAt: true,
        },
    });

    if (!message) {
        throw new ApiErrors(404, "Message not found in this conversation");
    }

    const currentReadState = await prisma.conversationReadState.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId,
            },
        },
        select: {
            lastReadMessageId: true,
        },
    });

    // 4. If the user already has a read position, make sure we never move it backwards.

    if (currentReadState?.lastReadMessageId) {
        const currentMessage = await prisma.message.findUnique({
            where: {
                id: currentReadState.lastReadMessageId,
            },
            select: {
                createdAt: true,
                id: true,
            },
        });

        if (currentMessage) {
            const isOlder = message.createdAt < currentMessage.createdAt ||
                (
                    message.createdAt.getTime() ===
                    currentMessage.createdAt.getTime() &&
                    message.id < currentMessage.id
                );

            if (isOlder) {
                return;
            }
        }
    }


    await prisma.conversationReadState.upsert({
        where: {
            conversationId_userId: {
                conversationId,
                userId,
            },
        },

        create: {
            conversationId,
            userId,
            lastReadMessageId: message.id,
            lastReadAt: new Date(),
        },

        update: {
            lastReadMessageId: message.id,
            lastReadAt: new Date(),
        },
    });
};


export const getUnreadCount = async (conversationId: string, userId: string): Promise<number> => {

    await requireConversationAccess(conversationId, userId);

    try {
        const readState = await prisma.conversationReadState.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
            select: {
                lastReadMessageId: true,
            },
        });


        if (!readState?.lastReadMessageId) {
            return await prisma.message.count({
                where: {
                    conversationId,
                    deletedAt: null,
                },
            });
        }

        const lastReadMessage = await prisma.message.findUnique({
            where: {
                id: readState.lastReadMessageId,
            },
            select: {
                id: true,
                conversationId: true,
                createdAt: true,
            },
        });

        if (!lastReadMessage || lastReadMessage.conversationId !== conversationId) {
            throw new ApiErrors(500, "Invalid conversation read state");
        }


        return await prisma.message.count({
            where: {
                conversationId,
                deletedAt: null,
                OR: [
                    {
                        createdAt: {
                            gt: lastReadMessage.createdAt,
                        },
                    },
                    {
                        createdAt: lastReadMessage.createdAt,
                        id: {
                            gt: lastReadMessage.id,
                        },
                    },
                ],
            },
        });
    }

    catch (error) {
        throw error;
    }
};


export const getUnreadMessages = async (conversationId: string, userId: string, limit: number = 30, cursor?: string) => {

    await requireConversationAccess(conversationId, userId);

    try {
        const readState = await prisma.conversationReadState.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
            select: {
                lastReadMessageId: true,
            },
        });

        // User has never read this conversation.
        if (!readState?.lastReadMessageId) {
            const messages = await prisma.message.findMany({
                where: {
                    conversationId,
                    deletedAt: null,
                },
                orderBy: [
                    { createdAt: "asc" },
                    { id: "asc" },
                ],
                take: limit + 1,
                include: messageInclude,
            });

            const hasMore = messages.length > limit;

            const pageMessages = hasMore ? messages.slice(0, limit) : messages;

            const lastMessage = pageMessages.at(-1);

            const nextCursor = hasMore && lastMessage ? encodeCursor({
                createdAt: lastMessage.createdAt.toISOString(),
                id: lastMessage.id,
            })
                : null;

            return {
                messages: pageMessages.map(toMessageResponse),
                nextCursor,
                hasMore,
            };
        }

        // Get the message that represents the user's current read position.

        const lastReadMessage = await prisma.message.findUnique({
            where: {
                id: readState.lastReadMessageId,
            },
            select: {
                id: true,
                conversationId: true,
                createdAt: true,
            },
        });

        if (!lastReadMessage || lastReadMessage.conversationId !== conversationId) {

            throw new ApiErrors(500, "Invalid conversation read state");
        }

        let decodedCursor:
            | {
                createdAt: string;
                id: string;
            }
            | undefined;

        if (cursor) {
            decodedCursor = decodeCursor(cursor);
        }

        const unreadCondition: Prisma.MessageWhereInput = {
            conversationId,
            deletedAt: null,
            OR: [
                {
                    createdAt: {
                        gt: lastReadMessage.createdAt,
                    },
                },
                {
                    createdAt: lastReadMessage.createdAt,
                    id: {
                        gt: lastReadMessage.id,
                    },
                },
            ],
        };

        const cursorCondition: Prisma.MessageWhereInput | undefined =
            decodedCursor
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

        const messages = await prisma.message.findMany({
            where: {
                AND: [
                    unreadCondition,
                    ...(cursorCondition
                        ? [cursorCondition]
                        : []),
                ],
            },
            orderBy: [
                { createdAt: "asc" },
                { id: "asc" },
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
                    id: lastMessage.id,
                })
                : null;

        return {
            messages: pageMessages.map(toMessageResponse),
            nextCursor,
            hasMore,
        };
    }
    catch (error) {
        throw error;
    }
};