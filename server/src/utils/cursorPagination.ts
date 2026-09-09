import { ApiErrors } from "../common/errors/ApiErrors.js";



export interface MessageCursor {
    createdAt: string;
    id: string;
}


export const encodeCursor = (cursor: MessageCursor): string => {

    return Buffer
        .from(JSON.stringify(cursor))
        .toString("base64url");
};


export const decodeCursor = ( cursor: string): MessageCursor => {

    try {

        const decoded = JSON.parse( Buffer
                .from(cursor, "base64url")
                .toString("utf-8")
        );


        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof decoded.createdAt !== "string" ||
            typeof decoded.id !== "string"
        ) {
            throw new Error();
        }


        const createdAt = new Date(
            decoded.createdAt
        );


        if (Number.isNaN(createdAt.getTime())) {
            throw new Error();
        }


        return {
            createdAt: createdAt.toISOString(),
            id: decoded.id,
        };

    } catch {

        throw new ApiErrors( 400, "Invalid pagination cursor");
    }
};