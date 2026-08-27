import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiErrors } from "../common/errors/ApiErrors.js";

interface ResetTokenPayload extends JwtPayload {
  userId: string;
  purpose: string;
}

export const resetPasswordMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiErrors(401, "Reset token missing");
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_RESET_PASSWORD_SECRET!
    )as ResetTokenPayload;


    if (decoded.purpose !== "reset-password") {
      throw new ApiErrors(401, "Invalid reset token");
    }

    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    next(
      error instanceof ApiErrors
        ? error
        : new ApiErrors(401, "Invalid or expired reset token")
    );
  }
};