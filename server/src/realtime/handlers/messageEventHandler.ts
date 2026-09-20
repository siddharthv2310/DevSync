import { Server } from "socket.io";
import { subscribeToChannel } from "../redis/redisPubSub.js";
import { REALTIME_CHANNELS,SOCKET_EVENTS, } from "../socketEvents.js";

interface MessageCreatedEvent {
    conversationId: string;
    message: unknown;
}

export const subscribeToMessageEvents = async (io: Server) => {
    await subscribeToChannel( REALTIME_CHANNELS.MESSAGE_CREATED, (rawMessage) => {
            try {
                const event =
                    JSON.parse(rawMessage) as MessageCreatedEvent;

                if (!event.conversationId || !event.message) {
                    console.error(
                        "Invalid message-created event"
                    );
                    return;
                }

                io.to( `conversation:${event.conversationId}`).emit(
                    SOCKET_EVENTS.MESSAGE_CREATED,
                    event.message
                );
            } 
            catch (error) {
                console.error(
                    "Failed to process message-created event:",
                    error
                );
            }
        }
    );

    console.log( `Subscribed to ${REALTIME_CHANNELS.MESSAGE_CREATED}`);
};