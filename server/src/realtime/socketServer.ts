import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createRedisAdapter } from "./redis/redisAdapter.js";
import { socketAuth } from "./socketAuth.js";
import { handleConnection } from "./handlers/connectionHandler.js";
import { authenticatedSocket } from "./socketTypes.js";
import { handleDisconnect } from "./handlers/disconnectHandler.js";
import { joinConversationalRoom, leaveConversationalRoom } from "./handlers/conversationalHandler.js";
import { subscribeToMessageEvents } from "./handlers/messageEventHandler.js";
import { clearTypingStatus, handleTypingStart, handleTypingStop } from "./handlers/typingHandler.js";

export const createSocketServer = (httpServer: HttpServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    });

    io.adapter(createRedisAdapter());

    io.use(socketAuth);

    void subscribeToMessageEvents(io)

    

    io.on("connection",(socket)=>{
        const authenticatedSocket = socket as authenticatedSocket;

        handleConnection(io , authenticatedSocket)


        socket.on("conversation:join",(conversationalId:string)=>{
            joinConversationalRoom(io , authenticatedSocket , conversationalId)
        })

        socket.on("conversation:leave",(conversationalId:string)=>{
            clearTypingStatus(authenticatedSocket, conversationalId);
            leaveConversationalRoom( io , authenticatedSocket , conversationalId)
        })

        socket.on("disconnect",(reason : string)=>{
            clearTypingStatus(authenticatedSocket);
            handleDisconnect(authenticatedSocket , reason)
        })

        socket.on("typing:start",(conversationId:string)=>{
            void handleTypingStart(io,authenticatedSocket,conversationId)
        })

        socket.on("typing:stop",(conversationId:string)=>{
            void handleTypingStop(io,authenticatedSocket,conversationId)
        })
    
    })

    
    console.log(" Socket.IO server initialized");


    return io;
};