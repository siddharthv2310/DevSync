import {Socket} from "socket.io";

export class authenticatedSocket extends Socket{
    userId! : string;
}