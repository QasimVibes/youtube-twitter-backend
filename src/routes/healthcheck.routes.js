import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";
import { varifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(varifyJwt)
router.route("/").get(healthcheck)

export default router