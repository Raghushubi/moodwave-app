import express from "express";
import { getMusicByMood, postMusicFeedback } from "../controllers/musicController.js";

const router = express.Router();

router.get("/:moodId", getMusicByMood);
router.post("/feedback", postMusicFeedback);

export default router;