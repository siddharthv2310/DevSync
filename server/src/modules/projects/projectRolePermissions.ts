import { projectRole } from "@prisma/client";
import { projectPermission } from "./projectPermissions.js";

export const projectRolePermissions: Record<projectRole, projectPermission[]> = {
  
  [projectRole.OWNER]: [
    // Project
    projectPermission.VIEW_PROJECT,
    projectPermission.UPDATE_PROJECT,
    projectPermission.ARCHIVE_PROJECT,
    projectPermission.RESTORE_PROJECT,
    projectPermission.DELETE_PROJECT,

    // Members
    projectPermission.VIEW_MEMBERS,
    projectPermission.ADD_MEMBERS,
    projectPermission.REMOVE_MEMBERS,
    projectPermission.UPDATE_MEMBER_ROLE,
    projectPermission.TRANSFER_OWNERSHIP,

    // Settings
    projectPermission.VIEW_SETTINGS,
    projectPermission.UPDATE_SETTINGS,

    // Invitations
    projectPermission.CREATE_INVITATION,
    projectPermission.VIEW_INVITATIONS,
    projectPermission.CANCEL_INVITATION,
  ],

  [projectRole.ADMIN]: [
    // Project
    projectPermission.VIEW_PROJECT,
    projectPermission.UPDATE_PROJECT,
    projectPermission.ARCHIVE_PROJECT,
    projectPermission.RESTORE_PROJECT,

    // Members
    projectPermission.VIEW_MEMBERS,
    projectPermission.ADD_MEMBERS,
    projectPermission.REMOVE_MEMBERS,
    projectPermission.UPDATE_MEMBER_ROLE,

    // Settings
    projectPermission.VIEW_SETTINGS,
    projectPermission.UPDATE_SETTINGS,

    // Invitations
    projectPermission.CREATE_INVITATION,
    projectPermission.VIEW_INVITATIONS,
    projectPermission.CANCEL_INVITATION,
  ],

  [projectRole.MEMBER]: [
    projectPermission.VIEW_PROJECT,
    projectPermission.VIEW_MEMBERS,
    projectPermission.VIEW_SETTINGS,
  ],

  [projectRole.VIEWER]: [
    projectPermission.VIEW_PROJECT,
    projectPermission.VIEW_MEMBERS,
    projectPermission.VIEW_SETTINGS,
  ],
};