import { NextFunction, Request, Response } from "express";

import * as invitationService from "./invitationServices.js";
import { acceptInvitationSchema, createInvitationSchema } from "./invitationValidation.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

export const createInvitation = async (
    req: Request,
    res: Response
) => {

    const organizationId = req.organization!.id;

    const invitedById = req.user!.userId;

    const data = createInvitationSchema.parse(req.body);

    await invitationService.createInvitation(organizationId,invitedById,data.email, data.role);

    return res.status(201).json({
        success: true,
        message: "Invitation sent successfully"
    });

};

export const acceptInvitation = async ( req: Request, res: Response) => {
    const data = acceptInvitationSchema.safeParse(req.body);

    if(!data.success){
        throw new ApiErrors(400, "Invalid invitation data");
    }

    const userId = req.user!.userId;

    const result = await invitationService.acceptInvitation( data.data.token,userId);

    return res.status(200).json({
        success: true,
        message: "Invitation accepted successfully",
        data: result
    });
};

export const getOrganizationInvitations = async (req: Request,res: Response) => {

    const organizationId = req.organization!.id;

    const invitations = await invitationService.getOrganizationInvitations(organizationId);

    return res.status(200).json({
        success: true,
        message: "Invitations fetched successfully",
        data: invitations
    });

};


export const rejectInvitationController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors( 401, "Authentication required");
        }

        const result = acceptInvitationSchema.safeParse( req.body)

        if (!result.success) {
            throw new ApiErrors(400,"Invalid invitation data");
        }

        const invitation = await invitationService.rejectInvitation(userId,result.data.token);

        return res.status(200).json({
            success: true,
            message: "Team invitation rejected successfully",
            data: invitation
        });

    } 
    catch (error) {
        next(error);
    }
};  

export const cancelInvitation = async (req: Request,res: Response) => {

    const organizationId = req.organization!.id;

    const actorRole = req.organizationMember!.role;

    const  invitationId  = req.params.invitationId as string;

    await invitationService.cancelInvitation(
        organizationId,
        invitationId,
        actorRole
    );

    return res.status(200).json({
        success: true,
        message: "Invitation cancelled successfully"
    });

};