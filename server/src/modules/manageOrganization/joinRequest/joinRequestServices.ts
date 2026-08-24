import { joinRequestStatus, OrganizationRole } from "@prisma/client";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma from "../../../config/prisma.js";

export const createJoinRequest = async (organizationId: string, userId: string, message?: string) => {
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
    });

    if (!organization || !organization.isActive) {
        throw new ApiErrors(404, "Organization not found");
    }

    const existingMember = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                userId,
                organizationId,
            }
        }
    })

    if (existingMember) {
        throw new ApiErrors(409, "You are already a member of this organization")
    }

    const existingRequest = await prisma.organizationJoinRequest.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            }
        }
    });

    if (existingRequest) {

        if (existingRequest.status === joinRequestStatus.PENDING) {
            throw new ApiErrors(409, "You already have a pending join request");
        }

        if (existingRequest.status === joinRequestStatus.APPROVED) {
            throw new ApiErrors(409, "Your join request has already been approved");
        }

        const updatedRequest = prisma.organizationJoinRequest.update({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                }
            },
            data: {
                status: joinRequestStatus.PENDING,
                message: message ?? null,
                reviewedById: null,
                reviewedAt: null,
            },
            select: {
                id: true,
                status: true,
                message: true,
                requestedAt: true,
                updatedAt: true,
            },
        });

        return updatedRequest;
    }

    const joinRequest = await prisma.organizationJoinRequest.create({
        data: {
            organizationId,
            userId,
            message: message ?? null,
        },
        select: {
            id: true,
            status: true,
            message: true,
            requestedAt: true,
            updatedAt: true,
        },
    });

    return joinRequest;

}

export const getOrganizationJoinRequests = async (organizationId: string, page: number, limit: number, status?: joinRequestStatus) => {

    const skip = (page - 1) * limit;

    const [requests, total] = await prisma.$transaction([
        prisma.organizationJoinRequest.findMany({
            where: {
                organizationId,
                ...(status && { status }),
            },
            skip,
            take: limit,

            select: {
                id: true,
                status: true,
                message: true,
                requestedAt: true,
                updatedAt: true,
                reviewedAt: true,

                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        avatar: true,
                    }
                },

                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    }
                },
            }
        }),

        prisma.organizationJoinRequest.count({
            where: {
                organizationId,
                ...(status && { status }),
            }
        })

    ]);

    return {
        requests,
        pagination: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        }
    }

}

export const approveJoinRequest = async (organizationId: string, requestId: string, reviewerId: string) => {
    const request = await prisma.organizationJoinRequest.findUnique({
        where: {
            id: requestId,
        },
        select: {
            id: true,
            organizationId: true,
            userId: true,
            status: true,
        }
    });

    if (!request || request.organizationId !== organizationId) {
        throw new ApiErrors(404, "Join request not found");
    }

    if (request.status !== joinRequestStatus.PENDING) {
        throw new ApiErrors(409, "Only pending join requests can be approved");
    }

    if (request.userId === reviewerId) {
        throw new ApiErrors(400, "You cannot approve your own join request");
    }

    const existingMember = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: request.organizationId,
                userId: request.userId,
            }
        }
    });

    if (existingMember) {
        throw new ApiErrors(409, "User is already a member of this organization");
    }

    const result = await prisma.$transaction(async (tx) => {
        const membership = await tx.organizationMember.create({
            data: {
                userId: request.userId,
                organizationId: request.organizationId,
                role: OrganizationRole.MEMBER,
            },
            select: {
                id: true,
                organizationId: true,
                userId: true,
                role: true,
                joinedAt: true,
            }
        })

        const updatedRequest = await tx.organizationJoinRequest.update({
            where: {
                id: request.id,
            },
            data: {
                status: joinRequestStatus.APPROVED,
                reviewedById: reviewerId,
                reviewedAt: new Date(),
            },
            select: {
                id: true,
                status: true,
                reviewedById: true,
                reviewedAt: true
            }
        })

        return {
            membership,
            request: updatedRequest,
        }
    })

    return result;
}

export const rejectJoinRequest = async (organizationId: string, requestId: string, reviewerId: string) => {
    const request = await prisma.organizationJoinRequest.findUnique({
        where: {
            id: requestId,
        },
        select: {
            id: true,
            organizationId: true,
            userId: true,
            status: true,
        }
    })

    if (!request || request.organizationId !== organizationId) {
        throw new ApiErrors(404, "Join request not found");
    }

    if (request.status !== joinRequestStatus.PENDING) {
        throw new ApiErrors(409, "Only pending join requests can be rejected");
    }

    if (request.userId === reviewerId) {
        throw new ApiErrors(400, "You cannot reject your own join request");
    }

    const rejectedRequest = await prisma.organizationJoinRequest.update({
        where: {
            id: request.id
        },
        data: {
            status: joinRequestStatus.REJECTED,
            reviewedById: reviewerId,
            reviewedAt: new Date()
        },
        select: {
            id: true,
            status: true,
            reviewedById: true,
            reviewedAt: true
        }
    });

    return rejectedRequest;

}

export const getMyJoinRequest = async (organizationId: string,userId: string) => {

    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId
        },
        select: {
            id: true,
            isActive: true
        }
    });

    if (!organization || !organization.isActive) {
        throw new ApiErrors(404,"Organization not found");
    }

    const request =
        await prisma.organizationJoinRequest.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId
                }
            },
            select: {
                id: true,
                status: true,
                message: true,
                createdAt: true,
                updatedAt: true,
                reviewedAt: true,

                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                }
            }
        });

    if (!request) {
        throw new ApiErrors(404,"Join request not found" );
    }

    return request;
};

