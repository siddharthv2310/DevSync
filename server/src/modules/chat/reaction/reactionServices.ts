import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma from "../../../config/prisma.js";
import { requireConversationAccess } from "../chatPermissions.js";
import { ReactionInput } from "./reactionValidation.js";


export const addReaction = async(userId:string , messageId:string , input:ReactionInput)=>{
    const message = await prisma.message.findUnique({
        where:{
            id:messageId,
        },
        select:{
            id:true,
            conversationId:true,
            deletedAt:true,
        },
    });

    if(!message){
        throw new ApiErrors(404, "Message not found");
    }

    await requireConversationAccess(message.conversationId,userId);

    if (message.deletedAt) {
        throw new ApiErrors(400,"Cannot react to a deleted message");
    }

    const existingReaction = await prisma.messageReaction.findUnique({
        where: {
            messageId_userId: {
                messageId,
                userId,
            },
        },
    });

    if(existingReaction){
        return prisma.messageReaction.update({
            where: {
                id: existingReaction.id,
            },
            data: {
                emoji: input.emoji,
            },
            select: {
                id: true,
                messageId: true,
                userId: true,
                emoji: true,
                createdAt: true,
            },
        });
    }
    
    return prisma.messageReaction.create({
        data: {
            messageId,
            userId,
            emoji: input.emoji,
        },
        select: {
            id: true,
            messageId: true,
            userId: true,
            emoji: true,
            createdAt: true,
        },
    });
}

export const removeReaction = async(userId:string , messageId : string ): Promise<void>=>{

    const message = await prisma.message.findUnique({
        where: {
            id: messageId,
        },
        select: {
            id: true,
            conversationId: true,
        },
    });

    if (!message) {
        throw new ApiErrors(404, "Message not found");
    }

    await requireConversationAccess( message.conversationId, userId );

    const reaction = await prisma.messageReaction.findUnique({
        where: {
            messageId_userId: {
                messageId,
                userId,
            },
        },
    });

    if (!reaction) {
        throw new ApiErrors(404, "Reaction not found");
    }

    await prisma.messageReaction.delete({
        where: {
            id: reaction.id,
        },
    });
};