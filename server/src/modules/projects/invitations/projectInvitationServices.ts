import { createHash, randomBytes } from "node:crypto";
import { Prisma, projectRole, ProjectInvitationStatus, } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { CreateProjectInvitationInput, GetProjectInvitationsQuery } from "./projectInvitationValidation.js";
import { sendProjectInvitationEmail } from "../../../utils/email.js";

import crypto from "crypto";


export const createProjectInvitation = async (
    organizationId: string,
    projectId: string,
    invitedById: string,
    data: CreateProjectInvitationInput
) => {

    // 1. Verify project exists
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
            name: true,
            isArchived: true,
        },
    });

    if (!project) {
        throw new ApiErrors(404, "Project not found");
    }

    if (project.isArchived) {
        throw new ApiErrors(
            409,
            "Cannot invite members to an archived project"
        );
    }

    // 2. Verify requester is OWNER or ADMIN
    const requesterMembership = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId: invitedById,
            },
        },
        select: {
            role: true,
        },
    });

    if (!requesterMembership) {
        throw new ApiErrors(
            403,
            "You must be a project member to invite users"
        );
    }

    if (
        requesterMembership.role !== projectRole.OWNER &&
        requesterMembership.role !== projectRole.ADMIN
    ) {
        throw new ApiErrors(
            403,
            "Only project OWNER or ADMIN can invite members"
        );
    }

    // 3. Verify invited user belongs to the organization
    const organizationMembership = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId: data.invitedUserId,
            },
        },
        select: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
            organization: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!organizationMembership) {
        throw new ApiErrors(
            404,
            "Invited user is not a member of this organization"
        );
    }

    // 4. Check whether user is already a project member
    const existingMember = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId: data.invitedUserId,
            },
        },
    });

    if (existingMember) {
        throw new ApiErrors(
            409,
            "User is already a member of this project"
        );
    }

    // 5. Check for an existing invitation
    const existingInvitation = await prisma.projectInvitation.findUnique({
        where: {
            projectId_invitedUserId: {
                projectId,
                invitedUserId: data.invitedUserId,
            },
        },
    });

    if (existingInvitation) {
        throw new ApiErrors(
            409,
            `An invitation already exists with status ${existingInvitation.status}`
        );
    }

    // 6. Generate secure invitation token
    const invitationToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
        .update(invitationToken)
        .digest("hex");

    // 7. Set expiry to seven days
    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // 8. Create project invitation
    const invitation = await prisma.projectInvitation.create({
        data: {
            projectId,
            invitedUserId: data.invitedUserId,
            invitedById,
            role: data.role,
            message: data.message ?? null,
            tokenHash,
            expiresAt,
        },

        select: {
            id: true,
            projectId: true,
            invitedUserId: true,
            invitedById: true,
            role: true,
            status: true,
            message: true,
            expiresAt: true,
            createdAt: true,
            invitedUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // 9. Send project invitation email
    try {
        const emailResponse = await sendProjectInvitationEmail(
            organizationMembership.user.email,
            project.name,
            organizationMembership.organization.name,
            data.role,
            invitationToken
        );

        console.log(
            "Project invitation email response:",
            emailResponse
        );

    } catch (error) {
        console.error("PROJECT INVITATION EMAIL ERROR:", error);
    }

    // 10. Return response (never expose raw invitation token)
    return {
        invitation,
        projectName: project.name,
    };
};




export const getProjectInvitations = async (projectId: string, query: GetProjectInvitationsQuery) => {

    const { page, limit, status, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProjectInvitationWhereInput = {
        projectId,

        ...(status && { status }),

        ...(search && {
            invitedUser: {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            },
        }),
    };

    const [invitations, total] = await Promise.all([
        prisma.projectInvitation.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                projectId: true,
                role: true,
                status: true,
                message: true,
                expiresAt: true,
                respondedAt: true,
                createdAt: true,

                invitedUser: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        avatar: true,
                    },
                },

                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        }),

        prisma.projectInvitation.count({ where }),
    ]);

    return {
        invitations,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};



