import { Request, Response } from "express";

import * as organizationSettingsServices from "./OrganizationSettingServices.js";

import { updateOrganizationSettingsSchema, updateOrganizationVisibilitySchema } from "./organizationSettingValidation.js";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";



export const getOrganizationSettings = async ( req: Request, res: Response) => {

    const organizationId = req.organization!.id;

    const settings = await organizationSettingsServices.getOrganizationSettings(organizationId);

    return res.status(200).json({
        success: true,
        message: "Organization settings fetched successfully",
        data: settings
    });
};

export const updateOrganizationSettings = async ( req: Request, res: Response ) => {

    const organizationId = req.organization!.id;

    const result = updateOrganizationSettingsSchema.safeParse( req.body );

    if (!result.success) {
        throw new ApiErrors( 400, "Invalid organization settings");
    }

    const allowJoinRequests = result.data.allowJoinRequests ?? false;

    const settings = await organizationSettingsServices .updateOrganizationSettings( organizationId, allowJoinRequests );

    return res.status(200).json({
        success: true,
        message: "Organization settings updated successfully",
        data: settings
    });
};

export const updateOrganizationVisibility = async ( req: Request, res: Response) => {

    const organizationId = req.organization!.id;

    const result = updateOrganizationVisibilitySchema.safeParse(req.body);

    if (!result.success) {
        throw new ApiErrors( 400,"Invalid organization visibility");
    }

    const organization =await organizationSettingsServices.updateOrganizationVisibility(organizationId,result.data.visibility);

    return res.status(200).json({
        success: true,
        message: "Organization visibility updated successfully",
        data: organization
    });
};