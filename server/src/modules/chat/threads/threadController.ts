import { Request, Response, NextFunction } from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import { getThreadReplies,} from "./threadServices.js";

import { messageIdParamSchema } from "../message/messageValidation.js";
import { getMessagesQuerySchema } from "../message/messageValidation.js";

export const getThreadController = async ( req: Request,res: Response,next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const { messageId } = messageIdParamSchema.parse(req.params);

        const { limit, cursor } = getMessagesQuerySchema.parse(req.query);

        const result = await getThreadReplies( userId, messageId, limit, cursor);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } 
    catch (error) {
        next(error);
    }
};