import { Request, Response } from "express";
import * as organizationDiscoveryServices from "./OrganizationDiscoveryServices.js";
import { discoverOrganizationsSchema, organizationSlugSchema } from "./OrganizationDiscoveryValidation.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";



export const discoverOrganizations = async (req: Request,res: Response ) => {
    const result = discoverOrganizationsSchema.safeParse(req.query);

    if (!result.success) {
        throw new ApiErrors(400,"Invalid discovery parameters");
    }

    const organizations =
        await organizationDiscoveryServices.discoverOrganizations(
            result.data.search,
            result.data.page,
            result.data.limit
        );

    return res.status(200).json({
        success: true,
        message: "Organizations fetched successfully",
        data: organizations.organizations,
        pagination: organizations.pagination
    });
};

export const getDiscoverableOrganization = async (
    req: Request,
    res: Response
) => {

    const result = organizationSlugSchema.safeParse({slug: req.params.slug });

    if (!result.success) {
        throw new ApiErrors( 400, "Invalid organization slug" );
    }

    const organization =
        await organizationDiscoveryServices.getDiscoverableOrganization(result.data.slug);

    return res.status(200).json({
        success: true,
        message: "Organization fetched successfully",
        data: organization
    });
};