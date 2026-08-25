import { Request, Response } from "express";
import * as organizationDiscoveryServices from "./OrganizationDiscoveryServices.js";
import { discoverOrganizationsSchema} from "./OrganizationDiscoveryValidation.js";
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