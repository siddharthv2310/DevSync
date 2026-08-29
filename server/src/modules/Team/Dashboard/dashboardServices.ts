import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { TeamRole } from "@prisma/client";

export const getTeamDashboard = async (organizationId: string, teamId: string, userId: string) => {


    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            organizationId
        },

        select: {
            id: true,
            organizationId: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!team) {
        throw new ApiErrors(404, "Team not found");
    }


    const [totalMembers, ownerCount, adminCount, memberCount, recentMembers, currentUserMembership] = await Promise.all([

        prisma.teamMember.count({
            where: {
                teamId
            }
        }),

        prisma.teamMember.count({
            where: {
                teamId,
                role: TeamRole.OWNER,
            }
        }),

        prisma.teamMember.count({
            where: {
                teamId,
                role:  TeamRole.ADMIN,
            }
        }),

        prisma.teamMember.count({
            where: {
                teamId,
                role:  TeamRole.MEMBER
            }
        }),

        prisma.teamMember.findMany({
            where: {
                teamId
            },

            take: 5,

            orderBy: {
                joinedAt: "desc"
            },

            select: {
                id: true,
                role: true,
                joinedAt: true,

                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        }),

        prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            },

            select: {
                id: true,
                role: true,
                joinedAt: true
            }
        })
    ]);

    return {

        team: {
            id: team.id,
            organizationId: team.organizationId,
            name: team.name,
            slug: team.slug,
            description: team.description,
            avatar: team.avatar,
            isActive: team.isActive,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt
        },

        statistics: {
            totalMembers,
            ownerCount,
            adminCount,
            memberCount
        },

        recentMembers,

        currentUser: currentUserMembership
    };
};