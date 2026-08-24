import { Request, Response, NextFunction } from "express";
import { organizationPermission } from "../modules/manageOrganization/Organization/organizationPermission.js";
import { ApiErrors } from "../common/errors/ApiErrors.js";
import { rolePermissions } from "../modules/manageOrganization/Organization/OrganizationRolePermissions.js";

export const requireOrganizationPermission = ( permission: organizationPermission ) => {
    return ( req: Request, res: Response, next: NextFunction) => {
        try {
            const membership = req.organizationMember;

            if (!membership) {
                throw new ApiErrors(403, "Organization membership required");
            }

            const permissions = rolePermissions[membership.role];

            if (!permissions.includes(permission)) {
                throw new ApiErrors(403,"You do not have permission to perform this action");
            }

            next();
        } 
        catch (error) {
            next(error);
        }
    };
};