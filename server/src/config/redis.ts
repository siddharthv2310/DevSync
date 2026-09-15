import {createClient} from "redis";

const redisClient = createClient({
    url : process.env.REDIS_URL!,
})

const redisPublisher = redisClient.duplicate();

const redisSubscriber = redisClient.duplicate();


redisClient.on("error" , (err)=>{
    console.error("Redis Client Error:", err);
});

redisPublisher.on("error",(err)=>{
    console.error("Redis Publisher Error:", err);
});

redisSubscriber.on("error",(err)=>{
    console.error("Redis Subscriber Error:", err);
});

export const connectRedis = async()=>{

    if(redisClient.isOpen){
        return ;
    }

    await Promise.all ([
        redisPublisher.connect(),
        redisSubscriber.connect(),
        redisClient.connect(),
    ]);

   console.log("Redis connected");
}

export  {
    redisPublisher,
    redisSubscriber,
};

export default redisClient;
