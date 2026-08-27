import prisma from "../../config/prisma.js";
import { Prisma, TeamRole } from "@prisma/client";
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
        throw new ApiErrors(409, "A team with this slug already exists in this organization")
    }
}

export const getOrganizationTeams = async (organizationId: string, page: number, limit: number, search?: string, includeInactive = false) => {

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
        throw new ApiErrors(404, "Team not found");
    }

    return {
        ...team,
        memberCount: team._count.members
    };
};


export const getTeamMembers = async (teamId: string, page: number, limit: number, search?: string) => {

    const skip = (page - 1) * limit;

    const where: Prisma.TeamMemberWhereInput = {
        teamId,

        ...(search
            ? {
                user: {
                    OR: [
                        {
                            name: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            username: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            email: {
                                contains: search,
                                mode: "insensitive"
                            }
                        }
                    ]
                }
            }
            : {})
    };

    const [members, total] = await prisma.$transaction([

        prisma.teamMember.findMany({
            where,

            skip,
            take: limit,

            select: {
                id: true,
                role: true,
                joinedAt: true,

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
                joinedAt: "asc"
            }
        }),

        prisma.teamMember.count({
            where
        })
    ]);

    return {
        members,

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

export const addTeamMember = async (organizationId: string, teamId: string, userId: string, role: TeamRole) => {

    try {

        const organizationMember = await prisma.organizationMember.findUnique({
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

        if (!organizationMember) {
            throw new ApiErrors(404, "User is not a member of this organization");
        }


        if (role === TeamRole.OWNER) {
            throw new ApiErrors(400, "Team ownership cannot be assigned when adding a member");
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
            throw new ApiErrors(409, "User is already a member of this team");
        }

        const teamMember = await prisma.teamMember.create({

            data: {
                teamId,
                userId,
                role
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
                        email: true,
                        avatar: true
                    }
                }
            }
        });

        return teamMember;

    } 
    catch (error) {

        if (error instanceof Prisma.PrismaClientKnownRequestError ) {

            if (error.code === "P2002") {
                
                throw new ApiErrors( 409, "User is already a member of this team");
            }
        }

        throw error;
    }
};