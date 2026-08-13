import jwt, { SignOptions } from "jsonwebtoken";

export const generateAccessToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    {
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRES ?? "15m") as NonNullable<SignOptions["expiresIn"]>,
    }
  );
};

export const generateRefreshTokens = (userId:string)=>{
    return jwt.sign(
        {userId},
        process.env.JWT_REFRESH_SECRET!,
        {
            expiresIn : (process.env.REFRESH_TOKEN_EXPIRES ?? '7d') as NonNullable<SignOptions["expiresIn"]>,
        }
    );
};