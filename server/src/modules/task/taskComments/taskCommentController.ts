import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";

import {
    createTaskComment,
    getTaskComments,
    updateTaskComment,
    deleteTaskComment,
} from "./taskCommentServices.js";

import {
    taskCommentParamsSchema,
    createTaskCommentSchema,
    updateTaskCommentSchema,
    listTaskCommentsQuerySchema,
} from "./taskCommentValidation.js";


// Helper: organization/project managers can manage any comment
const canManageAnyComment = (req: Request) => {

    const organizationRole = req.organizationMember?.role;
    const memberRole = req.projectMember?.role;

    return (
        organizationRole === OrganizationRole.OWNER ||
        organizationRole === OrganizationRole.ADMIN ||
        memberRole === projectRole.OWNER ||
        memberRole === projectRole.ADMIN
    );
};



export const createTaskCommentController = async ( req: Request, res: Response, next: NextFunction) => {

    try {
        const { projectId, taskId } = taskCommentParamsSchema.parse(req.params);

        const input = createTaskCommentSchema.parse(req.body);

        const comment = await createTaskComment(
            projectId,
            taskId,
            req.user?.userId as string,
            input
        );

        return res.status(201).json({
            success: true,
            message: "Comment created successfully",
            data: comment,
        });
    }
    catch (error) {
        next(error);
    }
};


// GET COMMENTS
export const getTaskCommentsController = async (req: Request,res: Response,next: NextFunction) => {

    try {
        const { projectId, taskId } =
            taskCommentParamsSchema.parse(req.params);

        const query = listTaskCommentsQuerySchema.parse(req.query);

        const result = await getTaskComments(
            projectId,
            taskId,
            query
        );

        return res.status(200).json({
            success: true,
            message: "Comments fetched successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};


// UPDATE COMMENT
export const updateTaskCommentController = async (req: Request,res: Response,next: NextFunction) => {

    try {
        const { projectId, taskId, commentId } =
            taskCommentParamsSchema.parse(req.params);

        const input = updateTaskCommentSchema.parse(req.body);

        const comment = await updateTaskComment(
            projectId,
            taskId,
            commentId!,
            req.user?.userId as string,
            canManageAnyComment(req),
            input
        );

        return res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            data: comment,
        });
    }
    catch (error) {
        next(error);
    }
};


// DELETE COMMENT
export const deleteTaskCommentController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const { projectId, taskId, commentId } =
            taskCommentParamsSchema.parse(req.params);

        const result = await deleteTaskComment(
            projectId,
            taskId,
            commentId!,
            req.user?.userId as string,
            canManageAnyComment(req)
        );

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};