export const acceptProjectInvitation = async (userId: string, token: string) => {

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // 1. Find invitation
    const invitation = await prisma.projectInvitation.findUnique({
        where: {
            tokenHash,
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    organizationId: true,
                    isArchived: true,
                },
            },
        },
    });

    if (!invitation) {
        throw new ApiErrors(404, "Invalid invitation");
    }

    // 2. Verify recipient
    if (invitation.invitedUserId !== userId) {
        throw new ApiErrors(
            403,
            "You are not authorized to accept this invitation"
        );
    }

    // 3. Verify invitation status
    if (invitation.status !== ProjectInvitationStatus.PENDING) {
        throw new ApiErrors(
            400,
            "This invitation is no longer available"
        );
    }

    // 4. Check expiration
    const now = new Date();

    if (invitation.expiresAt <= now) {
        await prisma.projectInvitation.updateMany({
            where: {
                id: invitation.id,
                status: ProjectInvitationStatus.PENDING,
            },
            data: {
                status: ProjectInvitationStatus.EXPIRED,
            },
        });

        throw new ApiErrors(400, "This invitation has expired");
    }

    // 5. Check whether project is archived
    if (invitation.project.isArchived) {
        throw new ApiErrors(
            400,
            "Cannot accept an invitation to an archived project"
        );
    }

    // 6. Verify user is still an organization member
    const organizationMembership =
        await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: invitation.project.organizationId,
                    userId,
                },
            },
        });

    if (!organizationMembership) {
        throw new ApiErrors(
            403,
            "You must be an organization member to join this project"
        );
    }

    // 7. Check existing project membership
    const existingMembership = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId: invitation.projectId,
                userId,
            },
        },
    });

    if (existingMembership) {
        throw new ApiErrors(
            409,
            "You are already a member of this project"
        );
    }

    // 8. Accept invitation and create membership atomically
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Conditional update prevents accepting the same invitation twice.
            const updatedInvitation = await tx.projectInvitation.updateMany({
                where: {
                    id: invitation.id,
                    invitedUserId: userId,
                    status: ProjectInvitationStatus.PENDING,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                data: {
                    status: ProjectInvitationStatus.ACCEPTED,
                    respondedAt: new Date(),
                },
            });

            if (updatedInvitation.count !== 1) {
                throw new ApiErrors(
                    409,
                    "Invitation is no longer available or has expired"
                );
            }

            // Create project membership with the invited role.
            const membership = await tx.projectMember.create({
                data: {
                    projectId: invitation.projectId,
                    userId,
                    role: invitation.role,
                },
            });

            return membership;
        });

        return {
            message: "Project invitation accepted successfully",
            membership: result,
        };
    }

    catch (error: any) {
        // Prisma unique constraint violation
        if (error.code === "P2002") {
            throw new ApiErrors(
                409,
                "You are already a member of this project"
            );
        }

        throw error;
    }
};

export const rejectProjectInvitation = async (userId: string, token: string) => {

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // 1. Find invitation
    const invitation = await prisma.projectInvitation.findUnique({
        where: {
            tokenHash,
        },
    });

    if (!invitation) {
        throw new ApiErrors(404, "Invalid invitation");
    }

    // 2. Verify recipient
    if (invitation.invitedUserId !== userId) {
        throw new ApiErrors(
            403,
            "You are not authorized to reject this invitation"
        );
    }

    // 3. Verify invitation status
    if (invitation.status !== ProjectInvitationStatus.PENDING) {
        throw new ApiErrors(
            400,
            "This invitation is no longer available"
        );
    }

    // 4. Check expiry
    if (invitation.expiresAt <= new Date()) {
        await prisma.projectInvitation.updateMany({
            where: {
                id: invitation.id,
                status: ProjectInvitationStatus.PENDING,
            },
            data: {
                status: ProjectInvitationStatus.EXPIRED,
            },
        });

        throw new ApiErrors(400, "This invitation has expired");
    }

    // 5. Reject invitation
    const updatedInvitation = await prisma.projectInvitation.updateMany({
        where: {
            id: invitation.id,
            invitedUserId: userId,
            status: ProjectInvitationStatus.PENDING,
            expiresAt: {
                gt: new Date(),
            },
        },
        data: {
            status: ProjectInvitationStatus.REJECTED,
            respondedAt: new Date(),
        },
    });

    if (updatedInvitation.count !== 1) {
        throw new ApiErrors(
            409,
            "Invitation is no longer available or has expired"
        );
    }

    return {
        message: "Project invitation rejected successfully",
    };
};


export const cancelProjectInvitation = async (projectId: string, invitationId: string) => {

    // 1. Find invitation
    const invitation = await prisma.projectInvitation.findFirst({
        where: {
            id: invitationId,
            projectId,
        },
    });

    if (!invitation) {
        throw new ApiErrors(404, "Project invitation not found");
    }

    // 2. Check invitation status
    if (invitation.status !== ProjectInvitationStatus.PENDING) {
        throw new ApiErrors(
            400,
            "Only pending invitations can be cancelled"
        );
    }

    // 3. Handle expired invitation
    if (invitation.expiresAt <= new Date()) {
        await prisma.projectInvitation.updateMany({
            where: {
                id: invitationId,
                projectId,
                status: ProjectInvitationStatus.PENDING,
            },
            data: {
                status: ProjectInvitationStatus.EXPIRED,
            },
        });

        throw new ApiErrors(400, "This invitation has already expired");
    }

    // 4. Cancel invitation
    const updatedInvitation = await prisma.projectInvitation.updateMany({
        where: {
            id: invitationId,
            projectId,
            status: ProjectInvitationStatus.PENDING,
            expiresAt: {
                gt: new Date(),
            },
        },
        data: {
            status: ProjectInvitationStatus.CANCELLED,
            respondedAt: new Date(),
        },
    });

    if (updatedInvitation.count !== 1) {
        throw new ApiErrors(
            409,
            "Invitation is no longer available"
        );
    }

    return {
        message: "Project invitation cancelled successfully",
    };
};