export enum organizationPermission{
    VIEW_ORGANIZATION = "organization:view",
    UPDATE_ORGANIZATION = "organization:update",
    DELETE_ORGANIZATION = "organization:delete",
    TRANSFER_OWNERSHIP = "organization:transfer-ownership",


    VIEW_ORGANIZATION_SETTINGS = "organization-setting:view",
    UPDATE_ORGANIZATION_SETTINGS = "organization-settings:update",
    UPDATE_ORGANIZATION_VISIBILITY = "organization-settings:visibility",


    VIEW_MEMBERS = "members:view",
    INVITE_MEMBERS = "members:invite",
    REMOVE_MEMBERS = "members:remove",    
    UPDATE_MEMBER_ROLE = "members:update-role",
    

    VIEW_INVITATIONS = "invitations:view",
    CANCEL_INVITATION = "invitations:cancel",


    VIEW_JOIN_REQUESTS = "join-requests:view",
    APPROVE_JOIN_REQUEST = "join-requests:approve",
    REJECT_JOIN_REQUEST = "join-requests:reject",


    CREATE_PROJECT = "projects:create",
    VIEW_PROJECT = "projects:view",
    UPDATE_PROJECT = "projects:update",
    ARCHIEVE_PROJECT = "projects:archieve",
    DELETE_PROJECT = "projects:delete",

}