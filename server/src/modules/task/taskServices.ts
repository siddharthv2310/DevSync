import { BoardColumnCategory, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { CreateTaskInput, ListTasksQuery, UpdateTaskInput, } from "./taskValidator.js";

// Common response structure for task APIs.
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


// Keep the API response consistent by flattening label assignments.
const formatTask = <T extends { labels: { label: unknown }[] }>(
    task: T
) => ({
    ...task,
    labels: task.labels.map((item) => item.label),
});

// CREATE TASK
export const createTask = async (projectId: string, userId: string, taskData: CreateTaskInput) => {

    return prisma.$transaction(async (tx) => {
        // Ensure the selected column belongs to this project.
        const column = await tx.boardColumn.findFirst({
            where: {
                id: taskData.columnId,
                projectId,
            },
            select: { id: true },
        });

        if (!column) {
            throw new ApiErrors(404, "Board column not found in this project");
        }

        // Place the new task at the end of the selected column.
        const lastTask = await tx.task.aggregate({
            where: {
                projectId,
                columnId: taskData.columnId,
                parentTaskId: null,
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

        return formatTask(task);
    });
};

// GET TASK DETAILS
export const getTaskDetails = async (projectId: string, taskId: string) => {

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

    return formatTask(task);
};

// GET ALL PROJECT TASKS
export const getProjectTasks = async (projectId: string, query: ListTasksQuery) => {

    const { page, limit, search, priority, status, assigneeId, columnId, startDateFrom, startDateTo, dueDateFrom,
        dueDateTo, overdue, sortBy, sortOrder, } = query;

    const skip = (page - 1) * limit;

    const filters: Prisma.TaskWhereInput[] = [];

    // Search task title and description.
    if (search) {
        filters.push({
            OR: [
                {
                    title: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ],
        });
    }

    // Priority filter.
    if (priority) {
        filters.push({ priority });
    }

    // Status filter: status comes from BoardColumn.category.
    if (status) {
        filters.push({
            column: {
                is: {
                    category: status,
                },
            },
        });
    }

    // Column filter.
    if (columnId) {
        filters.push({ columnId });
    }

    // Assignee filter.
    if (assigneeId) {
        filters.push({
            assignees: {
                some: {
                    userId: assigneeId,
                },
            },
        });
    }

    // Start date range.
    if (startDateFrom || startDateTo) {
        filters.push({
            startDate: {
                ...(startDateFrom && { gte: startDateFrom }),
                ...(startDateTo && { lte: startDateTo }),
            },
        });
    }

    // Due date range.
    if (dueDateFrom || dueDateTo) {
        filters.push({
            dueDate: {
                ...(dueDateFrom && { gte: dueDateFrom }),
                ...(dueDateTo && { lte: dueDateTo }),
            },
        });
    }

    // Overdue tasks: due date has passed and task is not completed.
    if (overdue === true) {
        filters.push({
            dueDate: {
                lt: new Date(),
            },
            column: {
                is: {
                    category: {
                        not: BoardColumnCategory.COMPLETED,
                    },
                },
            },
        });
    }

    const where: Prisma.TaskWhereInput = {
        projectId,
        parentTaskId: null,
        ...(filters.length > 0 && {
            AND: filters,
        }),
    };

    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [
        { [sortBy]: sortOrder },
        { id: "asc" },
    ];

    const [tasks, total] = await prisma.$transaction([
        prisma.task.findMany({
            where,
            skip,
            take: limit,
            select: taskSelect,
            orderBy,
        }),

        prisma.task.count({ where }),
    ]);

    return {
        tasks: tasks.map(formatTask),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// UPDATE TASK
export const updateTask = async (projectId: string, taskId: string, userId: string, canUpdateAnyTask: boolean, updateData: UpdateTaskInput) => {

    return prisma.$transaction(async (tx) => {
        const existingTask = await tx.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
            select: {
                id: true,
                createdById: true,
                startDate: true,
                dueDate: true,
                assignees: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!existingTask) {
            throw new ApiErrors(404, "Task not found");
        }

        // OWNER/ADMIN can update any task.
        // MEMBER can update only tasks they created or are assigned to.
        if (!canUpdateAnyTask) {
            const isCreator = existingTask.createdById === userId;

            const isAssignee = existingTask.assignees.some(
                (assignee) => assignee.userId === userId
            );

            if (!isCreator && !isAssignee) {
                throw new ApiErrors(
                    403,
                    "You can only update tasks you created or are assigned to"
                );
            }
        }

        // Validate the final date range, including unchanged existing values.
        const startDate =
            updateData.startDate !== undefined
                ? updateData.startDate
                : existingTask.startDate;

        const dueDate =
            updateData.dueDate !== undefined
                ? updateData.dueDate
                : existingTask.dueDate;

        if (startDate && dueDate && startDate > dueDate) {
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
            where: { id: existingTask.id },
            data,
            select: taskSelect,
        });

        return formatTask(updatedTask);
    });
};

// DELETE TASK
export const deleteTask = async (projectId: string, taskId: string) => {
    return prisma.$transaction(async (tx) => {
        const task = await tx.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
            select: {
                id: true,
                attachments: {
                    select: { storageKey: true },
                },
                attachmentUploads: {
                    select: { storageKey: true },
                },
            },
        });

        if (!task) {
            throw new ApiErrors(404, "Task not found");
        }

        // Queue S3 cleanup instead of deleting objects inside the API request.
        const storageKeys = [
            ...new Set([
                ...task.attachments.map((item) => item.storageKey),
                ...task.attachmentUploads.map((item) => item.storageKey),
            ]),
        ];

        if (storageKeys.length > 0) {
            await tx.storageDeletionJob.createMany({
                data: storageKeys.map((storageKey) => ({ storageKey })),
                skipDuplicates: true,
            });
        }

        await tx.task.delete({
            where: { id: task.id },
        });

        return {
            id: task.id,
            deleted: true,
        };
    });
};