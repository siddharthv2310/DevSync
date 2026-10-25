import cron from "node-cron";
import { cleanupAbandonedUploads } from "../modules/chat/attachment/AttachmentCleanUpServices.js";

export const startAttachmentCleanupJob = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("Starting attachment cleanup...");

    try {
      const result = await cleanupAbandonedUploads();
      console.log("Attachment cleanup result:", result);
    } catch (error) {
      console.error("Attachment cleanup failed:", error);
    }
  });
};