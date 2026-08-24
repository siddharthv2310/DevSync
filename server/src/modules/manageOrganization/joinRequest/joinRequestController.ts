import {Request , Response ,NextFunction} from "express";
import { createJoinRequestSchema } from "./joinRequestValidation.js";
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