import { OrganizationRole } from "@prisma/client";
import { organizationPermission } from "./organizationPermission.js";

export const rolePermissions: Record<OrganizationRole,organizationPermission[]> = {
    [OrganizationRole.OWNER]: [
        organizationPermission.VIEW_ORGANIZATION,
        organizationPermission.UPDATE_ORGANIZATION,
        organizationPermission.DELETE_ORGANIZATION,
        organizationPermission.TRANSFER_OWNERSHIP,


        organizationPermission.VIEW_MEMBERS,
        organizationPermission.INVITE_MEMBERS,
        organizationPermission.VIEW_INVITATIONS,
        organizationPermission.CANCEL_INVITATION,
        organizationPermission.VIEW_JOIN_REQUESTS,
        organizationPermission.REMOVE_MEMBERS,
        organizationPermission.UPDATE_MEMBER_ROLE
    ],
    [OrganizationRole.ADMIN]:[
        organizationPermission.VIEW_ORGANIZATION,
        organizationPermission.UPDATE_ORGANIZATION,

        organizationPermission.VIEW_MEMBERS,
        organizationPermission.INVITE_MEMBERS,
        organizationPermission.VIEW_INVITATIONS,
        organizationPermission.CANCEL_INVITATION,
        organizationPermission.VIEW_JOIN_REQUESTS,
        organizationPermission.REMOVE_MEMBERS,
        organizationPermission.UPDATE_MEMBER_ROLE
    ],

    [OrganizationRole.MEMBER]:[
        organizationPermission.VIEW_ORGANIZATION,
        organizationPermission.VIEW_MEMBERS
    ]


};