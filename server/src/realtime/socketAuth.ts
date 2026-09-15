import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { authenticatedSocket } from "./socketTypes.js";

interface AccessTokenPayload {
    userId: string;
}

export const socketAuth = (socket: Socket,next: (error?: Error) => void ) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token || typeof token !== "string") {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;

        if (!decoded.userId) {
            return next(new Error("Invalid authentication token"));
        }

        (socket as authenticatedSocket).userId = decoded.userId;

        next();
    } 
    catch (error) {
        next(new Error("Invalid or expired authentication token"));
    }
};