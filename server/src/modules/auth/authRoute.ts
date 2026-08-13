import { Router } from "express";
import  {login} from "./authController.js";

const router = Router();

// router.get("/health", healthCheck);
router.post("/login",login);

export default router;