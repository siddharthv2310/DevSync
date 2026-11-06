import { Request, Response } from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import * as projectMemberServices from "./projectMemberServices.js";

import { getProjectMembersSchema, getProjectMembersQuerySchema, addProjectMemberSchema, removeProjectMemberSchema, updateProjectMemberRoleSchema, updateProjectMemberRoleBodySchema, transferProjectOwnershipSchema, } from "./projectMemberValidation.js";

export const getProjectMembersController = async (req: Request, res: Response) => {

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


export const addProjectMemberController = async (req: Request, res: Response) => {

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

    // Validate request body
    const bodyResult = addProjectMemberSchema.safeParse(req.body);

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

    const newMember = await projectMemberServices.addProjectMember(
        organizationId,
        projectId,
        bodyResult.data
    );

    return res.status(201).json({
        success: true,
        message: "Project member added successfully",
        data: newMember,
    });
};



export const removeProjectMemberController = async (req: Request, res: Response) => {

    // Validate URL parameters
    const paramsResult = removeProjectMemberSchema.safeParse(req.params);

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
    const targetUserId = paramsResult.data.userId;
    const requesterUserId = req.user!.userId;

    const result = await projectMemberServices.removeProjectMember(
        organizationId,
        projectId,
        targetUserId,
        requesterUserId
    );

    return res.status(200).json({
        success: true,
        message: "Project member removed successfully",
        data: result,
    });
};


export const leaveProjectController = async (req: Request, res: Response) => {

    const paramsResult = getProjectMembersSchema.safeParse(req.params);

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

    const result = await projectMemberServices.leaveProject(
        organizationId,
        projectId,
        userId
    );

    return res.status(200).json({
        success: true,
        message: "You have successfully left the project",
        data: result,
    });
};


export const updateProjectMemberRoleController = async (req: Request, res: Response) => {

    const paramsResult = updateProjectMemberRoleSchema.safeParse(
        req.params
    );

    if (!paramsResult.success) {
        throw new ApiErrors(
            400,
            paramsResult.error.issues[0]?.message ?? "Invalid request parameters"
        );
    }



    const bodyResult = updateProjectMemberRoleBodySchema.safeParse(
        req.body
    );

    if (!bodyResult.success) {
        throw new ApiErrors(
            400,
            bodyResult.error.issues[0]?.message ?? "Invalid request body"
        );
    }



    //const { userId } = paramsResult.data;
    //const { role } = bodyResult.data;

    const organizationId = req.params.organizationId as string;
    const projectId = req.params.projectId as string;
    const targetUserId = paramsResult.data.userId;
    const requesterUserId = req.user!.userId;
    const newRole = bodyResult.data.role;

    const result = await projectMemberServices.updateProjectMemberRole(
        organizationId,
        projectId,
        targetUserId,
        requesterUserId,
        newRole
    );

    return res.status(200).json({
        success: true,
        message: "Project member role updated successfully",
        data: result,
    });
};


export const transferProjectOwnershipController = async (req: Request,res: Response ) => {
    
    const paramsResult = getProjectMembersSchema.safeParse(req.params);
  
    if (!paramsResult.success) {
        throw new ApiErrors(
          400,
          paramsResult.error.issues[0]?.message ??  "invalid project id"
        );
      }
  
    const bodyResult = transferProjectOwnershipSchema.safeParse(req.body);
  
    if (!bodyResult.success) {
      throw new ApiErrors(
        400,
        bodyResult.error.issues[0]?.message ?? " invalid transferUser id"
      );
    }
  
    const organizationId = req.params.organizationId as string;
    const projectId = paramsResult.data.projectId;
    const currentOwnerId = req.user!.userId;
    const targetUserId = bodyResult.data.targetUserId;
  
    const result =
      await projectMemberServices.transferProjectOwnership(
        organizationId,
        projectId,
        currentOwnerId,
        targetUserId
      );
  
    return res.status(200).json({
      success: true,
      message: "Project ownership transferred successfully",
      data: result,
    });
  };