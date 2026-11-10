
import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import {
  moveTaskParamsSchema,
  moveTaskSchema,
} from "./taskMovementValidation.js";

import { moveTask } from "./taskMovementServices.js";

export const moveTaskController = async (req: Request,res: Response,next: NextFunction) => {

  try {
    const { projectId, taskId } = moveTaskParamsSchema.parse(
      req.params
    );

    const data = moveTaskSchema.parse(req.body);

    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiErrors(401, "Unauthorized");
    }

    const organizationRole = req.organizationMember?.role;
    const memberRole = req.projectMember?.role;

    const canManageAnyTask =
      organizationRole === OrganizationRole.OWNER ||
      organizationRole === OrganizationRole.ADMIN ||
      memberRole === projectRole.OWNER ||
      memberRole === projectRole.ADMIN;

    const result = await moveTask({
      projectId,
      taskId,
      userId,
      canManageAnyTask,
      data,
    });

    res.status(200).json({
      success: true,
      message: "Task moved successfully",
      data: result,
    });
  } 
  catch (error) {
    next(error);
  }
};
