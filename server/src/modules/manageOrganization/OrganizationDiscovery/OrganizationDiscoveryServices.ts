import {OrganizationVisibility,Prisma} from "@prisma/client";

import prisma from "../../../config/prisma.js";

export const discoverOrganizations = async (
    search: string | undefined,
    page: number,
    limit: number
) => {

    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {
        visibility: OrganizationVisibility.PUBLIC,
        isActive: true,

        ...(search
            ? {
                  OR: [
                      {
                          name: {
                              contains: search,
                              mode: "insensitive",
                          },
                      },
                      {
                          slug: {
                              contains: search,
                              mode: "insensitive",
                          },
                      },
                  ],
              }
            : {}),
    };

    const [organizations, total] =
        await prisma.$transaction([
            prisma.organization.findMany({
                where,

                skip,
                take: limit,

                select: {
                    id: true,
                    name: true,
                    slug: true,
                    avatar: true,
                    visibility: true,
                    allowJoinRequests: true,
                },

                orderBy: {
                    name: "asc",
                },
            }),

            prisma.organization.count({
                where,
            }),
        ]);

    return {
        organizations,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};