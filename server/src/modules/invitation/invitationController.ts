import { Request, Response } from "express";

import * as invitationService from "./invitationServices.js";
import { createInvitationSchema } from "./invitationValidation.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

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
    const token  = req.params.token as string;

    const userId = req.user!.userId;

    if (!token) {
        throw new ApiErrors(
            400,
            "Invitation token is required"
        );
    }

    const result =await invitationService.acceptInvitation( token,userId);

    return res.status(200).json({
        success: true,
        message: "Invitation accepted successfully",
        data: result
    });
};