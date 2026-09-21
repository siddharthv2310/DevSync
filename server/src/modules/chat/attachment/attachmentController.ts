import { NextFunction, Request, Response } from "express";
import { createUploadUrlSchema } from "./attachmentValidation.js";
import { completeUpload, generateUploadUrl } from "./attachmentServices.js";
import { requireConversationAccess } from "../chatPermissions.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";


export const createUploadUrl = async (req: Request, res: Response) => {

    const conversationId = req.params.conversationId as string;

    const userId = req.user?.userId;

    if (!userId) {
        throw new ApiErrors(401, "Authentication required");
    }

    const validatedData = createUploadUrlSchema.parse(req.body);

    await requireConversationAccess(conversationId, userId);

    const result = await generateUploadUrl(conversationId, userId,validatedData.originalName,validatedData.mimeType,validatedData.sizeBytes);

    res.status(201).json({
        success: true,
        data: result,
    });
};

export const completeUploadController = async(req:Request , res:Response , next:NextFunction)=>{
    const conversationId = req.params.conversationId as string;

    const uploadId = req.params.uploadId as string ;

    const userId = req.user?.userId;

    if(!userId){
        throw new ApiErrors(401, "Authentication required");
    }

    await requireConversationAccess(conversationId , userId);

    const result = await completeUpload(conversationId,uploadId,userId);
    
      res.status(200).json({
        success: true,
        data: result,
      });
}