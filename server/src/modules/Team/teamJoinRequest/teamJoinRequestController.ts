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


export const getTeamJoinRequestsController = async ( req: Request, res: Response, next: NextFunction) => {

    try {

        const organizationId :string = req.params.organizationId as string;

        const teamId:string = req.params.teamId as string;

        if (!organizationId || !teamId) {
            throw new ApiErrors( 400, "Organization ID and Team ID are required" );
        }


        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 20;


        if (page < 1 || limit < 1 || limit > 100) {
            throw new ApiErrors(400,"Invalid pagination parameters");
        }


        const result = await teamJoinRequestServices.getTeamJoinRequests(organizationId,teamId,page,limit);


        return res.status(200).json({
            success: true,
            message: "Team join requests fetched successfully",
            data: result
        });

    } 
    catch (error) {
        next(error);
    }
};


export const approveTeamJoinRequestController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        const requestId = req.params.requestId as string;
        
        const approvedById = req.user?.userId;

        if (!approvedById) {
            throw new ApiErrors(401,"Authentication required");
        }


        if (!organizationId || !teamId || !requestId) {
            throw new ApiErrors(400,"Organization ID, Team ID and Request ID are required");
        }


        const result = await teamJoinRequestServices.approveTeamJoinRequest( organizationId, teamId,requestId,approvedById);


        return res.status(200).json({
            success: true,
            message: "Team join request approved successfully",
            data: result
        });

    } 
    catch (error) {
        next(error);
    }
};


export const rejectTeamJoinRequestController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        const requestId = req.params.requestId as string;

        const reviewedById = req.user?.userId;


        if (!reviewedById) {
            throw new ApiErrors( 401, "Authentication required" );
        }


        if (!organizationId || !teamId || !requestId ) {
            throw new ApiErrors( 400, "Organization ID, Team ID and Request ID are required" );
        }


        const result = await teamJoinRequestServices .rejectTeamJoinRequest( organizationId,teamId,requestId,reviewedById );


        return res.status(200).json({
            success: true,
            message: "Team join request rejected successfully",
            data: result
        });

    } 
    catch (error) {
        next(error);
    }
};


export const cancelTeamJoinRequestController = async (req: Request, res: Response,next: NextFunction ) => {

    try {

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        const requestId = req.params.requestId as string;

        const userId = req.user?.userId;


        if (!userId) {
            throw new ApiErrors( 401, "Authentication required");
        }


        if ( !organizationId || !teamId || !requestId ) {
            throw new ApiErrors( 400, "Organization ID, Team ID and Request ID are required");
        }


        const result = await teamJoinRequestServices .cancelTeamJoinRequest(organizationId,teamId,requestId,userId);


        return res.status(200).json({
            success: true,
            message:"Team join request cancelled successfully",
            data: result
        });

    } 
    catch (error) {
        next(error);
    }
};


export const getMyTeamJoinRequestsController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors( 401,"Authentication required");
        }

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 20;

        if ( page < 1 || limit < 1 || limit > 100 ) {
            throw new ApiErrors( 400, "Invalid pagination parameters" );
        }

        const result = await teamJoinRequestServices .getMyTeamJoinRequests(organizationId,teamId,userId,page,limit);

        return res.status(200).json({
            success: true,
            message: "Your team join requests fetched successfully",
            data: result
        });

    } 
    catch (error) {
        next(error);
    }
};