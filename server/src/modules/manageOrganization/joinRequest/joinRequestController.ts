import {Request , Response ,NextFunction} from "express";
import { createJoinRequestSchema, getJoinRequestsQuerySchema } from "./joinRequestValidation.js";
import * as joinRequestServices from "./joinRequestServices.js";

export const createJoinRequest = async( req:Request , res:Response )=>{
    const organizationId = req.params.organizationId as string;

    const userId = req.user!.userId;

    const data = createJoinRequestSchema.parse(req.body);

    const joinRequest =await joinRequestServices.createJoinRequest( organizationId, userId, data.message );

    return res.status(201).json({
        success: true,
        message: "Join request submitted successfully",
        data: joinRequest
    });

}

export const getOrganizationJoinRequests = async(req:Request , res:Response)=>{
    const query = getJoinRequestsQuerySchema.safeParse(req.query);

    if(!query.success){
        return res.status(400).json({
            success:true,
            message:"invalid request",
            error:query.error.flatten(),
        })
    }

    const organizationId = req.params.organizationId as string;

    const result = await joinRequestServices.getOrganizationJoinRequests(organizationId , query.data.page , query.data.limit , query.data.status);

    return res.status(200).json({
        success: true,
        message: "Join requests fetched successfully",
        data: result.requests,
        pagination: result.pagination,
    });

}

export const approveJoinRequest = async(req:Request , res:Response )=>{
    const organizationId = req.organization!.id;

    const reviewerId = req.user!.userId;

    const requestId = req.params.requestId as string;

    const result = await joinRequestServices.approveJoinRequest(organizationId,requestId,reviewerId);

    return res.status(200).json({
        status:true,
        message:"Join request approved successfully",
        data : result,
    });
}

export const rejectJoinRequest = async ( req: Request, res: Response) => {

    const organizationId = req.organization!.id;
    const reviewerId = req.user!.userId;

    const requestId = req.params.requestId as string;

    const result =
        await joinRequestServices.rejectJoinRequest(
            organizationId,
            requestId,
            reviewerId
        );

    return res.status(200).json({
        success: true,
        message: "Join request rejected successfully",
        data: result
    });
};

export const getMyJoinRequest = async (req: Request,res: Response) => {
    const organizationId = req.params.organizationId as string;
    const userId = req.user!.userId;

    const result =
        await joinRequestServices.getMyJoinRequest(
            organizationId,
            userId
        );

    return res.status(200).json({
        success: true,
        message: "Join request fetched successfully",
        data: result
    });
};