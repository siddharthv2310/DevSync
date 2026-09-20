import { Server } from "socket.io";
import { authenticatedSocket } from "../socketTypes.js";

export const handleConnection = (io:Server , socket : authenticatedSocket)=>{
    const userRoom = `user:${socket.userId}`

    socket.join(userRoom)

    console.log(
        ` User ${socket.userId} connected with socket ${socket.id}`
    );

    console.log(
        `  User joined room: ${userRoom}`
    );

}

