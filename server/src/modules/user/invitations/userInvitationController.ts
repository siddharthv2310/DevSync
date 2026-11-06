import { ProjectInvitationStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { getMyProjectInvitations } from "./userInvitationServices.js";

export const getMyProjectInvitationsController = async (req: Request,res: Response,next: NextFunction) => {
    try {
      const userId = req.user?.userId as string;
  
      const page = Math.max(
        1,
        Number(req.query.page) || 1
      );
  
      const limit = Math.min(
        100,
        Math.max(1, Number(req.query.limit) || 10)
      );
  
      const status = req.query.status as | ProjectInvitationStatus | undefined;
  
      const result = await getMyProjectInvitations(userId,page,limit,status);
  
      res.status(200).json({
        success: true,
        message: "Your project invitations fetched successfully",
        data: result.invitations,
        pagination: result.pagination,
      });
    } 
    
    catch (error) {
      next(error);
    }
  };