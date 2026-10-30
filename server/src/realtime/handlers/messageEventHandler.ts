import { Server } from "socket.io";
import { subscribeToChannel } from "../redis/redisPubSub.js";
import { REALTIME_CHANNELS, SOCKET_EVENTS, } from "../socketEvents.js";

interface MessageEvent {
    conversationId: string;
    message: unknown;
}
interface MessageDeletedEvent {
    conversationId: string;
    messageId: string;
    deletedAt: string;
    deletedById: string;
}

interface ReactionUpdatedEvent {
    conversationId: string,
    messageId: string,
}

interface ThreadReplyCreatedEvent {
    conversationId: string;
    threadRootId: string;
    message: {
        id: string;
        conversationId: string;
        replyToId: string | null;
        threadRootId: string | null;
    };
}

interface MessageReadEvent {
    conversationId: string;
    messageIds: string[];
    userId: string;
    readAt: string;
}


export const subscribeToMessageEvents = async (io: Server) => {
    const subscribeToMessageEvent = async (channel: string, socketEvent: string) => {

        await subscribeToChannel(channel, (rawMessage) => {
            try {
                const event = JSON.parse(rawMessage) as MessageEvent;

                if (!event.conversationId || !event.message) {
                    console.error(`Invalid event received on ${channel}`);
                    return;
                }

                io.to(`conversation:${event.conversationId}`).emit(
                    socketEvent,
                    event.message
                );
            } catch (error) {
                console.error(`Failed to process event on ${channel}:`, error);
            }
        });

        console.log(`Subscribed to ${channel}`);
    };

    await subscribeToMessageEvent(
        REALTIME_CHANNELS.MESSAGE_CREATED,
        SOCKET_EVENTS.MESSAGE_CREATED
    );

    await subscribeToMessageEvent(
        REALTIME_CHANNELS.MESSAGE_UPDATED,
        SOCKET_EVENTS.MESSAGE_UPDATED
    );


    await subscribeToChannel(REALTIME_CHANNELS.MESSAGE_DELETED, (rawMessage) => {

        try {
            const event = JSON.parse(rawMessage) as MessageDeletedEvent;

            if (!event.conversationId || !event.messageId || !event.deletedAt || !event.deletedById) {
                console.error("Invalid message-deleted event");
                return;
            }

            io.to(`conversation:${event.conversationId}`).emit(
                SOCKET_EVENTS.MESSAGE_DELETED,
                event
            );
        }
        catch (error) {
            console.error(
                "Failed to process message-deleted event:",
                error
            );
        }
    }
    );

    console.log(`Subscribed to ${REALTIME_CHANNELS.MESSAGE_DELETED}`);

    await subscribeToChannel(REALTIME_CHANNELS.REACTION_UPDATED, (rawMessage) => {

        try {
            const event = JSON.parse(rawMessage) as ReactionUpdatedEvent;

            if (!event.conversationId || !event.messageId) {
                console.error("Invalid reaction-updated event");
                return;
            }

            io.to(`conversation:${event.conversationId}`).emit(SOCKET_EVENTS.REACTION_UPDATED, event);
        }
        catch (error) {
            console.error(
                "Failed to process reaction-updated event:",
                error
            );
        }
    }
    );

    console.log(
        `Subscribed to ${REALTIME_CHANNELS.REACTION_UPDATED}`
    );

    await subscribeToChannel(REALTIME_CHANNELS.THREAD_REPLY_CREATED, (rawMessage) => {
        try {
            const event = JSON.parse(rawMessage) as ThreadReplyCreatedEvent;

            if (
                !event.conversationId ||
                !event.threadRootId ||
                !event.message?.id ||
                event.message.conversationId !== event.conversationId ||
                event.message.threadRootId !== event.threadRootId ||
                !event.message.replyToId
            ) {
                console.error("Invalid thread-reply-created event");
                return;
            }

            io.to(`conversation:${event.conversationId}`).emit(
                SOCKET_EVENTS.THREAD_REPLY_CREATED,
                event
            );
        }
        catch (error) {
            console.error(
                "Failed to process thread-reply-created event:",
                error
            );
        }
    }
    );

    console.log(
        `Subscribed to ${REALTIME_CHANNELS.THREAD_REPLY_CREATED}`
    );


    await subscribeToChannel( REALTIME_CHANNELS.MESSAGE_READ, (rawMessage) => {
            try {
                const event = JSON.parse(rawMessage) as MessageReadEvent;
    
                if (
                    !event.conversationId ||
                    !event.userId ||
                    !event.readAt ||
                    !Array.isArray(event.messageIds) ||
                    event.messageIds.length === 0 ||
                    !event.messageIds.every(
                        (id) => typeof id === "string" && id.length > 0
                    )
                ) {
                    console.error("Invalid message-read event");
                    return;
                }
    
                io.to(`conversation:${event.conversationId}`).emit(
                        SOCKET_EVENTS.MESSAGE_READ,
                        event
                    );
            } 
            catch (error) {
                console.error(
                    "Failed to process message-read event:",
                    error
                );
            }
        }
    );
    
    console.log(
        `Subscribed to ${REALTIME_CHANNELS.MESSAGE_READ}`
    );


    await subscribeToMessageEvent(
        REALTIME_CHANNELS.MESSAGE_PINNED,
        SOCKET_EVENTS.MESSAGE_PINNED
      );
      
      await subscribeToMessageEvent(
        REALTIME_CHANNELS.MESSAGE_UNPINNED,
        SOCKET_EVENTS.MESSAGE_UNPINNED
      );


};