import redisClient from "../../config/redis.js";

export const isRedisConnected = ():boolean =>{
    return redisClient.isReady
}