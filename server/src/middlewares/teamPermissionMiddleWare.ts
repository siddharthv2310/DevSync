import { Request, Response, NextFunction } from "express";
import { OrganizationRole } from "@prisma/client";
import { ApiErrors } from "../common/errors/ApiErrors.js";
import { teamPermission } from "../modules/Team/teamPermissions.js";
import { teamRolePermissions } from "../modules/Team/teamRolePermisssions.js";




export const requireTeamPermission = (permission: teamPermission) => {

    return (req: Request, res: Response,next: NextFunction) => {

        try {

            const organizationMember = req.organizationMember;

            const teamMember = req.teamMember;

            if (!organizationMember) {
                throw new ApiErrors( 403, "Organization membership required" );
            }


            const isOrganizationManager = organizationMember.role ===  OrganizationRole.OWNER || organizationMember.role === OrganizationRole.ADMIN;

            if (isOrganizationManager) {
                return next();
            }

            if (!teamMember) {
                throw new ApiErrors( 403,"Team membership required" );
            }

            const permissions = teamRolePermissions[ teamMember.role];

            if (!permissions.includes(permission)) {
                throw new ApiErrors( 403, "You do not have permission to perform this action" );
            }

            next();

        } 
        catch (error) {
            next(error);
        }
    };
};