import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { ApiErrors } from "../common/errors/ApiErrors.js";


export const organizationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const organizationId = req.params.organizationId as string;

        const userId = req.user?.userId;

        if(!organizationId){
            throw new ApiErrors(401,"Organization ID is required");
        }
        if(!userId){
            throw new ApiErrors(401, "Authentication required");
        }

        // console.log("organizationId:", organizationId);
        // console.log("userId:", userId);

        const membership = await prisma.organizationMember.findUnique({
            where:{
                organizationId_userId:{
                    organizationId,
                    userId,
                },
            },

            include:{
                organization:true,
            }
        });

       // console.log("membership:", membership);

        if(!membership || !membership.organization){
            throw new ApiErrors( 404,"Organization not found");
        }

        req.organization = membership?.organization;
        req.organizationMember = membership;

        next();
    }
    catch(error){
        next(error);
    }
}