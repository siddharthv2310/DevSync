import { Request, Response, NextFunction } from "express"
import { forgetPasswordSchema, githubCallbackSchema, googleAuthSchema, loginSchema, registerSchema, setNewPasswordSchema, verifyLoginOtpSchema, verifyRegisterOtpSchema, verifyResetOtpSchema } from "./authValidation.js";
import { forgetPassword, getCurrentUser, loginUser, loginWithOAuth, logoutUser, refreshAccessToken, registerUser, resetPassword, verifyRegisterOtp, verifyResetOtp } from "./authService.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { verifyLoginOtp } from "./authService.js";
import { verifyGoogleToken } from "../../providers/googleProvider.js";
import { OAuthProfile } from "../../providers/authType.js";
import { verifyGithubCode } from "../../providers/githubProvider.js";
import crypto from "crypto";

// export const healthCheck = (req:Request , res:Response)=>{
//     res.status(200).json({success:true , message : "auth modeule working fine"});
// }

export const login = async (req: Request, res: Response) => {

    const result = loginSchema.safeParse(req.body);
    // above one have two outcome {error , data};

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "invalid request",
            errors: result.error.flatten(),
        });
    }

    const { email, password } = result.data;

    try {
        const { otp } = await loginUser(email, password);

        return res.status(200).json({
            success: true,
            message: "OTP send successfully",
            data: {
                requirestOtp: true,
            }
        });
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: error instanceof Error ? error.message : "Invalid email or password",
        });
    }
};

export const registerController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = registerSchema.safeParse(req.body);
  
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: result.error.flatten(),
      });
    }
  
    try {
      const { name, username, email, password } = result.data;
  
      await registerUser(name, username, email, password);
  
      return res.status(201).json({
        success: true,
        message: "Account created. Please verify the OTP sent to your email.",
        data: {
          email,
          requiresOtp: true,
        },
      });
    } catch (error) {
      next(error);
    }
  };

export const completeVerifyLoginOtp = async (req: Request, res: Response) => {
    const { data, error } = verifyLoginOtpSchema.safeParse(req.body);
    if (error) {
        return res.status(400).json({
            status: false,
            message: "Invalid request",
            errors: error.flatten(),
        });
    }

    const { email, otp } = data;

    try {

        const { user, accessToken, refreshToken } = await verifyLoginOtp(email, otp);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });


        return res.status(200).json({
            status: true,
            message: "OTP verifyied successfully",
            data: {
                user: {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                },
            }
        })

    }
    catch (error) {
        const statusCode = error instanceof ApiErrors ? error.statusCode : 500;

        return res.status(statusCode).json({
            status: false,
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
};

export const verifyRegisterOtpController = async (req: Request, res: Response, next: NextFunction) => {
   
    const result = verifyRegisterOtpSchema.safeParse(req.body);
  
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: result.error.flatten(),
      });
    }
  
    try {
      const { email, otp } = result.data;
  
      const { user, accessToken, refreshToken } = await verifyRegisterOtp(email, otp);
  
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      };
  
      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
  
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
  
      return res.status(200).json({
        success: true,
        message: "Account verified successfully.",
        data: {
          user: {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
          },
        },
      });
    }
    catch (error) {
      next(error);
    }
  };


export const getCurrentUserController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getCurrentUser(req.user!.userId);

        return res.status(200).json({
            success: true,
            message: "Authenticated",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};


export const refresh = async (req: Request, res: Response, next: NextFunction) => {

    const refreshToken = req.cookies.refreshToken;
  
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }
  
    try {
      const { accessToken } = await refreshAccessToken(refreshToken);
  
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });
  
      return res.status(200).json({
        success: true,
        message: "Access token refreshed",
      });
    }
    catch (error) {
      if (error instanceof ApiErrors) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }
  
      next(error);
    }
  };

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await logoutUser(req.user!.userId);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
        };

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        res.status(200).json({
            success: true,
            message: "user logged Out successfully",
        })
    }
    catch (error) {
        next(error);
    }
};

export const forgetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
    const result = forgetPasswordSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: true,
            message: "enter valid email",
            error: result.error.flatten(),
        });
    }
    try {
        await forgetPassword(result.data.email);

        return res.status(200).json({
            success: true,
            message: "otp send successfully",
        })
    }
    catch (error) {
        next(error);
    }

};

export const verifyResetOtpController = async (req: Request, res: Response, next: NextFunction) => {
    const { data, error } = verifyResetOtpSchema.safeParse(req.body);

    if (error) {
        return res.status(400).json({
            success: true,
            message: "Invalid request",
            error: error.flatten(),
        });
    }

    const { email, otp } = data;

    try {

        const resetToken = await verifyResetOtp(email, otp);

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resetToken,
        });

    }
    catch (error) {
        next(error);
    }
};

export const setNewPasswordController = async (req: Request, res: Response, next: NextFunction) => {
    const result = setNewPasswordSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid request",
            errors: result.error.flatten(),
        });
    }

    try {
        await resetPassword(
            req.user!.userId,
            result.data.newPassword
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. Please login again.",
        });
    }
    catch (error) {
        next(error);
    }
};

export const googleOAuthController = async (req: Request, res: Response, next: NextFunction) => {
    const result = googleAuthSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "InvallidRequest",
            error: result.error.flatten(),
        });
    }

    try {
        const profile: OAuthProfile = await verifyGoogleToken(result.data.idToken);

        const { user, accessToken, refreshToken } = await loginWithOAuth(profile);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            data: {
                user,
            }
        })

    }
    catch (error) {
        next(error);
    }
}

export const githubRedirectController = (req: Request, res: Response) => {
    const state = crypto.randomBytes(32).toString("hex");

    res.cookie("github_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
    });

    const githubUrl =
        "https://github.com/login/oauth/authorize?" +
        new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID!,
            redirect_uri:
                `${process.env.BACKEND_URL}/api/v1/auth/oauth/github/callback`,
            scope: "read:user user:email",
            state,
        }).toString();

    return res.redirect(githubUrl);
};

export const githubCallbackController = async (req: Request, res: Response, next: NextFunction) => {
    const result = githubCallbackSchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid GitHub callback",
            errors: result.error.flatten(),
        });
    }

    try {
        const { code, state } = result.data;

        const storedState = req.cookies.github_oauth_state;

        res.clearCookie("github_oauth_state", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        if (!storedState || storedState !== state) {
            throw new ApiErrors(401, "Invalid OAuth state");
        }

        const profile = await verifyGithubCode(code);

        const data = await loginWithOAuth(profile);

        res.cookie("refreshToken", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie("accessToken", data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });

        return res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
    } catch (error) {
        next(error);
    }
};

