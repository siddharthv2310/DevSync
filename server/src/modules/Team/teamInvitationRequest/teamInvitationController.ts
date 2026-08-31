import {Request,Response,NextFunction} from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import {createTeamInvitationSchema, getTeamInvitationsQuerySchema} from "./teamInvitationValidation.js";

import {createTeamInvitation, getTeamInvitations} from "./teamInvitationServices.js";


export const createTeamInvitationController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        const invitedById = req.user?.userId;


        if (!organizationId) {
            throw new ApiErrors(400,"Organization ID is required");
        }

        if (!teamId) {
            throw new ApiErrors(400,"Team ID is required");
        }

        if (!invitedById) {
            throw new ApiErrors(401,"Authentication required");
        }


        const result = createTeamInvitationSchema.safeParse(req.body);

        if (!result.success) {
            throw new ApiErrors(400,"Invalid invitation data");
        }


        const invitation =await createTeamInvitation(organizationId,teamId,invitedById,result.data);


        return res.status(201).json({
            success: true,
            message: "Team invitation sent successfully",

            data: invitation
        });

    } 
    catch (error) {
        next(error);
    }
};

export const getTeamInvitationsController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        if (!organizationId) {
            throw new ApiErrors(
                400,
                "Organization ID is required"
            );
        }

        if (!teamId) {
            throw new ApiErrors(400,"Team ID is required");
        }

        const result = getTeamInvitationsQuerySchema.safeParse(req.query);

        if (!result.success) {
            throw new ApiErrors(400,"Invalid invitation query");
        }

        const invitations = await getTeamInvitations(organizationId,teamId,result.data.page,result.data.limit,result.data.status);

        return res.status(200).json({
            success: true,
            message: "Team invitations fetched successfully",
            data: invitations.invitations,
            pagination: invitations.pagination
        });

    } 
    catch (error) {
        next(error);
    }
};