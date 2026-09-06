import { MessageType } from "@prisma/client";

export interface CreateMessageInput {
    conversationId: string;
    type?: MessageType;
    content?: string;
    replyToId?: string;
}

export interface UpdateMessageInput {
    content: string;
}

export interface GetMessagesQuery {
    limit: number;
    cursor?: string;
}

export interface MessageSender {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
}

export interface MessageResponse {
    id: string;
    conversationId: string;
    senderId: string;
    type: MessageType;
    content: string | null;

    replyToId: string | null;

    isEdited: boolean;
    editedAt: Date | null;

    deletedAt: Date | null;

    pinnedAt: Date | null;
    pinnedById: string | null;

    createdAt: Date;
    updatedAt: Date;

    sender: MessageSender;
}

export interface MessageListResponse {
    messages: MessageResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}