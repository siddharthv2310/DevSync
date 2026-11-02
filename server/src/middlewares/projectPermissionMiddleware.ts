
import { Request, Response, NextFunction } from "express";
import { OrganizationRole } from "@prisma/client";

import { ApiErrors } from "../common/errors/ApiErrors.js";
import { projectPermission } from "../modules/projects/projectPermissions.js";
import { projectRolePermissions } from "../modules/projects/projectRolePermissions.js";

const archivedProjectAllowedPermissions: projectPermission[] = [
  projectPermission.VIEW_PROJECT,
  projectPermission.VIEW_MEMBERS,
  projectPermission.VIEW_SETTINGS,
  projectPermission.VIEW_INVITATIONS,
  projectPermission.RESTORE_PROJECT,
  projectPermission.DELETE_PROJECT,
];

export const requireProjectPermission = (permission: projectPermission ) => {

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationMember = req.organizationMember;

      const projectMember = req.projectMember;

      const project = req.project;

      if (!organizationMember) {
        throw new ApiErrors(403, "Organization membership required");
      }

      if (!project) {
        throw new ApiErrors(404, "Project not found");
      }

      // Archived projects are read-only, except for restore and delete.
      if (
        project.isArchived &&
        !archivedProjectAllowedPermissions.includes(permission)
      ) {
        throw new ApiErrors(
          403,
          "This project is archived. Restore it before making changes."
        );
      }

      // Organization OWNER and ADMIN have organization-level access.
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
        throw new ApiErrors(
          403,
          "You do not have permission to perform this action"
        );
      }

      return next();
    } 
    catch (error) {
      return next(error);
    }
  };
};
