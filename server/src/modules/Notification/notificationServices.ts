
import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";
import type { NotificationType } from "@prisma/client";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

interface CreateNotificationInput {
    recipientId: string;
    actorId?: string;

    type: NotificationType;

    title: string;
    body: string;

    resourceType?: string;
    resourceId?: string;
    actionUrl?: string;

    metadata?: Prisma.InputJsonValue;
}

interface GetNotificationsInput {
    userId: string;
    page: number;
    limit: number;
}


interface SavePushSubscriptionInput {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    expirationTime?: number | null;
    userAgent?: string;
    deviceName?: string;
}

export const createNotification = async (input: CreateNotificationInput ) => {

    const notification = await prisma.notification.create({
        data: {
            recipientId: input.recipientId,

            actorId: input.actorId ?? null,

            type: input.type,

            title: input.title,
            body: input.body,

            resourceType: input.resourceType ?? null,
            resourceId: input.resourceId ?? null,
            actionUrl: input.actionUrl ?? null,

            metadata: input.metadata ?? Prisma.JsonNull,
        },
    });

    return notification;
};


export const getNotifications = async ({ userId, page, limit, }: GetNotificationsInput) => {

    const skip = (page - 1) * limit;

    const [notifications, total] = await prisma.$transaction([
        prisma.notification.findMany({
            where: {
                recipientId: userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),

        prisma.notification.count({
            where: {
                recipientId: userId,
            },
        }),
    ]);

    return {
        notifications,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};



export const getUnreadCount = async (userId: string) => {

    const unreadCount = await prisma.notification.count({
        where: {
            recipientId: userId,
            readAt: null,
        },
    });

    return {
        unreadCount,
    };
};


export const markNotificationAsRead = async (userId: string,notificationId: string ) => {

    await prisma.notification.updateMany({
        where: {
            id: notificationId,
            recipientId: userId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });

    // If nothing was updated, check whether it exists
    const notification = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            recipientId: userId,
        },
    });

    if (!notification) {
        throw new ApiErrors(404, "Notification not found");
    }

    // If already read, return it without changing its original readAt
    return notification;
};


export const markAllNotificationsAsRead = async (userId: string) => {
    const result = await prisma.notification.updateMany({
        where: {
            recipientId: userId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });

    return {
        updatedCount: result.count,
    };
};


export const deleteNotification = async (userId: string,notificationId: string) => {

    const result = await prisma.notification.deleteMany({
        where: {
            id: notificationId,
            recipientId: userId,
        },
    });

    if (result.count === 0) {
        throw new ApiErrors(404, "Notification not found");
    }

    return {
        message: "Notification deleted successfully",
    };
};


export const savePushSubscription = async (input: SavePushSubscriptionInput) => {

    const { userId, endpoint, p256dh, auth, expirationTime, userAgent, deviceName, } = input;

    const subscription = await prisma.pushSubscription.upsert({
        where: {
            endpoint,
        },

        update: {
            userId,
            p256dh,
            auth,
            expirationTime:
                expirationTime != null
                    ? new Date(expirationTime)
                    : null,
            userAgent: userAgent ?? null,
            deviceName: deviceName ?? null,
            lastUsedAt: new Date(),
        },

        create: {
            userId,
            endpoint,
            p256dh,
            auth,
            expirationTime:
                expirationTime != null
                    ? new Date(expirationTime)
                    : null,
            userAgent: userAgent ?? null,
            deviceName: deviceName ?? null,
            lastUsedAt: new Date(),
        },
    });

    return subscription;
};

export const removePushSubscription = async (userId: string,endpoint: string) => {

    const result = await prisma.pushSubscription.deleteMany({
        where: {
            userId,
            endpoint,
        },
    });

    if (result.count === 0) {
        throw new ApiErrors(404, "Push subscription not found");
    }

    return {
        message: "Push subscription removed successfully",
    };
};

export const getUserPushSubscriptions = async (userId: string) => {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: {
            userId,
        },
        select: {
            id: true,
            endpoint: true,
            p256dh: true,
            auth: true,
            expirationTime: true,
        },
    });

    return subscriptions;
};
