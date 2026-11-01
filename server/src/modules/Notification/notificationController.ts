import type { Request, Response, NextFunction } from "express";
import { deleteNotification, getNotifications, getUnreadCount, markAllNotificationsAsRead, markNotificationAsRead, removePushSubscription, savePushSubscription, } from "./notificationServices.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { vapidPublicKey } from "../../config/webPush.js";


export const getNotificationsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string;

        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);

        if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1 || limit > 50) {
            throw new ApiErrors(400, "Invalid pagination parameters");
        }

        const result = await getNotifications({ userId, page, limit, });

        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};


export const getUnreadCountController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string;

        const result = await getUnreadCount(userId);

        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};

export const markNotificationAsReadController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string;
        const notificationId = req.params.notificationId as string;

        const notification = await markNotificationAsRead(
            userId,
            notificationId
        );

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    }
    catch (error) {
        next(error);
    }
};

export const markAllNotificationsAsReadController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string;

        const result = await markAllNotificationsAsRead(userId);

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};


export const deleteNotificationController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string;
        const notificationId = req.params.notificationId as string;

        const result = await deleteNotification(
            userId,
            notificationId
        );

        return res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        next(error);
    }
};

export const getVapidPublicKeyController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json({
            success: true,
            data: {
                publicKey: vapidPublicKey,
            },
        });
    }
    catch (error) {
        next(error);
    }
};

export const savePushSubscriptionController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const userId = req.user?.userId as string;

        const { endpoint, keys, expirationTime, deviceName, } = req.body;

        if (
            typeof endpoint !== "string" ||
            !endpoint.trim() ||
            typeof keys?.p256dh !== "string" ||
            !keys.p256dh.trim() ||
            typeof keys?.auth !== "string" ||
            !keys.auth.trim()
        ) {
            throw new ApiErrors(400, "Invalid push subscription data");
        }

        if (
            expirationTime !== undefined &&
            expirationTime !== null &&
            (typeof expirationTime !== "number" ||
                !Number.isFinite(expirationTime) ||
                expirationTime <= 0)
        ) {
            throw new ApiErrors(400, "Invalid expiration time");
        }

        if (
            deviceName !== undefined &&
            typeof deviceName !== "string"
        ) {
            throw new ApiErrors(400, "Invalid device name");
        }

        const userAgent = req.get("user-agent");

        const subscription = await savePushSubscription({
            userId,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            expirationTime,
            ...(userAgent != null && { userAgent }),
            deviceName,
        });

        return res.status(201).json({
            success: true,
            message: "Push subscription registered successfully",
            data: subscription,
        });
    } 
    catch (error) {
        next(error);
    }
};

export const removePushSubscriptionController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string;
        const { endpoint } = req.body;

        if (
            typeof endpoint !== "string" ||
            !endpoint.trim()
        ) {
            throw new ApiErrors(400, "Valid endpoint is required");
        }

        const result = await removePushSubscription(
            userId,
            endpoint
        );

        return res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        next(error);
    }
};