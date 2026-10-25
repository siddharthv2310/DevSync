import { cleanupAbandonedUploads } from "../src/modules/chat/attachment/AttachmentCleanUpServices.js";

const main = async () => {
    try {
        const result = await cleanupAbandonedUploads();
        console.log("Cleanup result:", result);
    } catch (error) {
        console.error("Cleanup failed:", error);
    } finally {
        process.exit(0);
    }
};

main();