import { Request, Response, NextFunction } from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import { messageIdParamSchema, reactionSchema } from "./reactionValidation.js";
import { addReaction, getMessageReactions, removeReaction } from "./reactionServices.js";


export const addReactionController = async (req: Request,res: Response,next: NextFunction) => {

    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const { messageId } = messageIdParamSchema.parse( req.params );

        const body = reactionSchema.parse(req.body);

        const reaction = await addReaction( userId, messageId, body);

        return res.status(200).json({
            success: true,
            message: "Reaction added successfully",
            data: reaction,
        });
    } 
    catch (error) {
        next(error);
    }
};

export const removeReactionController = async (req: Request,res: Response,next: NextFunction) => {

    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const { messageId } = messageIdParamSchema.parse( req.params );

        await removeReaction(userId, messageId );

        return res.status(200).json({
            success: true,
            message: "Reaction removed successfully",
        });
    } 
    catch (error) {
        next(error);
    }
};

export const getMessageReactionsController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const { messageId } = messageIdParamSchema.parse(req.params);

        const reactions = await getMessageReactions( userId, messageId);

        return res.status(200).json({
            success: true,
            data: reactions,
        });
    } 
    catch (error) {
        next(error);
    }
};