import { OrganizationRole } from "@prisma/client";
import { organizationPermission } from "./organizationPermission.js";

export const rolePermissions: Record<OrganizationRole,organizationPermission[]> = {
    [OrganizationRole.OWNER]: [

        organizationPermission.VIEW_ORGANIZATION,
        organizationPermission.UPDATE_ORGANIZATION,
        organizationPermission.DELETE_ORGANIZATION,
        organizationPermission.TRANSFER_OWNERSHIP,

        organizationPermission.UPDATE_ORGANIZATION_SETTINGS,
        organizationPermission.VIEW_ORGANIZATION_SETTINGS,
        organizationPermission.UPDATE_ORGANIZATION_VISIBILITY,

        organizationPermission.VIEW_MEMBERS,
        organizationPermission.INVITE_MEMBERS,
        organizationPermission.REMOVE_MEMBERS,
        organizationPermission.UPDATE_MEMBER_ROLE,

        organizationPermission.VIEW_INVITATIONS,
        organizationPermission.CANCEL_INVITATION,

        organizationPermission.VIEW_JOIN_REQUESTS,
        organizationPermission.APPROVE_JOIN_REQUEST,
        organizationPermission.REJECT_JOIN_REQUEST ,
        
        organizationPermission.CREATE_PROJECT,
        organizationPermission.VIEW_PROJECT,
        organizationPermission.UPDATE_PROJECT,
        organizationPermission.ARCHIEVE_PROJECT,
        organizationPermission.DELETE_PROJECT,

        organizationPermission.CREATE_TEAM,
        organizationPermission.VIEW_TEAMS,

    ],
    [OrganizationRole.ADMIN]:[
        organizationPermission.VIEW_ORGANIZATION,
        organizationPermission.UPDATE_ORGANIZATION,

        organizationPermission.UPDATE_ORGANIZATION_SETTINGS,
        organizationPermission.VIEW_ORGANIZATION_SETTINGS,

        organizationPermission.REMOVE_MEMBERS,
        organizationPermission.UPDATE_MEMBER_ROLE,
        organizationPermission.VIEW_MEMBERS,
        organizationPermission.INVITE_MEMBERS,

        organizationPermission.VIEW_INVITATIONS,
        organizationPermission.CANCEL_INVITATION,

        organizationPermission.VIEW_JOIN_REQUESTS,
        organizationPermission.APPROVE_JOIN_REQUEST,
        organizationPermission.REJECT_JOIN_REQUEST ,
        
        organizationPermission.CREATE_PROJECT,
        organizationPermission.VIEW_PROJECT,
        organizationPermission.UPDATE_PROJECT,
        organizationPermission.ARCHIEVE_PROJECT,

        organizationPermission.CREATE_TEAM,
        organizationPermission.VIEW_TEAMS,
        
    ],

    [OrganizationRole.MEMBER]:[
        organizationPermission.VIEW_ORGANIZATION,

        organizationPermission.VIEW_MEMBERS,

        organizationPermission.VIEW_PROJECT,

        organizationPermission.VIEW_TEAMS,
    ]


};