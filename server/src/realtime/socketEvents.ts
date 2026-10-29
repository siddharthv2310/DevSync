export const REALTIME_CHANNELS = {
    MESSAGE_CREATED : "realtime:message:created",
    MESSAGE_UPDATED: "realtime:message:updated",
    MESSAGE_DELETED: "realtime:message:deleted",
    REACTION_UPDATED: "realtime:reaction:updated",
}as const ;

export const SOCKET_EVENTS = {
    MESSAGE_CREATED: "message:new",
    MESSAGE_UPDATED: "message:updated",
    MESSAGE_DELETED: "message:deleted",
    REACTION_UPDATED: "reaction:updated",
} as const;

