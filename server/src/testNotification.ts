import prisma from "./config/prisma.js";
import { createNotification } from "./modules/Notification/notificationServices.js";

const testNotification = async () => {
    try {
        const userId = "b78a17ff-afee-4afd-9cfa-2f56912d4491";

        if (!userId) {
            throw new Error("No user found");
        }

        const notification = await createNotification({
            recipientId: userId,
            type: "TASK_ASSIGNED",
            title: "Test Notification 2",
            body: "This is a test notification from DevSync. part 2",
            resourceType: "TEST 2",
        });

        console.log("Notification created:", notification.id);
    } 
    catch (error) {
        console.error("Test notification failed:", error);
    } 
    finally {
        await prisma.$disconnect();
    }
};

testNotification();