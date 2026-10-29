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

export const subscribeToMessageEvents = async (io: Server) => {
    const subscribeToMessageEvent = async ( channel: string, socketEvent: string) => {

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


    await subscribeToChannel( REALTIME_CHANNELS.MESSAGE_DELETED, (rawMessage) => {

            try {
                const event = JSON.parse(rawMessage) as MessageDeletedEvent;
    
                if (!event.conversationId || !event.messageId || !event.deletedAt || !event.deletedById ) {
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
    
    console.log( `Subscribed to ${REALTIME_CHANNELS.MESSAGE_DELETED}`);
    
};