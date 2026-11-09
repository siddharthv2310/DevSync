import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import {CreateTaskCommentInput, UpdateTaskCommentInput, ListTaskCommentsQuery,} from "./taskCommentValidation.js";


const commentSelect = {
    id: true,
    taskId: true,
    authorId: true,
    content: true,
    isEdited: true,
    editedAt: true,
    createdAt: true,
    updatedAt: true,

    author: {
        select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
        },
    },

    mentions: {
        select: {
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
} satisfies Prisma.TaskCommentSelect;


// Validate task belongs to the project
const validateTask = async (tx: Prisma.TransactionClient,projectId: string,taskId: string) => {

    const task = await tx.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: {
            id: true,
        },
    });

    if (!task) {
        throw new ApiErrors(404, "Task not found");
    }

    return task;
};


// Validate mentioned users are project members
const validateMentions = async (tx: Prisma.TransactionClient,projectId: string,mentionedUserIds: string[]) => {

    const uniqueIds = [...new Set(mentionedUserIds)];

    if (uniqueIds.length !== mentionedUserIds.length) {
        throw new ApiErrors(400, "Duplicate mentioned users are not allowed");
    }

    if (uniqueIds.length === 0) {
        return [];
    }

    const members = await tx.projectMember.findMany({
        where: {
            projectId,
            userId: {
                in: uniqueIds,
            },
        },
        select: {
            userId: true,
        },
    });

    if (members.length !== uniqueIds.length) {
        throw new ApiErrors(
            400,
            "One or more mentioned users are not project members"
        );
    }

    return uniqueIds;
};


// CREATE COMMENT
export const createTaskComment = async (projectId: string,taskId: string,userId: string,input: CreateTaskCommentInput) => {

    return prisma.$transaction(async (tx) => {

        await validateTask(tx, projectId, taskId);

        const mentionedUserIds = await validateMentions(
            tx,
            projectId,
            input.mentionedUserIds
        );

        return tx.taskComment.create({
            data: {
                taskId,
                authorId: userId,
                content: input.content,

                mentions: {
                    create: mentionedUserIds.map((mentionedUserId) => ({
                        userId: mentionedUserId,
                    })),
                },
            },
            select: commentSelect,
        });
    });
};


// GET PAGINATED COMMENTS
export const getTaskComments = async (projectId: string,taskId: string,query: ListTaskCommentsQuery) => {

    await validateTask(prisma, projectId, taskId);

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [comments, total] = await prisma.$transaction([
        prisma.taskComment.findMany({
            where: {
                taskId,
            },
            select: commentSelect,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),

        prisma.taskComment.count({
            where: {
                taskId,
            },
        }),
    ]);

    return {
        comments,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};


// UPDATE COMMENT
export const updateTaskComment = async (
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
    canManageAnyComment: boolean,
    input: UpdateTaskCommentInput
) => {

    return prisma.$transaction(async (tx) => {

        await validateTask(tx, projectId, taskId);

        const comment = await tx.taskComment.findFirst({
            where: {
                id: commentId,
                taskId,
            },
            select: {
                id: true,
                authorId: true,
            },
        });

        if (!comment) {
            throw new ApiErrors(404, "Comment not found");
        }

        if (!canManageAnyComment && comment.authorId !== userId) {
            throw new ApiErrors(
                403,
                "You can only edit your own comments"
            );
        }

        return tx.taskComment.update({
            where: {
                id: commentId,
            },
            data: {
                content: input.content,
                isEdited: true,
                editedAt: new Date(),
            },
            select: commentSelect,
        });
    });
};


// DELETE COMMENT
export const deleteTaskComment = async (
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
    canManageAnyComment: boolean
) => {

    return prisma.$transaction(async (tx) => {

        await validateTask(tx, projectId, taskId);

        const comment = await tx.taskComment.findFirst({
            where: {
                id: commentId,
                taskId,
            },
            select: {
                id: true,
                authorId: true,
            },
        });

        if (!comment) {
            throw new ApiErrors(404, "Comment not found");
        }

        if (!canManageAnyComment && comment.authorId !== userId) {
            throw new ApiErrors(
                403,
                "You can only delete your own comments"
            );
        }

        await tx.taskComment.delete({
            where: {
                id: commentId,
            },
        });

        return {
            commentId,
        };
    });
};