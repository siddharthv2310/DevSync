import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { parseCookie } from "cookie";
import { authenticatedSocket } from "./socketTypes.js";

interface AccessTokenPayload {
    userId: string;
}

export const socketAuth = (
    socket: Socket,
    next: (error?: Error) => void
) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader) {
            return next(
                new Error("Authentication required")
            );
        }

        const cookies = parseCookie(cookieHeader);

        const token = cookies.accessToken;

        if (!token) {
            return next(
                new Error("Access token missing")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as AccessTokenPayload;

        if (!decoded.userId) {
            return next(
                new Error("Invalid authentication token")
            );
        }

        (socket as authenticatedSocket).userId =
            decoded.userId;

        next();
    } catch {
        next(
            new Error(
                "Invalid or expired authentication token"
            )
        );
    }
};