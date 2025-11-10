import express from "express";
import { getUserAnalytics } from "../controllers/analyticsController.js";
const router = express.Router();

router.get("/:userId", getUserAnalytics);

export default router;