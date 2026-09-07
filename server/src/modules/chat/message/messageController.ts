import { Request, Response, NextFunction } from "express";

import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import * as messageServices from"./messageServices.js"

import { conversationIdParamSchema, createMessageSchema, getMessagesQuerySchema, messageIdParamSchema, updateMessageSchema } from "./messageValidation.js";


export const createMessageController = async (req: Request,res: Response,next: NextFunction) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors( 401, "Authentication required");
        }

        const { conversationId } = conversationIdParamSchema.parse(req.params);


        const body = createMessageSchema.parse(req.body);


        const message = await messageServices.createMessage( userId,conversationId,body);


        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: message,
        });

    } 
    catch (error) {
        next(error);
    }
};


export const getMessagesController = async (req: Request,res: Response, next: NextFunction) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }


        const { conversationId } = conversationIdParamSchema.parse(req.params);


        const query = getMessagesQuerySchema.parse(req.query);


        const result = await messageServices.getMessages(userId,conversationId,query);


        return res.status(200).json({
            success: true,
            data: result,
        });

    } 
    catch (error) {
        next(error);
    }
};


export const getMessageController = async (req: Request,res: Response,next: NextFunction) => {

    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }


        const { messageId } = messageIdParamSchema.parse(req.params);


        const message = await messageServices.getMessageById(userId,messageId);


        return res.status(200).json({
            success: true,
            data: message,
        });

    } 
    catch (error) {
        next(error);
    }
};



export const updateMessageController = async (req: Request,res: Response,next: NextFunction) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }


        const { messageId } = messageIdParamSchema.parse(req.params);


        const body = updateMessageSchema.parse(req.body);


        const message = await messageServices.updateMessage(userId,messageId,body);


        return res.status(200).json({
            success: true,
            message: "Message updated successfully",
            data: message,
        });

    } 
    catch (error) {
        next(error);
    }
};


export const deleteMessageController = async ( req: Request, res: Response, next: NextFunction) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiErrors(
                401,
                "Authentication required"
            );
        }


        const { messageId } =
            messageIdParamSchema.parse(req.params);


        await messageServices.deleteMessage(userId,messageId )


        return res.status(200).json({
            success: true,
            message: "Message deleted successfully",
        });

    } 
    catch (error) {
        next(error);
    }
};