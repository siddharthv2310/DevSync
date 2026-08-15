import { Router } from "express";
import  {completeVerifyLoginOtp,forgetPasswordController,getCurrentUserController, login, logout, refresh} from "./authController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = Router();

// router.get("/health", healthCheck);
router.post("/login",login);
router.post("/login/verify-otp",completeVerifyLoginOtp);
router.get("/me",authMiddleware , getCurrentUserController);
router.post("/refresh",refresh);
router.post("/logout",authMiddleware,logout);
router.post("/forget-password",forgetPasswordController);


export default router;