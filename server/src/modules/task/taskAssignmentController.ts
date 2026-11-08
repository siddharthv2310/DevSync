import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";

import { assignUserToTask, removeUserFromTask, getTaskAssignees, } from "./taskAssignmentServices.js";

import { taskAssigneeParamsSchema,assignTaskUserSchema, } from "./taskValidator.js";

const canManageAnyTask = (req: Request): boolean => {
    return (
        req.organizationMember?.role === OrganizationRole.OWNER ||
        req.organizationMember?.role === OrganizationRole.ADMIN ||
        req.projectMember?.role === projectRole.OWNER ||
        req.projectMember?.role === projectRole.ADMIN
    );
};

// ASSIGN USER
export const assignUserToTaskController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { projectId, taskId } = taskAssigneeParamsSchema.parse(req.params);

        const { userId } = assignTaskUserSchema.parse(req.body);

        const assignment = await assignUserToTask(
            projectId,
            taskId,
            userId,
            req.user?.userId as string,
            canManageAnyTask(req)
        );

        return res.status(201).json({
            success: true,
            message: "User assigned to task successfully",
            data: assignment,
        });
    }

    catch (error) {
        next(error);
    }
};

// REMOVE USER
export const removeUserFromTaskController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { projectId, taskId, userId } = taskAssigneeParamsSchema.parse(req.params);

        const result = await removeUserFromTask(
            projectId,
            taskId,
            userId!,
            req.user?.userId as string,
            canManageAnyTask(req)
        );

        return res.status(200).json({
            success: true,
            message: "User removed from task successfully",
            data: result,
        });
    }

    catch (error) {
        next(error);
    }
};

// GET ASSIGNEES
export const getTaskAssigneesController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { projectId, taskId } =
            taskAssigneeParamsSchema.parse(req.params);

        const assignees = await getTaskAssignees(projectId, taskId);

        return res.status(200).json({
            success: true,
            message: "Task assignees fetched successfully",
            data: assignees,
        });
    }

    catch (error) {
        next(error);
    }
};