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

    // Tasks
    projectPermission.CREATE_TASK,
    projectPermission.VIEW_TASK,
    projectPermission.UPDATE_TASK,
    projectPermission.DELETE_TASK,

    // Task lebel
    projectPermission.MANAGE_TASK_LABELS,

    // task comments
    projectPermission.CREATE_TASK_COMMENT,
    projectPermission.UPDATE_TASK_COMMENT,
    projectPermission.DELETE_TASK_COMMENT,
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

    // Tasks
    projectPermission.CREATE_TASK,
    projectPermission.VIEW_TASK,
    projectPermission.UPDATE_TASK,
    projectPermission.DELETE_TASK,
    
    // Task labels
    projectPermission.MANAGE_TASK_LABELS,

    // task comments
    projectPermission.CREATE_TASK_COMMENT,
    projectPermission.UPDATE_TASK_COMMENT,
    projectPermission.DELETE_TASK_COMMENT,
  ],

  [projectRole.MEMBER]: [
    projectPermission.VIEW_PROJECT,
    projectPermission.VIEW_MEMBERS,
    projectPermission.VIEW_SETTINGS,

    // Tasks
    projectPermission.CREATE_TASK,
    projectPermission.VIEW_TASK,
    projectPermission.UPDATE_TASK,

    // task comments
    projectPermission.CREATE_TASK_COMMENT,
    projectPermission.UPDATE_TASK_COMMENT,
    projectPermission.DELETE_TASK_COMMENT,
  ],

  [projectRole.VIEWER]: [
    projectPermission.VIEW_PROJECT,
    projectPermission.VIEW_MEMBERS,
    projectPermission.VIEW_SETTINGS,

    // Tasks
    projectPermission.VIEW_TASK,
  ],
};