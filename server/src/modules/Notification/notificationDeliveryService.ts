import prisma from "../../config/prisma.js";
import { webPushClient } from "../../config/webPush.js";
import { getUserPushSubscriptions } from "./notificationServices.js";

interface SendWebPushInput {
    userId: string;
    title: string;
    body: string;
    notificationId: string;
    actionUrl?: string;
}

export const sendWebPushNotification = async (input: SendWebPushInput) => {

    const { userId, title, body, notificationId, actionUrl, } = input;

    const subscriptions = await getUserPushSubscriptions(userId);

    if (subscriptions.length === 0) {
        return {
            sent: 0,
            failed: 0,
            removed: 0,
        };
    }

    const payload = JSON.stringify({
        title,
        body,
        notificationId,
        actionUrl,
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;

    await Promise.all(
        subscriptions.map(async (subscription) => {
            try {
                await webPushClient.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth,
                        },
                    },
                    payload,
                    {
                        TTL: 60 * 60,
                    }
                );

                sent++;

                await prisma.pushSubscription.update({
                    where: {
                        id: subscription.id,
                    },
                    data: {
                        lastUsedAt: new Date(),
                    },
                });
            } 
            catch (error: unknown) {
                failed++;

                const statusCode =
                    typeof error === "object" &&
                    error !== null &&
                    "statusCode" in error
                        ? (error as { statusCode?: number }).statusCode
                        : undefined;

                // 404 and 410 mean the subscription is no longer valid.
                if (statusCode === 404 || statusCode === 410) {
                    await prisma.pushSubscription.deleteMany({
                        where: {
                            id: subscription.id,
                            userId,
                        },
                    });

                    removed++;
                } else {
                    console.error(
                        `Web Push failed for subscription ${subscription.id}:`,
                        error
                    );
                }
            }
        })
    );

    return {
        sent,
        failed,
        removed,
    };
};