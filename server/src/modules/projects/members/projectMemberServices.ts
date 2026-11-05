import prisma from "../../../config/prisma.js";
import { GetProjectMembersQuery } from "./projectMemberValidation.js";

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