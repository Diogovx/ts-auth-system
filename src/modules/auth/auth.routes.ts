import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { registerSchema, loginSchema } from "./auth.validation";
import { authRateLimiter } from "../../middlewares/rateLimiters";

const router = Router();
const controller = new AuthController();

router.post("/register", authRateLimiter, validate(registerSchema), controller.register.bind(controller));
router.post("/login", authRateLimiter, validate(loginSchema), controller.login.bind(controller));
router.post("/refresh", controller.refresh.bind(controller));
router.post("/logout", controller.logout.bind(controller));

export default router;
