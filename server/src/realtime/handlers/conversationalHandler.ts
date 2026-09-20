import { Server } from "socket.io";

import { authenticatedSocket } from "../socketTypes.js";
import { requireConversationAccess } from "../../modules/chat/chatPermissions.js";

export const joinConversationalRoom = async (
    io: Server,
    socket: authenticatedSocket,
    conversationId: string
) => {
    try {
        await requireConversationAccess(
            conversationId,
            socket.userId
        );

        const room = `conversation:${conversationId}`;

        socket.join(room);

        console.log(
            `User ${socket.userId} joined ${room}`
        );

        socket.emit("conversation:joined", {
            conversationId,
        });
    } catch (error) {
        socket.emit("conversation:error", {
            conversationId,
            message:
                error instanceof Error
                    ? error.message
                    : "Unable to join conversation",
        });
    }
};

export const leaveConversationalRoom = (
    io: Server,
    socket: authenticatedSocket,
    conversationId: string
) => {
    const room = `conversation:${conversationId}`;

    socket.leave(room);

    console.log(
        `User ${socket.userId} left ${room}`
    );

    socket.emit("conversation:left", {
        conversationId,
    });
};