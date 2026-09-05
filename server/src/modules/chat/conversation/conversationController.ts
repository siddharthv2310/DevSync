import { Request, Response, NextFunction } from "express";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import * as conversationServices from "./conversationServices.js";
import { requireConversationAccess } from "../chatPermissions.js";
import { conversationSchema, directConversationSchema, organizationConversationSchema, projectConversationSchema, teamConversationSchema } from "./conversationValidation.js";

export const createOrganizationConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const { organizationId } = organizationConversationSchema.parse(req.params);

        const conversation = conversationServices.getOrCreateOrganizationConversation(organizationId, userId);

        return res.status(200).json({
            status: true,
            message: "Organization conversation retrieved successfully",
            data: conversation,
        })

    }
    catch (error) {
        next(error);
    }
}
export const createTeamConversation = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const { organizationId, teamId } = teamConversationSchema.parse(req.params);


        const conversation = await conversationServices.getOrCreateTeamConversation(organizationId,teamId,userId);

        return res.status(200).json({
            success: true,
            message: "Team conversation retrieved successfully",
            data: conversation,
        });

    }
    catch (error) {
        next(error);
    }
}

export const createProjectConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const { organizationId, projectId } = projectConversationSchema.parse(req.params);

        const conversation = await conversationServices.getOrCreateProjectConversation(organizationId, projectId, userId);

        return res.status(200).json({
            success: true,
            message: "Project conversation retrieved successfully",
            data: conversation,
        });

    }
    catch (error) {
        next(error);
    }
};

export const createDirectConversation = async (req: Request,res: Response,next: NextFunction) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }

        const { otherUserId } = directConversationSchema.parse(req.body);

        const conversation = await conversationServices.getOrCreateDirectConversation(userId,otherUserId);

        return res.status(200).json({
            success: true,
            message: "Direct conversation retrieved successfully",
            data: conversation,
        });

    } 
    catch (error) {
        next(error);
    }
};

export const getConversation = async (req: Request,res: Response,next: NextFunction) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }

        const { conversationId } = conversationSchema.parse(req.params);

        await requireConversationAccess( conversationId, userId );

        const conversation = await conversationServices.getConversationWithMembers( conversationId );

        if (!conversation) {
            throw new ApiErrors( 404, "Conversation not found" );
        }

        return res.status(200).json({
            success: true,
            message: "Conversation retrieved successfully",
            data: conversation,
        });

    } 
    catch (error) {
        next(error);
    }
};