import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const status = err.statusCode || 500;

    res.status(status).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};