import crypto from "crypto";

import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { createTeamInvitationInput } from "./teamInvitationValidation.js";
import { TeamInvitationStatus } from "@prisma/client";


export const createTeamInvitation = async (organizationId: string, teamId: string, invitedById: string, data: createTeamInvitationInput) => {

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
                userId: data.userId
            }
        },

        select: {
            userId: true
        }
    });

    if (!organizationMembership) {
        throw new ApiErrors(403,"User must be an organization member before being invited to a team");
    }

    const existingMember =  await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: data.userId
                }
            },

            select: {
                id: true
            }
        });

    if (existingMember) {
        throw new ApiErrors(409,"User is already a member of this team");
    }


 
    const existingInvitation = await prisma.teamInvitation.findUnique({
            where: {
                teamId_invitedUserId: {
                    teamId,
                    invitedUserId: data.userId
                }
            }
        });


    if ( existingInvitation && existingInvitation.status === "PENDING"
    ) {

        if (existingInvitation.expiresAt > new Date()) {
            throw new ApiErrors(409,"User already has a pending invitation");
        }

    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto .createHash("sha256").update(rawToken).digest("hex");


    const expiresAt = new Date(Date.now() +7 * 24 * 60 * 60 * 1000);


    let invitation;


    if (existingInvitation) {

        invitation = await prisma.teamInvitation.update({

                where: {
                    id: existingInvitation.id
                },

                data: {
                    invitedById,
                    tokenHash,
                    status: "PENDING",
                    message: data.message ?? null,
                    expiresAt,
                    respondedAt: null
                },

                select: {
                    id: true,
                    status: true,
                    message: true,
                    expiresAt: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

    }
    else {

        invitation = await prisma.teamInvitation.create({

                data: {
                    teamId,
                    invitedUserId: data.userId,
                    invitedById,

                    tokenHash,

                    status: "PENDING",

                    message: data.message ?? null,

                    expiresAt
                },

                select: {
                    id: true,
                    status: true,
                    message: true,
                    expiresAt: true,
                    createdAt: true,
                    UpdatedAt: true
                }
            });
    }


    return {
        invitation,
        token: rawToken
    };
};


export const getTeamInvitations = async (organizationId: string,teamId: string,page: number,limit: number,status?: TeamInvitationStatus) => {

    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            organizationId
        },

        select: {
            id: true
        }
    });

    if (!team) {
        throw new ApiErrors(40,"Team not found");
    }

    const skip = (page - 1) * limit;

    const where = {
        teamId,

        ...(status && { status })
    };

    const [invitations, total] = await prisma.$transaction([
            prisma.teamInvitation.findMany({
                where,

                skip,
                take: limit,

                orderBy: {
                    createdAt: "desc"
                },

                select: {
                    id: true,
                    status: true,
                    message: true,
                    expiresAt: true,
                    respondedAt: true,
                    createdAt: true,
                    updatedAt: true,

                    invitedUser: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            email: true,
                            avatar: true
                        }
                    },

                    invitedBy: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        }
                    }
                }
            }),

            prisma.teamInvitation.count({
                where
            })
        ]);

    return {
        invitations,

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};


export const acceptTeamInvitation = async (userId: string,rawToken: string) => {

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const invitation = await prisma.teamInvitation.findUnique({
            where: {
                tokenHash
            },

            select: {
                id: true,
                teamId: true,
                invitedUserId: true,
                status: true,
                expiresAt: true
            }
        });

    if (!invitation) {
        throw new ApiErrors(
            404,
            "Invalid team invitation"
        );
    }


    /*
     * Make sure the invitation belongs
     * to the authenticated user.
     */
    if (invitation.invitedUserId !== userId) {
        throw new ApiErrors(
            403,
            "This invitation was not sent to you"
        );
    }


    /*
     * Invitation must still be pending.
     */
    if (
        invitation.status !==
        TeamInvitationStatus.PENDING
    ) {

        throw new ApiErrors(
            409,
            `Invitation is already ${invitation.status.toLowerCase()}`
        );
    }


    /*
     * Check expiration.
     */
    if (invitation.expiresAt <= new Date()) {

        await prisma.teamInvitation.update({
            where: {
                id: invitation.id
            },

            data: {
                status: TeamInvitationStatus.EXPIRED,
                respondedAt: new Date()
            }
        });

        throw new ApiErrors(
            410,
            "Team invitation has expired"
        );
    }


    /*
     * Everything below must happen atomically.
     */
    const result = await prisma.$transaction(
        async (tx) => {

            /*
             * Verify the Team still exists and
             * is active.
             */
            const team = await tx.team.findFirst({
                where: {
                    id: invitation.teamId,
                    isActive: true
                },

                select: {
                    id: true,
                    name: true
                }
            });

            if (!team) {
                throw new ApiErrors(
                    404,
                    "Team is no longer available"
                );
            }


            /*
             * User may have become a member through
             * another operation after the invitation.
             */
            const existingMember =
                await tx.teamMember.findUnique({
                    where: {
                        teamId_userId: {
                            teamId: invitation.teamId,
                            userId
                        }
                    }
                });

            if (existingMember) {
                throw new ApiErrors(
                    409,
                    "You are already a member of this team"
                );
            }


            /*
             * Create Team membership.
             *
             * Invitation always creates MEMBER.
             */
            const membership =
                await tx.teamMember.create({
                    data: {
                        teamId: invitation.teamId,
                        userId,
                        role: TeamRole.MEMBER
                    },

                    select: {
                        id: true,
                        role: true,
                        joinedAt: true
                    }
                });


            /*
             * Mark invitation as accepted.
             */
            const updatedInvitation =
                await tx.teamInvitation.update({
                    where: {
                        id: invitation.id
                    },

                    data: {
                        status:
                            TeamInvitationStatus.ACCEPTED,

                        respondedAt: new Date()
                    },

                    select: {
                        id: true,
                        status: true,
                        respondedAt: true
                    }
                });


            return {
                team,
                membership,
                invitation: updatedInvitation
            };
        }
    );


    return result;
};