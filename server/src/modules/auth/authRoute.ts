import { Router } from "express";
import  {completeVerifyLoginOtp,forgetPasswordController,getCurrentUserController, githubCallbackController, githubRedirectController, googleOAuthController, login, logout, refresh, registerController, setNewPasswordController, verifyRegisterOtpController, verifyResetOtpController} from "./authController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { resetPasswordMiddleware } from "../../middlewares/resetPasswordMiddleware.js";


const router = Router();

// router.get("/health", healthCheck);
router.post("/register",registerController);
router.post("/verify-register-otp", verifyRegisterOtpController);
router.post("/login",login);
router.post("/login/verify-otp",completeVerifyLoginOtp);
router.get("/me",authMiddleware , getCurrentUserController);
router.post("/refresh",refresh);
router.post("/logout",authMiddleware,logout);
router.post("/forget-password",forgetPasswordController);
router.post("/verify-reset-otp", verifyResetOtpController);
router.post("/reset-new-password",resetPasswordMiddleware, setNewPasswordController);
router.post("/oauth/google",googleOAuthController);
router.get("/oauth/github", githubRedirectController);
router.get("/oauth/github/callback", githubCallbackController);

export default router;