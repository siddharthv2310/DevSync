import { joinRequestStatus } from "@prisma/client";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma  from "../../../config/prisma.js";

export const createJoinRequest = async(organizationId:string , userId:string , message?:string)=>{
    const organization = await prisma.organization.findUnique({
        where:{
            id:organizationId,
        },
    });

    if(!organization || !organization.isActive){
        throw new ApiErrors(404 , "Organization not found");
    }

    const existingMember = await prisma.organizationMember.findUnique({
        where:{
            organizationId_userId:{
                userId,
                organizationId,
            }
        }
    })

    if(existingMember){
        throw new ApiErrors(409,"You are already a member of this organization")
    }

    const existingRequest = await prisma.organizationJoinRequest.findUnique({
        where:{
            organizationId_userId:{
                organizationId,
                userId,
            }
        }
    });

    if(existingRequest){

        if(existingRequest.status === joinRequestStatus.PENDING){
            throw new ApiErrors(409 , "You already have a pending join request");
        }

        if(existingRequest.status === joinRequestStatus.APPROVED){
            throw new ApiErrors(409 , "Your join request has already been approved"); 
        }

        const updatedRequest = prisma.organizationJoinRequest.update({
            where:{
                organizationId_userId:{
                    organizationId,
                    userId,
                }
            },
            data:{
                status:joinRequestStatus.PENDING,
                message:message ?? null ,
                reviewedById:null ,
                reviewedAt:null ,
            },
            select:{
                id:true,
                status:true,
                message:true,
                requestedAt:true,
                updatedAt:true,
            },
        });

        return updatedRequest;
    }

    const joinRequest = await prisma.organizationJoinRequest.create({
        data:{
            organizationId,
            userId,
            message:message ?? null,
        },
        select:{
            id:true,
            status:true,
            message:true,
            requestedAt:true,
            updatedAt:true,
        },
    });

    return joinRequest;

}