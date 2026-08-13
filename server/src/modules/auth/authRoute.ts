import { Router } from "express";
import  {completeVerifyLoginOtp, getCurrentUser, login} from "./authController.js";

const router = Router();

// router.get("/health", healthCheck);
router.post("/login",login);
router.post("/login/verify-otp",completeVerifyLoginOtp);
router.get("/me",getCurrentUser);

export default router;