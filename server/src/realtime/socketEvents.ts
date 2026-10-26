export const REALTIME_CHANNELS = {
    MESSAGE_CREATED : "realtime:message:created",
    MESSAGE_UPDATED: "realtime:message:updated",
    MESSAGE_DELETED: "realtime:message:deleted",
}as const ;

export const SOCKET_EVENTS = {
    MESSAGE_CREATED: "message:new",
    MESSAGE_UPDATED: "message:updated",
    MESSAGE_DELETED: "message:deleted",
} as const;

