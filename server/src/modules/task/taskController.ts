import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";

import { createTask, getTaskDetails, getProjectTasks, updateTask, deleteTask, } from "./taskServices.js";

import { taskParamsSchema, createTaskSchema, updateTaskSchema, listTasksQuerySchema, } from "./taskValidator.js";

// CREATE TASK
export const createTaskController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { projectId } = taskParamsSchema.parse(req.params);
        const taskData = createTaskSchema.parse(req.body);

        const task = await createTask(
            projectId,
            req.user?.userId as string,
            taskData
        );

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task,
        });
    }

    catch (error) {
        next(error);
    }
};

// GET TASK DETAILS
export const getTaskDetailsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, taskId } = taskParamsSchema.parse(req.params);

        const task = await getTaskDetails(projectId, taskId!);

        return res.status(200).json({
            success: true,
            message: "Task fetched successfully",
            data: task,
        });
    }

    catch (error) {
        next(error);
    }
};

// GET PROJECT TASKS
export const getProjectTasksController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = taskParamsSchema.parse(req.params);

        const query = listTasksQuerySchema.parse(req.query);

        const result = await getProjectTasks(projectId, query);

        return res.status(200).json({
            success: true,
            message: "Project tasks fetched successfully",
            data: result,
        });
    }

    catch (error) {
        next(error);
    }
};

// UPDATE TASK
export const updateTaskController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, taskId } = taskParamsSchema.parse(req.params);
        const updateData = updateTaskSchema.parse(req.body);

        const organizationRole = req.organizationMember?.role;
        const memberRole = req.projectMember?.role;

        // Organization managers and project OWNER/ADMIN can update any task.
        const canUpdateAnyTask =
            organizationRole === OrganizationRole.OWNER ||
            organizationRole === OrganizationRole.ADMIN ||
            memberRole === projectRole.OWNER ||
            memberRole === projectRole.ADMIN;

        const task = await updateTask(
            projectId,
            taskId!,
            req.user?.userId as string,
            canUpdateAnyTask,
            updateData
        );

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: task,
        });
    }

    catch (error) {
        next(error);
    }
};

// DELETE TASK
export const deleteTaskController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { projectId, taskId } = taskParamsSchema.parse(req.params);

        const result = await deleteTask(projectId, taskId!);

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            data: result,
        });
    }

    catch (error) {
        next(error);
    }
};