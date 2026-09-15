import {createAdapter} from  '@socket.io/redis-adapter';
import { redisPublisher,redisSubscriber } from '../../config/redis.js';

export const createRedisAdapter = ()=>{
    return createAdapter(redisPublisher,redisSubscriber);
}