export enum organizationPermission{
    VIEW_ORGANIZATION = "organization:view",
    UPDATE_ORGANIZATION = "organization:update",
    DELETE_ORGANIZATION = "organization:delete",
    TRANSFER_OWNERSHIP = "organization:transfer-ownership",

    
    UPDATE_ORGANIZATION_SETTINGS = "organization-settings:update",
    VIEW_ORGANIZATION_SETTINGS = "organization-setting:view",
    UPDATE_ORGANIZATION_VISIBILITY = "organization-settings:visibility",
    VIEW_MEMBERS = "members:view",
    INVITE_MEMBERS = "members:invite",
    VIEW_INVITATIONS = "invitations:view",
    CANCEL_INVITATION = "invitations:cancel",
    VIEW_JOIN_REQUESTS = "join-requests:view",
    APPROVE_JOIN_REQUEST = "join-requests:approve",
    REJECT_JOIN_REQUEST = "join-requests:reject",
    REMOVE_MEMBERS = "members:remove",
    UPDATE_MEMBER_ROLE = "members:update-role"
}