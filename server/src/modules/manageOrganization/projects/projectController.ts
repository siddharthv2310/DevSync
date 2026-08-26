import { Request, Response, NextFunction } from "express";
import * as projectServices from "./projectServices.js";
import { createProjectSchema, getProjectsQuerySchema } from "./projectValidator.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

export const createProjectController = async (req: Request, res: Response) => {
    const result = createProjectSchema.safeParse(req.body);

    if (!result.success) {
        throw new ApiErrors(404, "invalid data process");
    }

    const organizationId = req.params.organizationId as string;

    const userId = req.user!.userId;

    const project = await projectServices.createProject(organizationId, userId, result.data);

    return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project
    });

};

export const getOrganizationProjectsController = async (res: Response, req: Request) => {
    const result = getProjectsQuerySchema.safeParse(req.query);
    if (!result.success) {
        throw new ApiErrors(400, "Invalid project query parameters");
    }

    const organizationId = req.params.organizationId as string;

    const resultData = await projectServices.getOrganizationProjects(organizationId, result.data.page, result.data.limit, result.data.search, result.data.includeArchived);

    return res.status(200).json({
        success: true,
        message: "Projects fetched successfully",
        data: resultData.projects,
        pagination: resultData.pagination,
    })
}

export const getProjectDetailsController = async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;

    const project = await projectServices.getProjectDetails(projectId);

    return res.status(200).json({
        success: true,
        message: "Project fetched successfully",
        data: project
    });
};
