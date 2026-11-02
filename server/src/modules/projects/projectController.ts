
import { Request, Response } from "express";
import * as projectServices from "./projectServices.js";
import {createProjectSchema,getProjectsQuerySchema,} from "./projectValidator.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

// Create project
export const createProjectController = async ( req: Request, res: Response) => {

  const result = createProjectSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiErrors(
      400,
      result.error.issues.map((issue) => issue.message).join(", ")
    );
  }

  const organizationId = req.params.organizationId as string;
  const userId = req.user!.userId;

  const project = await projectServices.createProject(
    organizationId,
    userId,
    result.data
  );

  return res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
};

// Get organization projects
export const getOrganizationProjectsController = async (req: Request,res: Response) => {

  const result = getProjectsQuerySchema.safeParse(req.query);

  if (!result.success) {
    throw new ApiErrors(
      400,
      result.error.issues.map((issue) => issue.message).join(", ")
    );
  }

  const organizationId = req.params.organizationId as string;

  const resultData = await projectServices.getOrganizationProjects(
    organizationId,
    result.data.page,
    result.data.limit,
    result.data.search,
    result.data.includeArchived
  );

  return res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: resultData.projects,
    pagination: resultData.pagination,
  });
};

// Get project details
export const getProjectDetailsController = async ( req: Request, res: Response) => {
    
  const projectId = req.params.projectId as string;

  const project = await projectServices.getProjectDetails(projectId);

  return res.status(200).json({
    success: true,
    message: "Project fetched successfully",
    data: project,
  });
};
