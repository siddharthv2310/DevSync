import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createRedisAdapter } from "./redis/redisAdapter.js";
import { socketAuth } from "./socketAuth.js";
import { handleConnection } from "./handlers/connectionHandler.js";
import { authenticatedSocket } from "./socketTypes.js";
import { handleDisconnect } from "./handlers/disconnectHandler.js";
import { joinConversationalRoom, leaveConversationalRoom } from "./handlers/conversationalHandler.js";
import { subscribeToMessageEvents } from "./handlers/messageEventHandler.js";

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

    

    io.on("conection",(socket)=>{
        const authenticatedSocket = socket as authenticatedSocket;

        handleConnection(io , authenticatedSocket)


        socket.on("conversation:join",(conversationalId:string)=>{
            joinConversationalRoom(io , authenticatedSocket , conversationalId)
        })

        socket.on("conversation:leave",(conversationalId:string)=>{
            leaveConversationalRoom( io , authenticatedSocket , conversationalId)
        })

        socket.on("disconnect",(reason : string)=>{
            handleDisconnect(authenticatedSocket , reason)
        })
    
    })

    
    console.log(" Socket.IO server initialized");


    return io;
};