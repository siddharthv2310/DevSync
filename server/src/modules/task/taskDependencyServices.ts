import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

const checkTaskAccess = async (
    tx: Prisma.TransactionClient,
    projectId: string,
    taskId: string,
    userId: string,
    canManageAnyTask: boolean
) => {
    const task = await tx.task.findFirst({
        where: { id: taskId, projectId },
        select: {
            id: true,
            createdById: true,
            assignees: {
                select: { userId: true },
            },
        },
    });

    if (!task) {
        throw new ApiErrors(404, "Task not found");
    }

    if (canManageAnyTask) return;

    const isCreator = task.createdById === userId;
    const isAssignee = task.assignees.some(
        (assignee) => assignee.userId === userId
    );

    if (!isCreator && !isAssignee) {
        throw new ApiErrors(
            403,
            "You can only manage dependencies on tasks you created or are assigned to"
        );
    }
};

// Check whether a path exists from startTaskId to targetTaskId.
// Edges follow the direction: blocking task -> blocked task.

const hasDependencyPath = async (tx: Prisma.TransactionClient, startTaskId: string, targetTaskId: string): Promise<boolean> => {

    const visited = new Set<string>([startTaskId]);
    let frontier = [startTaskId];

    while (frontier.length > 0) {
        const edges = await tx.taskDependency.findMany({
            where: {
                blockingTaskId: {
                    in: frontier,
                },
            },
            select: {
                blockedTaskId: true,
            },
        });

        const nextFrontier: string[] = [];

        for (const edge of edges) {
            if (edge.blockedTaskId === targetTaskId) {
                return true;
            }

            if (!visited.has(edge.blockedTaskId)) {
                visited.add(edge.blockedTaskId);
                nextFrontier.push(edge.blockedTaskId);
            }
        }

        frontier = nextFrontier;
    }

    return false;
};

// CREATE DEPENDENCY
// blockingTaskId must be completed before taskId can proceed.

export const createTaskDependency = async (
    projectId: string,
    taskId: string,
    blockingTaskId: string,
    userId: string,
    canManageAnyTask: boolean
) => {
    if (taskId === blockingTaskId) {
        throw new ApiErrors(400, "A task cannot depend on itself");
    }

    return prisma.$transaction(
        async (tx) => {
            // Both tasks must belong to this project.
            await checkTaskAccess(
                tx,
                projectId,
                taskId,
                userId,
                canManageAnyTask
            );

            await checkTaskAccess(
                tx,
                projectId,
                blockingTaskId,
                userId,
                canManageAnyTask
            );

            // Check whether this dependency already exists.
            const existing = await tx.taskDependency.findUnique({
                where: {
                    blockingTaskId_blockedTaskId: {
                        blockingTaskId,
                        blockedTaskId: taskId,
                    },
                },
            });

            if (existing) {
                throw new ApiErrors(409, "This dependency already exists");
            }

            // Adding blockingTaskId -> taskId would create a cycle
            // if taskId already has a path back to blockingTaskId.

            const createsCycle = await hasDependencyPath(tx,taskId, blockingTaskId );

            if (createsCycle) {
                throw new ApiErrors(
                    400,
                    "This dependency would create a circular dependency"
                );
            }

            return tx.taskDependency.create({
                data: {
                    blockingTaskId,
                    blockedTaskId: taskId,
                },
                select: {
                    id: true,
                    createdAt: true,
                    blockingTask: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    blockedTask: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });
        },
        {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
    );
};

// GET TASK DEPENDENCIES
export const getTaskDependencies = async (
    projectId: string,
    taskId: string
) => {
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: { id: true },
    });

    if (!task) {
        throw new ApiErrors(404, "Task not found");
    }

    const [blockedBy, blocking] = await Promise.all([
        // Tasks that must be completed before this task.
        prisma.taskDependency.findMany({
            where: {
                blockedTaskId: taskId,
            },
            select: {
                id: true,
                createdAt: true,
                blockingTask: {
                    select: {
                        id: true,
                        title: true,
                        priority: true,
                        column: {
                            select: {
                                name: true,
                                category: true,
                            },
                        },
                    },
                },
            },
        }),

        // Tasks that this task is blocking.
        prisma.taskDependency.findMany({
            where: {
                blockingTaskId: taskId,
            },
            select: {
                id: true,
                createdAt: true,
                blockedTask: {
                    select: {
                        id: true,
                        title: true,
                        priority: true,
                        column: {
                            select: {
                                name: true,
                                category: true,
                            },
                        },
                    },
                },
            },
        }),
    ]);

    return {
        blockedBy,
        blocking,
    };
};

// REMOVE DEPENDENCY
export const removeTaskDependency = async (
    projectId: string,
    taskId: string,
    blockingTaskId: string,
    userId: string,
    canManageAnyTask: boolean
) => {
    return prisma.$transaction(async (tx) => {
        await checkTaskAccess(
            tx,
            projectId,
            taskId,
            userId,
            canManageAnyTask
        );

        await checkTaskAccess(
            tx,
            projectId,
            blockingTaskId,
            userId,
            canManageAnyTask
        );

        const dependency = await tx.taskDependency.findUnique({
            where: {
                blockingTaskId_blockedTaskId: {
                    blockingTaskId,
                    blockedTaskId: taskId,
                },
            },
            select: { id: true },
        });

        if (!dependency) {
            throw new ApiErrors(404, "Dependency not found");
        }

        await tx.taskDependency.delete({
            where: { id: dependency.id },
        });

        return {
            id: dependency.id,
            removed: true,
        };
    });
};