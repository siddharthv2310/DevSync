export enum teamPermission {
    VIEW_TEAM = "team:view",
    UPDATE_TEAM = "team:update",
    ARCHIVE_TEAM = "team:archive",
    DELETE_TEAM = "team:delete",
    TRANSFER_OWNERSHIP = "team:transfer-ownership",

    VIEW_MEMBERS = "team-members:view",
    ADD_MEMBERS = "team-members:add",
    REMOVE_MEMBERS = "team-members:remove",
    UPDATE_MEMBER_ROLE = "team-members:update-role"
}