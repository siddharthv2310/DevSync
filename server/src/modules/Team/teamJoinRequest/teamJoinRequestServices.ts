import prisma from "../../../config/prisma.js";
import { Prisma, TeamJoinRequestStatus, TeamRole } from "@prisma/client";
import { createTeamJoinRequestInput } from "./teamJoinRequestValidation.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";



export const createTeamJoinRequest = async (organizationId: string, userId: string, teamId: string, data: createTeamJoinRequestInput) => {

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
        throw new ApiErrors(404, "Team not found");
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
        throw new ApiErrors(403, "Organization membership required");
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
        throw new ApiErrors(409, "You are already a member of this team");
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


    if (existingRequest && existingRequest.status === TeamJoinRequestStatus.PENDING) {

        throw new ApiErrors(409, "You already have a pending join request");
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


export const getTeamJoinRequests = async (organizationId: string, teamId: string, page: number, limit: number) => {

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
        throw new ApiErrors(404, "Team not found");
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


export const approveTeamJoinRequest = async (organizationId: string, teamId: string, requestId: string, approvedById: string) => {

    const request = await prisma.teamJoinRequest.findFirst({

        where: {
            id: requestId,
            teamId,

            team: {
                organizationId,
                isActive: true
            }
        },

        select: {
            id: true,
            teamId: true,
            userId: true,
            status: true
        }
    });


    if (!request) {
        throw new ApiErrors(404, "Team join request not found");
    }


    if (request.status !== TeamJoinRequestStatus.PENDING) {
        throw new ApiErrors(409, `Cannot approve a request that is already ${request.status.toLowerCase()}`);
    }

    const organizationMembership = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId: approvedById
            }
        },

        select: {
            id: true
        }
    });


    if (!organizationMembership) {
        throw new ApiErrors(403, "Approver is not an organization member");
    }


    const existingMember = await prisma.teamMember.findUnique({

        where: {
            teamId_userId: {
                teamId,
                userId: request.userId
            }
        },

        select: {
            id: true
        }
    });


    if (existingMember) {
        throw new ApiErrors(409, "User is already a member of this team");
    }


    return await prisma.$transaction(async (tx) => {

        const updated = await tx.teamJoinRequest.updateMany({

            where: {
                id: request.id,
                status: TeamJoinRequestStatus.PENDING
            },

            data: {
                status: TeamJoinRequestStatus.APPROVED,
                reviewedById: approvedById,
                respondedAt: new Date()
            }
        });


        if (updated.count !== 1) {
            throw new ApiErrors(409, "Join request has already been processed");
        }


        const membership = await tx.teamMember.create({

            data: {
                teamId: request.teamId,
                userId: request.userId,
                role: TeamRole.MEMBER
            },

            select: {
                id: true,
                teamId: true,
                userId: true,
                role: true,
                joinedAt: true
            }
        });


        const approvedRequest = await tx.teamJoinRequest.findUnique({

            where: {
                id: request.id
            },

            select: {
                id: true,
                teamId: true,
                userId: true,
                message: true,
                status: true,
                reviewedById: true,
                respondedAt: true,
                createdAt: true,
                updatedAt: true
            }
        });


        return {
            membership,
            request: approvedRequest
        };
    });
};


export const rejectTeamJoinRequest = async (organizationId: string, teamId: string, requestId: string, reviewedById: string) => {

    const request = await prisma.teamJoinRequest.findFirst({

        where: {
            id: requestId,
            teamId,

            team: {
                organizationId,
                isActive: true
            }
        },

        select: {
            id: true,
            teamId: true,
            userId: true,
            status: true
        }
    });


    if (!request) {
        throw new ApiErrors(404, "Team join request not found");
    }


    if (request.status !== TeamJoinRequestStatus.PENDING
    ) {
        throw new ApiErrors(409, `Cannot reject a request that is already ${request.status.toLowerCase()}`);
    }


    const organizationMembership = await prisma.organizationMember.findUnique({

        where: {
            organizationId_userId: {
                organizationId,
                userId: reviewedById
            }
        },

        select: {
            id: true
        }
    });


    if (!organizationMembership) {
        throw new ApiErrors(403, "Reviewer is not an organization member");
    }


    const rejectedRequest = await prisma.teamJoinRequest.update({

        where: {
            id: request.id
        },

        data: {
            status:
                TeamJoinRequestStatus.REJECTED,

            reviewedById,

            respondedAt: new Date()
        },

        select: {
            id: true,
            teamId: true,
            userId: true,
            message: true,
            status: true,
            reviewedById: true,
            respondedAt: true,
            createdAt: true,
            updatedAt: true
        }
    });


    return rejectedRequest;
};

export const cancelTeamJoinRequest = async (organizationId: string, teamId: string, requestId: string, userId: string) => {

    const request = await prisma.teamJoinRequest.findFirst({

        where: {
            id: requestId,
            teamId,

            team: {
                organizationId,
                isActive: true
            }
        },

        select: {
            id: true,
            teamId: true,
            userId: true,
            status: true
        }
    });


    if (!request) {
        throw new ApiErrors(404, "Team join request not found");
    }


    if (request.userId !== userId) {

        throw new ApiErrors(403, "You can only cancel your own join request");
    }


    if (request.status !== TeamJoinRequestStatus.PENDING) {

        throw new ApiErrors(409, `Cannot cancel a request that is already ${request.status.toLowerCase()}`);
    }


    const cancelledRequest = await prisma.teamJoinRequest.update({

        where: {
            id: request.id
        },

        data: {
            status: TeamJoinRequestStatus.CANCELLED,
            respondedAt: new Date()
        },

        select: {
            id: true,
            teamId: true,
            userId: true,
            message: true,
            status: true,
            reviewedById: true,
            respondedAt: true,
            createdAt: true,
            updatedAt: true
        }
    });


    return cancelledRequest;
};


export const getMyTeamJoinRequests = async (organizationId: string,teamId: string,userId: string,page: number,limit: number) => {

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

    const [requests, total] =  await prisma.$transaction([

            prisma.teamJoinRequest.findMany({
                where: {
                    teamId,
                    userId
                },

                skip,
                take: limit,

                select: {
                    id: true,
                    teamId: true,
                    userId: true,
                    message: true,
                    status: true,
                    reviewedById: true,
                    respondedAt: true,
                    createdAt: true,
                    updatedAt: true,

                    reviewedBy: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
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
                    teamId,
                    userId
                }
            })
        ]);

    return {
        requests,

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};
