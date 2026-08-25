import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";



export const getOrganizationSettings = async (
    organizationId: string
) => {
    const settings = await prisma.organization.findUnique({
        where: {
            id: organizationId
        },
        select: {
            id: true,
            visibility: true,
            allowJoinRequests: true
        }
    });

    if (!settings) {
        throw new ApiErrors(
            404,
            "Organization not found"
        );
    }

    return settings;
};

export const updateOrganizationSettings = async (
    organizationId: string,
    allowJoinRequests: boolean
) => {
    const settings = await prisma.organization.update({
        where: {
            id: organizationId
        },
        data: {
            allowJoinRequests
        },
        select: {
            id: true,
            allowJoinRequests: true,
            updatedAt: true
        }
    });

    return settings;
};

import {
    OrganizationVisibility
} from "@prisma/client";

export const updateOrganizationVisibility = async ( organizationId: string, visibility: OrganizationVisibility) => {

    const organization = await prisma.organization.update({
            where: {
                id: organizationId
            },
            data: {
                visibility
            },
            select: {
                id: true,
                name: true,
                slug: true,
                visibility: true,
                updatedAt: true
            }
        });

    return organization;
};