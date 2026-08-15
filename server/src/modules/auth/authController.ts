import { Request, Response, NextFunction } from "express"
import { forgetPasswordSchema, loginSchema, refreshTokenSchema, setNewPasswordSchema, verifyLoginOtpSchema, verifyResetOtpSchema } from "./authValidation.js";
import { forgetPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, resetPassword, verifyResetOtp } from "./authService.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { verifyLoginOtp } from "./authService.js";

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

        return res.status(200).json({
            status: true,
            message: "OTP verifyied successfully",
            data: {
                user: {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                },
                accessToken,
                refreshToken,
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
    const result = refreshTokenSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid request",
            error: result.error.flatten(),
        });
    }

    try {
        const { refreshToken } = result.data;
        const accessToken = await refreshAccessToken(refreshToken);

        return res.status(200).json({
            success: true,
            message: "Access Token refreshed",
            data: accessToken,
        });
    }
    catch (error) {
        if (error instanceof ApiErrors)
            return res.status(401).json({
                success: false,
                message: error.message
            });

        next(error);
    }

};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await logoutUser(req.user!.userId);

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

export const setNewPasswordController = async ( req: Request, res: Response, next: NextFunction) => {
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

