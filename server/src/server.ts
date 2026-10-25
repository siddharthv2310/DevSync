import { createServer } from 'node:http';
import app from './app.js';
import {env} from './config/env.js';
import { connectRedis } from './config/redis.js';
import { createSocketServer } from './realtime/socketServer.js';
import { startAttachmentCleanupJob } from "./jobs/attachmentCleanupJob.js";

const startServer = async () => {
    try {
        await connectRedis();

        startAttachmentCleanupJob();

        const httpServer = createServer(app)

        createSocketServer(httpServer);

        httpServer.listen(env.PORT, () => {
            console.log(
                `🚀 Server running on http://localhost:${env.PORT}`
            );
        });
    } 
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();