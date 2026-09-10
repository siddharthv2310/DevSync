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

export const getMessageReactions = async ( userId: string, messageId: string) => {
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

    const reactions = await prisma.messageReaction.findMany({
        where: {
            messageId,
        },
        select: {
            emoji: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                },
            },
        },
    });

    const groupedReactions = new Map<
      string ,
      {
        emoji:string,
        count:number,
        reactedByMe:boolean,
        users:{
            id:string,
            name:string,
            username:string | null,
            avatar:string | null,
        }[];
      }
    >();

    for (const reaction of reactions) {
        const existing = groupedReactions.get(reaction.emoji);
    
        if (existing) {
            existing.count += 1;
            existing.users.push(reaction.user);
    
            if (reaction.userId === userId) {
                existing.reactedByMe = true;
            }
        } else {
            groupedReactions.set(reaction.emoji, {
                emoji: reaction.emoji,
                count: 1,
                reactedByMe: reaction.userId === userId,
                users: [reaction.user],
            });
        }
    }
    
    return Array.from(groupedReactions.values());
};