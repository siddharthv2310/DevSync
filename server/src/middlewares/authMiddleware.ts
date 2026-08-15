import { NextFunction,Request,Response } from "express";
import jwt from "jsonwebtoken";
import { ApiErrors } from "../common/errors/ApiErrors.js";

interface JwtPayload {
    userId: string;
  }
  
  declare global {
    namespace Express {
      interface Request {
        user?: JwtPayload;
      }
    }
  }

  export const authMiddleware = async(req:Request , res:Response , next:NextFunction)=>{
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer")){
            throw new ApiErrors(401,"Access token missing");
        }

        const token = authHeader.split(" ")[1];

        if(!token){
            throw new ApiErrors(401,"Access token missing");
        }

        const decoded = jwt.verify(token , process.env.JWT_SECRET!) as JwtPayload ;
        // check whether Signature matches JWT_SECRET
        // Token is not expired
        // Token is valid

        req.user = decoded;
        next();

    }
    catch(error){
        if(error instanceof ApiErrors){
            return next(error);
        }
        next(new ApiErrors(401, "Invalid or expired access token"));
    }
  }

 