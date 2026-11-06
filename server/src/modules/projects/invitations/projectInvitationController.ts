import { NextFunction, Request, Response } from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import * as projectInvitationServices from "./projectInvitationServices.js";

import { acceptProjectInvitationSchema, CreateProjectInvitationInput, createProjectInvitationSchema, getProjectInvitationsQuerySchema, } from "./projectInvitationValidation.js";

import { getProjectMembersSchema } from "../members/projectMemberValidation.js";
import { acceptProjectInvitation, cancelProjectInvitation } from "./projectInvitationServices.js";
import { ProjectInvitationStatus } from "@prisma/client";
import { getMyProjectInvitations } from "../../user/invitations/userInvitationServices.js";

export const createProjectInvitationController = async (req: Request, res: Response) => {
    const bodyResult = createProjectInvitationSchema.safeParse(req.body);

    if (!bodyResult.success) {
        throw new ApiErrors(
            400,
            bodyResult.error.issues[0]?.message ?? "invalid invitation request"
        );
    }

    const invitationData: CreateProjectInvitationInput = bodyResult.data;
    const organizationId = req.params.organizationId as string;
    const projectId = req.params.projectId as string;
    const invitedById = req.user!.userId;

    const result = await projectInvitationServices.createProjectInvitation(
        organizationId,
        projectId,
        invitedById,
        invitationData
    );

    // Email delivery will be integrated using your existing
    // email service. Never return the raw invitation token here.

    return res.status(201).json({
        success: true,
        message: "Project invitation created successfully",
        data: result.invitation,
    });
};


export const getProjectInvitationsController = async (req: Request, res: Response) => {

    const paramsResult = getProjectMembersSchema.safeParse(req.params);

    if (!paramsResult.success) {
        throw new ApiErrors(
            400,
            paramsResult.error.issues[0]?.message ?? "invalid getProjectMember request"
        );
    }

    const queryResult = getProjectInvitationsQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
        throw new ApiErrors(
            400,
            queryResult.error.issues[0]?.message ?? "invalid getProjectMember query "
        );
    }

    const projectId = paramsResult.data.projectId;

    const result = await projectInvitationServices.getProjectInvitations(projectId, queryResult.data);

    return res.status(200).json({
        success: true,
        message: "Project invitations fetched successfully",
        data: result.invitations,
        pagination: result.pagination,
    });
};



export const acceptProjectInvitationController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { token } = acceptProjectInvitationSchema.parse(req.body);

        const userId = req.user?.userId as string;

        const result = await acceptProjectInvitation(userId, token);

        res.status(200).json({
            success: true,
            message: result.message,
            membership: result.membership,
        });
    }

    catch (error) {
        next(error);
    }
};

import { rejectProjectInvitation } from "./projectInvitationServices.js";
import { rejectProjectInvitationSchema } from "./projectInvitationValidation.js";

export const rejectProjectInvitationController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { token } = rejectProjectInvitationSchema.parse(req.body);

        const userId = req.user?.userId as string;

        const result = await rejectProjectInvitation(userId, token);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        next(error);
    }
};


export const cancelProjectInvitationController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = req.params.projectId as string;
        const invitationId = req.params.invitationId as string;

        const result = await cancelProjectInvitation(
            projectId,
            invitationId
        );

        res.status(200).json({
            success: true,
            message: result.message,
        });
    }

    catch (error) {
        next(error);
    }
};