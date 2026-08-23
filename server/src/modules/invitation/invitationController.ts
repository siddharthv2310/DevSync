import { Request, Response } from "express";

import * as invitationService from "./invitationServices.js";
import { createInvitationSchema } from "./invitationValidation.js";

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