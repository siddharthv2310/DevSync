import { Server } from "socket.io";
import { authenticatedSocket } from "../socketTypes.js";
import { requireConversationAccess } from "../../modules/chat/chatPermissions.js";

const typingUsers = new WeakMap<authenticatedSocket, Set<string> >();

const getTypingConversations = (socket: authenticatedSocket) => {

    let conversations = typingUsers.get(socket);

    if (!conversations) {
        conversations = new Set<string>();
        typingUsers.set(socket, conversations);
    }

    return conversations;
};

export const handleTypingStart = async ( io: Server, socket: authenticatedSocket, conversationId: string) => {
    try {
        if (typeof conversationId !== "string") {
            throw new Error("Invalid conversation ID");
        }

        const room = `conversation:${conversationId}`;

        // User must have joined the conversation room.
        if (!socket.rooms.has(room)) {
            throw new Error("You have not joined this conversation");
        }

        // Verify conversation access.
        await requireConversationAccess( conversationId, socket.userId);

        const conversations = getTypingConversations(socket);

        // Avoid repeatedly broadcasting typing:start.
        if (conversations.has(conversationId)) {
            return;
        }

        conversations.add(conversationId);

        socket.to(room).emit("typing:started", {
            conversationId,
            userId: socket.userId,
        });

    } 
    catch (error) {
        socket.emit("typing:error", {
            conversationId,
            message:
                error instanceof Error
                    ? error.message
                    : "Unable to start typing indicator",
        });
    }
};

export const handleTypingStop = async (io: Server,socket: authenticatedSocket,conversationId: string) => {
    try {
        if (typeof conversationId !== "string") {
            return;
        }

        const room = `conversation:${conversationId}`;

        const conversations = getTypingConversations(socket);

        if (!conversations.has(conversationId)) {
            return;
        }

        conversations.delete(conversationId);

        socket.to(room).emit("typing:stopped", {
            conversationId,
            userId: socket.userId,
        });

    } 
    catch (error) {
        console.error("Typing stop error:", error);
    }
};


export const clearTypingStatus = (socket: authenticatedSocket,conversationId?: string ) => {
    const conversations = getTypingConversations(socket);

    const conversationsToClear = conversationId ? [conversationId] : Array.from(conversations);

    for (const id of conversationsToClear) {
        if (!conversations.has(id)) {
            continue;
        }

        conversations.delete(id);

        socket.to(`conversation:${id}`).emit("typing:stopped", {
            conversationId: id,
            userId: socket.userId,
        });
    }
};