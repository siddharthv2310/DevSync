
import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../Socket";
import { api } from "../api/axios";

const CONVERSATION_ID =
  "b9355c23-9e13-4a4e-be13-7d7ff5aa7d0e";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  isEdited: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  deletedById: string | null;
  createdAt: string;
}

interface MessageDeletedEvent {
  conversationId: string;
  messageId: string;
  deletedAt: string;
  deletedById: string;
}

interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

interface TypingEvent {
  conversationId: string;
  userId: string;
}

export default function RealtimeTest() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasConnectedBefore = useRef(false);

  // Merge by ID so history and realtime events cannot create duplicates.
  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((previous) => {
      const byId = new Map(previous.map((message) => [message.id, message]));

      for (const message of incoming) {
        byId.set(message.id, {
          ...byId.get(message.id),
          ...message,
        });
      }

      return Array.from(byId.values()).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
    });
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<MessagesResponse>(
        `/chat-message/conversations/${CONVERSATION_ID}/messages`,
        { params: { limit: 50 } }
      );

      if (!response.data.success) {
        throw new Error("Could not load messages.");
      }

      mergeMessages(response.data.data.messages);
    } catch (err) {
      console.error("Failed to load message history:", err);
      setError("Failed to load messages. Check authentication and API route.");
    } finally {
      setLoading(false);
    }
  }, [mergeMessages]);

  useEffect(() => {
    const handleConnect = () => {
        const isReconnection = hasConnectedBefore.current;
      
        console.log(
          isReconnection ? "Socket reconnected" : "Socket connected",
          {
            recovered: socket.recovered,
          }
        );
      
        hasConnectedBefore.current = true;
      
        setConnected(true);
        setJoined(false);
      
        socket.emit("conversation:join", CONVERSATION_ID);
      };

    const handleJoined = (data: { conversationId: string }) => {
      if (data.conversationId !== CONVERSATION_ID) return;

      setJoined(true);
      void loadMessages();
    };

    const handleNewMessage = (message: Message) => {
      if (message.conversationId !== CONVERSATION_ID) return;
      mergeMessages([message]);
    };

    const handleUpdatedMessage = (message: Message) => {
      if (message.conversationId !== CONVERSATION_ID) return;
      mergeMessages([message]);
    };

    const handleDeletedMessage = (event: MessageDeletedEvent) => {
      if (event.conversationId !== CONVERSATION_ID) return;

      setMessages((previous) =>
        previous.map((message) =>
          message.id === event.messageId
            ? {
                ...message,
                deletedAt: event.deletedAt,
                deletedById: event.deletedById,
              }
            : message
        )
      );
    };

    const handleDisconnect = () => {
      setConnected(false);
      setJoined(false);
    };

    const handleConnectError = (err: Error) => {
      console.error("Socket connection failed:", err.message);
    };

    const handleConversationError = (err: unknown) => {
      console.error("Conversation error:", err);
    };

    const handleReactionUpdated = (event: {
      conversationId: string;
      messageId: string;
    }) => {
      console.log("REACTION EVENT", {
        tab: window.location.href,
        time: new Date().toISOString(),
        ...event,
      });
    };

    const handleMessageRead = (event: MessageEvent) => {
      console.log("READ RECEIPT EVENT RECEIVED:", event);
    };

    const handleTypingStarted = (event: TypingEvent) => {
      if (event.conversationId !== CONVERSATION_ID) return;
    
      console.log("TYPING STARTED:", {
        ...event,
        time: new Date().toISOString(),
      });
    };
    
    const handleTypingStopped = (event: TypingEvent) => {
      if (event.conversationId !== CONVERSATION_ID) return;
    
      console.log("TYPING STOPPED:", {
        ...event,
        time: new Date().toISOString(),
      });
    };
    
    const handleTypingError = (event: {
      conversationId: string;
      message: string;
    }) => {
      console.error("TYPING ERROR:", event);
    };
    

    socket.on("connect", handleConnect);
    socket.on("conversation:joined", handleJoined);
    socket.on("conversation:error", handleConversationError);
    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleUpdatedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("reaction:updated", handleReactionUpdated);
    socket.on("message:read", handleMessageRead);

    socket.on("typing:started", handleTypingStarted);
    socket.on("typing:stopped", handleTypingStopped);
    socket.on("typing:error", handleTypingError);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("conversation:joined", handleJoined);
      socket.off("conversation:error", handleConversationError);
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleUpdatedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("reaction:updated", handleReactionUpdated);
      socket.off("message:read", handleMessageRead);

      socket.off("typing:started", handleTypingStarted);
      socket.off("typing:stopped", handleTypingStopped);
      socket.off("typing:error", handleTypingError);

      socket.disconnect();
    };
  }, [loadMessages, mergeMessages]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl">
  
        <h1 className="mb-4 text-2xl font-bold">
          DevSync Realtime Messages
        </h1>
  
        {/* Connection and room status */}
        <p className="mb-6">
          Connection: {connected ? "🟢 Connected" : "🔴 Disconnected"}
          {" | "}
          Room: {joined ? "Joined" : "Not joined"}
        </p>
  
        {/* ADD YOUR BUTTONS HERE */}
        <div className="mb-6 flex flex-wrap gap-3">
  
          <button
            onClick={() => socket.emit("typing:start", CONVERSATION_ID)}
            disabled={!connected || !joined}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Start Typing
          </button>
  
          <button
            onClick={() => socket.emit("typing:stop", CONVERSATION_ID)}
            disabled={!connected || !joined}
            className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
          >
            Stop Typing
          </button>
  
          <button
            onClick={() => {
              socket.emit("conversation:leave", CONVERSATION_ID);
              setJoined(false);
            }}
            disabled={!connected || !joined}
            className="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Leave Room
          </button>
  
          <button
            onClick={() => {
              socket.emit("conversation:join", CONVERSATION_ID);
            }}
            disabled={!connected || joined}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Rejoin Room
          </button>
  
          <button
            onClick={() => socket.disconnect()}
            disabled={!connected}
            className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Disconnect
          </button>
  
          <button
            onClick={() => socket.connect()}
            disabled={connected}
            className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Reconnect
          </button>
  
        </div>
  
        {/* Existing loading and error messages */}
        {loading && <p className="mb-3">Loading message history...</p>}
  
        {error && <p className="mb-3 text-red-600">{error}</p>}
  
        {/* Your existing messages list */}
        <div className="space-y-3">
          {/* Keep your existing messages.map() code here */}
        </div>
  
      </div>
    </div>
  );
}
