import type { Request, Response, NextFunction } from "express";
import {getNotifications,getUnreadCount, } from "./notificationServices.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";


export const getNotificationsController = async ( req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string;

        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);

        if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1 || limit > 50) 
        {
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


export const getUnreadCountController = async (req: Request,res: Response,next: NextFunction) => {
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