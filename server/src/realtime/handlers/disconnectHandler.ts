import { authenticatedSocket } from "../socketTypes.js";

export const handleDisconnect = (socket : authenticatedSocket , reason : string)=>{

    console.log( `User ${socket.userId} disconnected`);

    console.log( `Reason: ${reason}`);
}