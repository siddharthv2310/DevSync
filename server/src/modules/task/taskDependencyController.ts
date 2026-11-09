import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";

import { createTaskDependency, getTaskDependencies, removeTaskDependency, } from "./taskDependencyServices.js";

import { taskParamsSchema, taskDependencyParamsSchema, createTaskDependencySchema, } from "./taskValidator.js";

const canManageAnyTask = (req: Request): boolean => {
    return (
        req.organizationMember?.role === OrganizationRole.OWNER ||
        req.organizationMember?.role === OrganizationRole.ADMIN ||
        req.projectMember?.role === projectRole.OWNER ||
        req.projectMember?.role === projectRole.ADMIN
    );
};


export const createTaskDependencyController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, taskId } = taskParamsSchema.parse(req.params);

        const { blockingTaskId } =
            createTaskDependencySchema.parse(req.body);

        const dependency = await createTaskDependency(
            projectId,
            taskId!,
            blockingTaskId,
            req.user?.userId as string,
            canManageAnyTask(req)
        );

        return res.status(201).json({
            success: true,
            message: "Task dependency created successfully",
            data: dependency,
        });
    }

    catch (error) {
        next(error);
    }
};

// GET DEPENDENCIES
export const getTaskDependenciesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, taskId } = taskParamsSchema.parse(req.params);

        const dependencies = await getTaskDependencies(projectId, taskId!);

        return res.status(200).json({
            success: true,
            message: "Task dependencies fetched successfully",
            data: dependencies,
        });
    }

    catch (error) {
        next(error);
    }
};

// REMOVE DEPENDENCY
export const removeTaskDependencyController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, taskId, blockingTaskId } =
            taskDependencyParamsSchema.parse(req.params);

        const result = await removeTaskDependency(
            projectId,
            taskId,
            blockingTaskId,
            req.user?.userId as string,
            canManageAnyTask(req)
        );

        return res.status(200).json({
            success: true,
            message: "Task dependency removed successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};