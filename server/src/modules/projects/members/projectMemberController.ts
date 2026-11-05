import { Request, Response } from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import * as projectMemberServices from "./projectMemberServices.js";

import {getProjectMembersSchema,getProjectMembersQuerySchema, } from "./projectMemberValidation.js";

export const getProjectMembersController = async (req: Request,res: Response ) => {
    
  // Validate project ID
  const paramsResult = getProjectMembersSchema.safeParse(req.params);

  if (!paramsResult.success) {
    throw new ApiErrors(
      400,
      paramsResult.error.issues
        .map((issue) => issue.message)
        .join(", ")
    );
  }

  // Validate query parameters
  const queryResult = getProjectMembersQuerySchema.safeParse(req.query);

  if (!queryResult.success) {
    throw new ApiErrors(
      400,
      queryResult.error.issues
        .map((issue) => issue.message)
        .join(", ")
    );
  }

  const projectId = paramsResult.data.projectId;

  const result = await projectMemberServices.getProjectMembers(
    projectId,
    queryResult.data
  );

  return res.status(200).json({
    success: true,
    message: "Project members fetched successfully",
    data: result.members,
    pagination: result.pagination,
  });
};