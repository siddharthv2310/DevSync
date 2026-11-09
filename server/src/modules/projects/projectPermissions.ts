export enum projectPermission {
  // Project
  VIEW_PROJECT = "project:view",
  UPDATE_PROJECT = "project:update",
  ARCHIVE_PROJECT = "project:archive",
  RESTORE_PROJECT = "project:restore",
  DELETE_PROJECT = "project:delete",

  // Project members
  VIEW_MEMBERS = "project-members:view",
  ADD_MEMBERS = "project-members:add",
  REMOVE_MEMBERS = "project-members:remove",
  UPDATE_MEMBER_ROLE = "project-members:update-role",
  TRANSFER_OWNERSHIP = "project-members:transfer-ownership",

  // Project settings
  VIEW_SETTINGS = "project-settings:view",
  UPDATE_SETTINGS = "project-settings:update",

  // Project invitations
  CREATE_INVITATION = "project-invitations:create",
  VIEW_INVITATIONS = "project-invitations:view",
  CANCEL_INVITATION = "project-invitations:cancel",

  // Project tasks
  CREATE_TASK = "task:create",
  VIEW_TASK = "task:view",
  UPDATE_TASK = "task:update",
  DELETE_TASK = "task:delete",


  // Task lebels
  MANAGE_TASK_LABELS = " task-lebel:manage",

  // Task comments
  CREATE_TASK_COMMENT = "task-comment:create",
  UPDATE_TASK_COMMENT = "task-comment:update",
  DELETE_TASK_COMMENT = "task-comment:delete",
}