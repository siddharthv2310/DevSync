export const REALTIME_CHANNELS = {
    MESSAGE_CREATED : "realtime:message:created",
    MESSAGE_UPDATED: "realtime:message:updated",
    MESSAGE_DELETED: "realtime:message:deleted",
    REACTION_UPDATED: "realtime:reaction:updated",
    THREAD_REPLY_CREATED: "realtime:thread:reply:created",
    MESSAGE_READ: "realtime:message:read",

    MESSAGE_PINNED: "realtime:message:pinned",
    MESSAGE_UNPINNED: "realtime:message:unpinned",

    NOTIFICATION_CREATED: "realtime:notification:created",
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

    NOTIFICATION_NEW: "notification:new",
    NOTIFICATION_READ: "notification:read",
    NOTIFICATION_READ_ALL: "notification:read-all",
    NOTIFICATION_DELETED: "notification:deleted",
    NOTIFICATION_UNREAD_COUNT_UPDATED: "notification:unread-count-updated",
    } as const;

