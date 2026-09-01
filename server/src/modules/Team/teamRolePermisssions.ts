import { TeamRole } from "@prisma/client";
import { teamPermission } from "./teamPermissions.js";

export const teamRolePermissions: Record<TeamRole, teamPermission[] > = {
    [TeamRole.OWNER] : [
        teamPermission.VIEW_TEAM,
        teamPermission.UPDATE_TEAM,
        teamPermission.ARCHIVE_TEAM,
        teamPermission.DELETE_TEAM,
        teamPermission.TRANSFER_OWNERSHIP,

        teamPermission.VIEW_MEMBERS,
        teamPermission.ADD_MEMBERS,
        teamPermission.REMOVE_MEMBERS,
        teamPermission.UPDATE_MEMBER_ROLE,

        teamPermission. INVITE_MEMBERS,
        teamPermission.VIEW_INVITATIONS,
        teamPermission.CANCEL_INVITATION,

        teamPermission.VIEW_JOIN_REQUESTS,
        teamPermission.APPROVE_JOIN_REQUEST,
        teamPermission.REJECT_JOIN_REQUEST,
    ],
    [TeamRole.ADMIN] : [
        teamPermission.VIEW_TEAM,
        teamPermission.UPDATE_TEAM,
        teamPermission.ARCHIVE_TEAM,

        teamPermission.VIEW_MEMBERS,
        teamPermission.ADD_MEMBERS,
        teamPermission.REMOVE_MEMBERS,
        teamPermission.UPDATE_MEMBER_ROLE,
        
        teamPermission. INVITE_MEMBERS,
        teamPermission.VIEW_INVITATIONS,
        teamPermission.CANCEL_INVITATION,

        teamPermission.VIEW_JOIN_REQUESTS,
        teamPermission.APPROVE_JOIN_REQUEST,
        teamPermission.REJECT_JOIN_REQUEST,
    ],
    [TeamRole.MEMBER]:[
        teamPermission.VIEW_TEAM,
        teamPermission.VIEW_MEMBERS,
    ]
}