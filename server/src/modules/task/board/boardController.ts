
import { Request, Response, NextFunction } from "express";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import {
    boardParamsSchema,
    boardColumnParamsSchema,
    updateBoardSchema,
    createBoardColumnSchema,
    updateBoardColumnSchema,
    boardTasksQuerySchema,
} from "./boardValidation.js";

import {
    getProjectBoard,
    updateProjectBoard,
    createBoardColumn,
    updateBoardColumn,
    deleteBoardColumn,
} from "./boardServices.js";


// 1. Get project board


export const getProjectBoardController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = boardParamsSchema.parse(req.params);

        const pagination = boardTasksQuerySchema.parse(req.query);

        const data = await getProjectBoard(projectId, pagination);

        res.status(200).json({
            success: true,
            message: "Project board fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};

// 2. Update project board


export const updateProjectBoardController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = boardParamsSchema.parse(req.params);

        const boardData = updateBoardSchema.parse(req.body);

        const data = await updateProjectBoard(projectId, boardData);

        res.status(200).json({
            success: true,
            message: "Project board updated successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};


// 3. Create board column

export const createBoardColumnController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = boardParamsSchema.parse(req.params);

        const columnData = createBoardColumnSchema.parse(req.body);

        const data = await createBoardColumn(projectId, columnData);

        res.status(201).json({
            success: true,
            message: "Board column created successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};


// 4. Update board column

export const updateBoardColumnController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId, columnId } =
            boardColumnParamsSchema.parse(req.params);

        const columnData = updateBoardColumnSchema.parse(req.body);

        const data = await updateBoardColumn(
            projectId,
            columnId,
            columnData
        );

        res.status(200).json({
            success: true,
            message: "Board column updated successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};


// 5. Delete board column

export const deleteBoardColumnController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId, columnId } =
            boardColumnParamsSchema.parse(req.params);

        const data = await deleteBoardColumn(projectId, columnId);

        res.status(200).json({
            success: true,
            message: "Board column deleted successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};

