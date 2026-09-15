import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createRedisAdapter } from "./redis/redisAdapter.js";

export const createSocketServer = (httpServer: HttpServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    });

    io.adapter(createRedisAdapter());

    console.log("🔌 Socket.IO server initialized");

    return io;
};