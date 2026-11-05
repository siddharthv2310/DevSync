
import { Request, Response } from "express";
import * as projectServices from "./projectServices.js";
import {createProjectSchema,getProjectsQuerySchema, projectIdParamSchema, updateProjectSchema,} from "./projectValidator.js";
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



export const updateProjectController = async (req: Request,res: Response ) => {
    
    // Validate project ID
    const paramsResult = projectIdParamSchema.safeParse(req.params);
  
    if (!paramsResult.success) {
      throw new ApiErrors(
        400,
        paramsResult.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    // Validate request body
    const bodyResult = updateProjectSchema.safeParse(req.body);
  
    if (!bodyResult.success) {
      throw new ApiErrors(
        400,
        bodyResult.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    const organizationId = req.params.organizationId as string;
    const projectId = paramsResult.data.projectId;
  
    const project = await projectServices.updateProject(
      organizationId,
      projectId,
      bodyResult.data
    );
  
    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  };
  


export const archiveProjectController = async ( req: Request, res: Response ) => {

    const paramsResult = projectIdParamSchema.safeParse(req.params);
  
    if (!paramsResult.success) {
      throw new ApiErrors(
        400,
        paramsResult.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    const organizationId = req.params.organizationId as string;
    const projectId = paramsResult.data.projectId;
  
    const project = await projectServices.archiveProject(
      organizationId,
      projectId
    );
  
    return res.status(200).json({
      success: true,
      message: "Project archived successfully",
      data: project,
    });
  };
  


export const restoreProjectController = async ( req: Request, res: Response ) => {

    const paramsResult = projectIdParamSchema.safeParse(req.params);
  
    if (!paramsResult.success) {
      throw new ApiErrors(
        400,
        paramsResult.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    const organizationId = req.params.organizationId as string;
    const projectId = paramsResult.data.projectId;
  
    const project = await projectServices.restoreProject(
      organizationId,
      projectId
    );
  
    return res.status(200).json({
      success: true,
      message: "Project restored successfully",
      data: project,
    });
  };



export const deleteProjectController = async (req: Request,res: Response ) => {
    
    const paramsResult = projectIdParamSchema.safeParse(req.params);
  
    if (!paramsResult.success) {
      throw new ApiErrors(
        400,
        paramsResult.error.issues
          .map((issue) => issue.message)
          .join(", ")
      );
    }
  
    const organizationId = req.params.organizationId as string;
    const projectId = paramsResult.data.projectId;
    const userId = req.user!.userId;
  
    const result = await projectServices.deleteProject(
      organizationId,
      projectId,
      userId
    );
  
    return res.status(200).json({
      success: true,
      message: "Project permanently deleted successfully",
      data: result,
    });
  };
  
  