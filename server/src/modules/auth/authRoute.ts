import { Router } from "express";
import  {healthCheck} from "./authController.js";

const router = Router();

router.get("/health", healthCheck);

export default router;