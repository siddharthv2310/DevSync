import { redisPublisher, redisSubscriber } from "../../config/redis.js";


export const publishEvent = async ( channel: string, message: unknown) => {

    const payload = JSON.stringify(message);

    await redisPublisher.publish(channel, payload);
};

export const subscribeToChannel = async ( channel: string, handler: (message: string) => void ) => {

    await redisSubscriber.subscribe(channel, handler);
};