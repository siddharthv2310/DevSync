import {OrganizationVisibility,Prisma} from "@prisma/client";
import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

export const discoverOrganizations = async ( search: string | undefined,page: number,limit: number ) => {

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

    const [organizations, total] = await prisma.$transaction([
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

export const getDiscoverableOrganization = async (
    slug: string
) => {

    const organization =
        await prisma.organization.findFirst({
            where: {
                slug,
                visibility: OrganizationVisibility.PUBLIC,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                slug: true,
                avatar: true,
                visibility: true,
                allowJoinRequests: true,

                _count: {
                    select: {
                        members: true
                    }
                }
            }
        });

    if (!organization) {
        throw new ApiErrors(404,"Organization not found");
    }

    return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        avatar: organization.avatar,
        visibility: organization.visibility,
        allowJoinRequests: organization.allowJoinRequests,
        memberCount: organization._count.members
    };
};