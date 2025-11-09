import express from "express";
import { getMusicByMood } from "../controllers/musicController.js";

const router = express.Router();

// GET /api/music/:moodId → fetch YouTube songs for given mood
router.get("/:moodId", getMusicByMood);

export default router;
