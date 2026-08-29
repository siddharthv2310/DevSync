import {Request,Response,NextFunction} from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import * as dashboardServices from "./dashboardServices.js";


export const getTeamDashboardController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        const userId = req.user?.userId;

        if (!organizationId) {
            throw new ApiErrors(400,"Organization ID is required");
        }

        if (!teamId) {
            throw new ApiErrors(400,"Team ID is required");
        }

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }

        const dashboard = await dashboardServices.getTeamDashboard(organizationId,teamId,userId);

        return res.status(200).json({
            success: true,
            message: "Team dashboard fetched successfully",
            data: dashboard
        });

    } 
    catch (error) {
        next(error);
    }
};