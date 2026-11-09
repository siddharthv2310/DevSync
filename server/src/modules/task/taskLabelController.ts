import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";

import { createTaskLabel, getProjectTaskLabels, updateTaskLabel, deleteTaskLabel, assignLabelToTask, removeLabelFromTask, } from "./taskLabelServices.js";

import { taskLabelParamsSchema, createTaskLabelSchema, updateTaskLabelSchema, assignTaskLabelSchema, } from "./taskValidator.js";

const canManageAnyTask = (req: Request): boolean => {
    return (
        req.organizationMember?.role === OrganizationRole.OWNER ||
        req.organizationMember?.role === OrganizationRole.ADMIN ||
        req.projectMember?.role === projectRole.OWNER ||
        req.projectMember?.role === projectRole.ADMIN
    );
};

// CREATE LABEL
export const createTaskLabelController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { projectId } = taskLabelParamsSchema.parse(req.params);
        const data = createTaskLabelSchema.parse(req.body);

        const label = await createTaskLabel(projectId, data);

        return res.status(201).json({
            success: true,
            message: "Task label created successfully",
            data: label,
        });
    }
    catch (error) {
        next(error);
    }
};

// GET PROJECT LABELS
export const getProjectTaskLabelsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = taskLabelParamsSchema.parse(req.params);

        const labels = await getProjectTaskLabels(projectId);

        return res.status(200).json({
            success: true,
            message: "Task labels fetched successfully",
            data: labels,
        });
    }
    catch (error) {
        next(error);
    }
};

// UPDATE LABEL
export const updateTaskLabelController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, labelId } =
            taskLabelParamsSchema.parse(req.params);

        const data = updateTaskLabelSchema.parse(req.body);

        const label = await updateTaskLabel(projectId, labelId!, data);

        return res.status(200).json({
            success: true,
            message: "Task label updated successfully",
            data: label,
        });
    }
    catch (error) {
        next(error);
    }
};

// DELETE LABEL
export const deleteTaskLabelController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, labelId } =
            taskLabelParamsSchema.parse(req.params);

        const result = await deleteTaskLabel(projectId, labelId!);

        return res.status(200).json({
            success: true,
            message: "Task label deleted successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};

// ASSIGN LABEL TO TASK
export const assignLabelToTaskController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, taskId } =
            taskLabelParamsSchema.parse(req.params);

        const { labelId } = assignTaskLabelSchema.parse(req.body);

        const result = await assignLabelToTask(
            projectId,
            taskId!,
            labelId,
            req.user?.userId as string,
            canManageAnyTask(req)
        );

        return res.status(201).json({
            success: true,
            message: "Label assigned to task successfully",
            data: result,
        });
    }

    catch (error) {
        next(error);
    }
};

// REMOVE LABEL FROM TASK
export const removeLabelFromTaskController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, taskId, labelId } =
            taskLabelParamsSchema.parse(req.params);

        const result = await removeLabelFromTask(
            projectId,
            taskId!,
            labelId!,
            req.user?.userId as string,
            canManageAnyTask(req)
        );

        return res.status(200).json({
            success: true,
            message: "Label removed from task successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};