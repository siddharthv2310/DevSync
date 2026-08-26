import {Request, Response , NextFunction} from "express";
import { createTeamSchema} from "./teamValidation.js";
import * as teamService from "./teamServices.js";
import { ApiErrors} from "../../common/errors/ApiErrors.js";


export const createTeamController = async ( req: Request,res: Response,next: NextFunction ) => {

    try {

        const result = createTeamSchema.safeParse(req.body);

        if (!result.success) {
            throw new ApiErrors( 400,"Invalid team data");
        }

        const organizationId = req.params.organizationId as string;

        const userId = req.user?.userId;

        if (!organizationId) {
            throw new ApiErrors( 400,"Organization ID is required");
        }

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }

        const team = await teamService.createTeam( organizationId, userId,result.data);

        return res.status(201).json({
            success: true,
            message: "Team created successfully",
            data: team
        });

    } 
    catch (error) {
        next(error);
    }
};