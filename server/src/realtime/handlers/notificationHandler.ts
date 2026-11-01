import type { Server } from "socket.io";
import { subscribeToChannel } from "../redis/redisPubSub.js";
import {REALTIME_CHANNELS,SOCKET_EVENTS,} from "../socketEvents.js";

interface NotificationCreatedEvent {
    userId: string;
    notification: {
        id: string;
        recipientId: string;
        type: string;
        title: string;
        body: string;
        actionUrl: string | null;
        createdAt: Date | string;
        [key: string]: unknown;
    };
    unreadCount: number;
}

export const subscribeToNotificationEvents = async (io: Server) => {
    await subscribeToChannel(REALTIME_CHANNELS.NOTIFICATION_CREATED,(message) => {
            try {
                const event = JSON.parse( message ) as NotificationCreatedEvent;

                if (!event.userId || !event.notification?.id) {
                    console.error(
                        "Invalid notification event received from Redis"
                    );
                    return;
                }

                io.to(`user:${event.userId}`).emit(
                    SOCKET_EVENTS.NOTIFICATION_NEW,
                    event.notification
                );

                io.to(`user:${event.userId}`).emit(
                    SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT_UPDATED,
                    {
                        unreadCount: event.unreadCount,
                    }
                );
            } 
            catch (error) {
                console.error(
                    "Failed to process Redis notification event:",
                    error
                );
            }
        }
    );

    console.log("Subscribed to notification events");
};