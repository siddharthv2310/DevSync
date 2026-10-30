export const REALTIME_CHANNELS = {
    MESSAGE_CREATED : "realtime:message:created",
    MESSAGE_UPDATED: "realtime:message:updated",
    MESSAGE_DELETED: "realtime:message:deleted",
    REACTION_UPDATED: "realtime:reaction:updated",
    THREAD_REPLY_CREATED: "realtime:thread:reply:created",
    MESSAGE_READ: "realtime:message:read",

    MESSAGE_PINNED: "realtime:message:pinned",
    MESSAGE_UNPINNED: "realtime:message:unpinned",
}as const ;

export const SOCKET_EVENTS = {
    MESSAGE_CREATED: "message:new",
    MESSAGE_UPDATED: "message:updated",
    MESSAGE_DELETED: "message:deleted",
    REACTION_UPDATED: "reaction:updated",
    THREAD_REPLY_CREATED: "thread:reply:created",
    MESSAGE_READ: "message:read",

    MESSAGE_PINNED: "message:pinned",
    MESSAGE_UNPINNED: "message:unpinned",
} as const;

