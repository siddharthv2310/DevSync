import { Prisma, projectRole } from "@prisma/client";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma from "../../../config/prisma.js";
import { AddProjectMemberInput, GetProjectMembersQuery } from "./projectMemberValidation.js";

export const getProjectMembers = async (projectId: string, query: GetProjectMembersQuery) => {

    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const where = {
        projectId,

        ...(search && {
            user: {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        username: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        email: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            },
        }),
    };

    const [members, totalMembers] = await prisma.$transaction([
        prisma.projectMember.findMany({
            where,
            skip,
            take: limit,

            select: {
                id: true,
                userId: true,
                role: true,
                joinedAt: true,

                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        avatar: true,
                    },
                },
            },

            orderBy: {
                joinedAt: "asc",
            },
        }),

        prisma.projectMember.count({
            where,
        }),
    ]);

    return {
        members,

        pagination: {
            page,
            limit,
            totalMembers,
            totalPages: Math.ceil(totalMembers / limit),
            hasNextPage: page < Math.ceil(totalMembers / limit),
            hasPreviousPage: page > 1,
        },
    };
};


export const addProjectMember = async (organizationId: string, projectId: string, data: AddProjectMemberInput) => {

    try {
        return await prisma.$transaction(async (tx) => {

            // 1. Check whether the project exists in this organization
            const project = await tx.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
                select: {
                    id: true,
                    isArchived: true,
                },
            });

            if (!project) {
                throw new ApiErrors(404, "Project not found");
            }

            // 2. Do not allow adding members to archived projects
            if (project.isArchived) {
                throw new ApiErrors(
                    409,
                    "Cannot add members to an archived project"
                );
            }

            // 3. Check whether the user belongs to this organization
            const organizationMembership = await tx.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId,
                        userId: data.userId,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (!organizationMembership) {
                throw new ApiErrors(
                    400,
                    "User is not a member of this organization"
                );
            }

            // 4. Check whether the user is already in the project
            const existingMembership = await tx.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: data.userId,
                    },
                },
            });

            if (existingMembership) {
                throw new ApiErrors(
                    409,
                    "User is already a member of this project"
                );
            }

            // 5. Create project membership
            const newMember = await tx.projectMember.create({
                data: {
                    projectId,
                    userId: data.userId,
                    role: data.role as projectRole,
                },
                select: {
                    id: true,
                    projectId: true,
                    userId: true,
                    role: true,
                    joinedAt: true,

                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            return newMember;
        });

    }
    catch (error) {

        // Handle duplicate membership if two requests arrive together
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ApiErrors(
                409,
                "User is already a member of this project"
            );
        }

        throw error;
    }
};