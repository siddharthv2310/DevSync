import {Request,Response,NextFunction} from "express";
import { createTeamJoinRequestSchema } from "./teamJoinRequestValidation.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import * as teamJoinRequestServices from "./teamJoinRequestServices.js";


export const createTeamJoinRequestController = async(req:Request , res:Response , next:NextFunction)=>{

    try{
        const result = createTeamJoinRequestSchema.safeParse(req.body);

        if(!result.success){
            throw new ApiErrors(400 , "Invalid join request data");
        }
    
        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string ;

        const userId = req.user?.userId;

        if (!organizationId || !teamId) {
            throw new ApiErrors(400,"Organization ID and Team ID are required");
        }

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }

        const request = await teamJoinRequestServices.createTeamJoinRequest( organizationId,userId, teamId,result.data);


        return res.status(201).json({

            success: true,

            message:
                "Team join request sent successfully",

            data: request
        });
    }
    catch(error){
        next(error);
    }
};