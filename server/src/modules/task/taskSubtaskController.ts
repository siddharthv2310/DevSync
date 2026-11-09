import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";

import {createSubtask,getTaskSubtasks,} from "./taskSubtaskServices.js";

import {subtaskParamsSchema,createSubtaskSchema, } from "./taskValidator.js";

const canManageAnyTask = (req: Request): boolean => {
  return (
    req.organizationMember?.role === OrganizationRole.OWNER ||
    req.organizationMember?.role === OrganizationRole.ADMIN ||
    req.projectMember?.role === projectRole.OWNER ||
    req.projectMember?.role === projectRole.ADMIN
  );
};


export const createSubtaskController = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const { projectId, taskId } =
      subtaskParamsSchema.parse(req.params);

    const data = createSubtaskSchema.parse(req.body);

    const subtask = await createSubtask(
      projectId,
      taskId,
      req.user?.userId as string,
      canManageAnyTask(req),
      data
    );

    return res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: subtask,
    });
  } 
  
  catch (error) {
    next(error);
  }
};

// GET SUBTASKS
export const getTaskSubtasksController = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const { projectId, taskId } =
      subtaskParamsSchema.parse(req.params);

    const subtasks = await getTaskSubtasks(projectId, taskId);

    return res.status(200).json({
      success: true,
      message: "Subtasks fetched successfully",
      data: subtasks,
    });
  } 
  
  catch (error) {
    next(error);
  }
};