import prisma from "../../config/prisma.js";
import {Prisma,TeamRole } from "@prisma/client";
import { CreateTeamInput } from "./teamValidation.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";


export const createTeam = async (organizationId: string, userId: string, data: CreateTeamInput) => {
    try {

        const organization =
            await prisma.organization.findUnique({
                where: {
                    id: organizationId
                },
                select: {
                    id: true,
                    isActive: true
                }
            });

        if (!organization || !organization.isActive) {
            throw new ApiErrors(404, "Organization not found");
        }

        const existingTeam = await prisma.team.findUnique({
            where: {
                organizationId_slug: {
                    organizationId,
                    slug: data.slug
                }
            },
            select: {
                id: true
            }
        });

        if (existingTeam) {
            throw new ApiErrors(409, "A team with this slug already exists in this organization");
        }

        const team =
            await prisma.$transaction(async (tx) => {

                const newTeam = await tx.team.create({
                    data: {
                        organizationId,
                        name: data.name,
                        slug: data.slug,
                        description: data.description || null,
                        avatar: data.avatar || null
                    }
                });

                await tx.teamMember.create({
                    data: {
                        teamId: newTeam.id,
                        userId,
                        role: TeamRole.OWNER
                    }
                });

                return newTeam;
            });

        return team;


    }
    catch (error) {
       throw new ApiErrors(  409,"A team with this slug already exists in this organization")
    }
}

export const getOrganizationTeams = async (organizationId: string,page: number,limit: number,search?: string,includeInactive = false) => {

    const skip = (page - 1) * limit;

    const where: Prisma.TeamWhereInput = {
        organizationId,

        ...(includeInactive
            ? {}
            : {
                isActive: true
            }),

        ...(search
            ? {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive"
                        }
                    },
                    {
                        slug: {
                            contains: search,
                            mode: "insensitive"
                        }
                    }
                ]
            }
            : {})
    };

    const [teams, total] = await prisma.$transaction([
        prisma.team.findMany({
            where,
            skip,
            take: limit,

            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                avatar: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,

                _count: {
                    select: {
                        members: true
                    }
                }
            },

            orderBy: {
                createdAt: "desc"
            }
        }),

        prisma.team.count({
            where
        })
    ]);

    return {
        teams: teams.map(team => ({
            ...team,
            memberCount: team._count.members
        })),

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};


export const getTeamDetails = async (teamId: string) => {

    const team = await prisma.team.findUnique({
        where: {
            id: teamId
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
            updatedAt: true,

            _count: {
                select: {
                    members: true
                }
            }
        }
    });

    if (!team) {
        throw new ApiErrors(404,"Team not found");
    }

    return {
        ...team,
        memberCount: team._count.members
    };
};