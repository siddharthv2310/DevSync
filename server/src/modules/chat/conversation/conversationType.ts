
export interface GetOrganizationConversationParams {
    organizationId: string;
}

export interface GetTeamConversationParams {
    organizationId: string;
    teamId: string;
}

export interface GetProjectConversationParams {
    organizationId: string;
    projectId: string;
}

export interface GetDirectConversationBody {
    otherUserId: string;
}

export interface GetConversationParams {
    conversationId: string;
}