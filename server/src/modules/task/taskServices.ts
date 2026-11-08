import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

import { CreateTaskInput, UpdateTaskInput, } from "./taskValidator.js";

// Common task response fields
const taskSelect = {
    id: true,
    projectId: true,
    columnId: true,

    title: true,
    description: true,
    priority: true,

    startDate: true,
    dueDate: true,
    estimateMinutes: true,

    position: true,

    parentTaskId: true,

    createdAt: true,
    updatedAt: true,

    createdBy: {
        select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
        },
    },

    column: {
        select: {
            id: true,
            name: true,
            category: true,
        },
    },

    assignees: {
        select: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                },
            },
            assignedAt: true,
        },
    },

    labels: {
        select: {
            label: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                },
            },
        },
    },
} satisfies Prisma.TaskSelect;


// CREATE TASK

export const createTask = async ( projectId: string, userId: string, taskData: CreateTaskInput ) => {

    return prisma.$transaction(async (tx) => {

        // Verify that the column belongs to this project
        const column = await tx.boardColumn.findFirst({
            where: {
                id: taskData.columnId,
                projectId,
            },
            select: {
                id: true,
            },
        });

        if (!column) {
            throw new ApiErrors(
                404,
                "Board column not found in this project"
            );
        }

        // Calculate the next position in the column
        const lastTask = await tx.task.aggregate({
            where: {
                projectId,
                columnId: taskData.columnId,
            },
            _max: {
                position: true,
            },
        });

        const nextPosition = (lastTask._max.position ?? -1) + 1;

        const task = await tx.task.create({
            data: {
                projectId,
                columnId: taskData.columnId,

                title: taskData.title,
                description: taskData.description ?? null,

                priority: taskData.priority ?? "MEDIUM",

                startDate: taskData.startDate ?? null,
                dueDate: taskData.dueDate ?? null,

                estimateMinutes: taskData.estimateMinutes ?? null,

                position: nextPosition,

                createdById: userId,
            },
            select: taskSelect,
        });

        return task;
    });
};


// ==========================================
// 2. GET TASK DETAILS
// ==========================================

export const getTaskDetails = async (projectId: string,taskId: string ) => {

    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: taskSelect,
    });

    if (!task) {
        throw new ApiErrors(404, "Task not found");
    }

    return {
        ...task,

        labels: task.labels.map(
            (item) => item.label
        ),
    };
};


// ==========================================
// 3. GET PROJECT TASKS
// ==========================================

export const getProjectTasks = async (
    projectId: string,
    page: number,
    limit: number
) => {

    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
        projectId,
        parentTaskId: null,
    };

    const [tasks, total] = await prisma.$transaction([

        prisma.task.findMany({
            where,
            skip,
            take: limit,

            select: taskSelect,

            orderBy: [
                {
                    createdAt: "desc",
                },
                {
                    id: "asc",
                },
            ],
        }),

        prisma.task.count({
            where,
        }),

    ]);

    return {
        tasks: tasks.map((task) => ({
            ...task,
            labels: task.labels.map(
                (item) => item.label
            ),
        })),

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};


// ==========================================
// 4. UPDATE TASK
// ==========================================

export const updateTask = async (
    projectId: string,
    taskId: string,
    updateData: UpdateTaskInput
) => {

    return prisma.$transaction(async (tx) => {

        const existingTask = await tx.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
            select: {
                id: true,
                startDate: true,
                dueDate: true,
            },
        });

        if (!existingTask) {
            throw new ApiErrors(404, "Task not found");
        }

        // Validate dates using the existing values when
        // only one date is being updated.
        const startDate =
            updateData.startDate !== undefined
                ? updateData.startDate
                : existingTask.startDate;

        const dueDate =
            updateData.dueDate !== undefined
                ? updateData.dueDate
                : existingTask.dueDate;

        if (
            startDate &&
            dueDate &&
            startDate > dueDate
        ) {
            throw new ApiErrors(
                400,
                "Start date cannot be after due date"
            );
        }

        const data: Prisma.TaskUpdateInput = {
            ...(updateData.title !== undefined && {
                title: updateData.title,
            }),

            ...(updateData.description !== undefined && {
                description: updateData.description,
            }),

            ...(updateData.priority !== undefined && {
                priority: updateData.priority,
            }),

            ...(updateData.startDate !== undefined && {
                startDate: updateData.startDate,
            }),

            ...(updateData.dueDate !== undefined && {
                dueDate: updateData.dueDate,
            }),

            ...(updateData.estimateMinutes !== undefined && {
                estimateMinutes: updateData.estimateMinutes,
            }),
        };

        const updatedTask = await tx.task.update({
            where: {
                id: existingTask.id,
            },
            data,
            select: taskSelect,
        });

        return {
            ...updatedTask,

            labels: updatedTask.labels.map(
                (item) => item.label
            ),
        };
    });
};


// ==========================================
// 5. DELETE TASK
// ==========================================

export const deleteTask = async (
    projectId: string,
    taskId: string
) => {

    return prisma.$transaction(async (tx) => {

        const task = await tx.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
            select: {
                id: true,

                attachments: {
                    select: {
                        storageKey: true,
                    },
                },

                attachmentUploads: {
                    select: {
                        storageKey: true,
                    },
                },
            },
        });

        if (!task) {
            throw new ApiErrors(404, "Task not found");
        }

        // Collect permanent and temporary S3 object keys
        const storageKeys = [
            ...new Set([
                ...task.attachments.map(
                    (attachment) => attachment.storageKey
                ),

                ...task.attachmentUploads.map(
                    (upload) => upload.storageKey
                ),
            ]),
        ];

        // Queue S3 cleanup before deleting database records
        if (storageKeys.length > 0) {
            await tx.storageDeletionJob.createMany({
                data: storageKeys.map((storageKey) => ({
                    storageKey,
                })),
                skipDuplicates: true,
            });
        }

        // Related database records are deleted through
        // configured Prisma/database cascade relations.
        await tx.task.delete({
            where: {
                id: task.id,
            },
        });

        return {
            id: task.id,
            deleted: true,
        };
    });
};