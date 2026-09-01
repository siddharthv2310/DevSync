import prisma from "../../../config/prisma.js";
import { Prisma, TeamJoinRequestStatus } from "@prisma/client";
import { createTeamJoinRequestInput } from "./teamJoinRequestValidation.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";



export const createTeamJoinRequest = async(organizationId:string , userId:string , teamId:string , data:createTeamJoinRequestInput)=>{
    
    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            organizationId,
            isActive: true
        },

        select: {
            id: true,
            name: true
        }
    });

    if (!team) {
        throw new ApiErrors(404,"Team not found");
    }


    const organizationMembership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId
                }
            },

            select: {
                id: true
            }
        });

    if (!organizationMembership) {
        throw new ApiErrors(403,"Organization membership required");
    }


    const existingMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            },

            select: {
                id: true
            }
        });

    if (existingMember) {
        throw new ApiErrors(409,"You are already a member of this team");
    }


    const existingRequest = await prisma.teamJoinRequest.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            },

            select: {
                id: true,
                status: true
            }
        });


    if ( existingRequest && existingRequest.status === TeamJoinRequestStatus.PENDING) {

        throw new ApiErrors(409,"You already have a pending join request");
    }


    if (existingRequest) {

        return await prisma.teamJoinRequest.update({

            where: {
                id: existingRequest.id
            },

            data: {
                status: TeamJoinRequestStatus.PENDING,
                message: data.message ?? null,
                respondedAt: null
            },

            select: {
                id: true,
                teamId: true,
                userId: true,
                message: true,
                status: true,
                respondedAt: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }


    return await prisma.teamJoinRequest.create({

        data: {
            teamId,
            userId,
            message: data.message ?? null,
            status: TeamJoinRequestStatus.PENDING
        },

        select: {
            id: true,
            teamId: true,
            userId: true,
            message: true,
            status: true,
            respondedAt: true,
            createdAt: true,
            updatedAt: true
        }
    });
};


export const getTeamJoinRequests = async (organizationId: string , teamId: string , page: number , limit: number) => {

    const skip = (page - 1) * limit;

    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            organizationId,
            isActive: true
        },

        select: {
            id: true,
            name: true
        }
    });

    if (!team) {
        throw new ApiErrors(404,"Team not found");
    }


    const [requests, total] = await prisma.$transaction([

            prisma.teamJoinRequest.findMany({

                where: {
                    teamId
                },

                skip,

                take: limit,

                select: {
                    id: true,
                    message: true,
                    status: true,
                    respondedAt: true,
                    createdAt: true,
                    updatedAt: true,

                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            email: true,
                            avatar: true
                        }
                    }
                },

                orderBy: {
                    createdAt: "desc"
                }
            }),

            prisma.teamJoinRequest.count({
                where: {
                    teamId
                }
            })
        ]);


    return {
        requests,

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(
                total / limit
            )
        }
    };
};