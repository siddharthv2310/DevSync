import { NextFunction, Request, Response } from "express";
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

export const authMiddleware = ( req: Request,res: Response, next: NextFunction) => {
  try {

    let token = req.cookies.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      throw new ApiErrors(401, "Access token missing");
    }

    console.log("Using token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // check whether Signature matches JWT_SECRET
    // Token is not expired
    // Token is valid


    req.user = decoded;
    next();
  }
  catch {
    next(new ApiErrors(401, "Invalid or expired access token"));
  }
};

 