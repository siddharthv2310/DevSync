import { Request, Response, NextFunction } from "express";
import { ApiErrors } from "../common/errors/ApiErrors.js";
import { projectPermission } from "../modules/projects/projectPermissions.js";
import { projectRolePermissions } from "../modules/projects/projectRolePermissions.js";
import { OrganizationRole } from "@prisma/client";

export const requireProjectPermission = ( permission: projectPermission ) => {

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationMember = req.organizationMember;
      const projectMember = req.projectMember;

      if (!organizationMember) {
        throw new ApiErrors(403, "Organization membership required");
      }

      // Organization OWNER and ADMIN can manage projects
      // within their organization, subject to route-level restrictions.
      const isOrganizationManager =
        organizationMember.role === OrganizationRole.OWNER ||
        organizationMember.role === OrganizationRole.ADMIN;

      if (isOrganizationManager) {
        return next();
      }

      if (!projectMember) {
        throw new ApiErrors(403, "Project membership required");
      }

      const allowedPermissions = projectRolePermissions[projectMember.role];

      if (!allowedPermissions?.includes(permission)) {
        throw new ApiErrors( 403, "You do not have permission to perform this action");
      }

      return next();
    } 
    catch (error) {
      next(error);
    }
  };
};