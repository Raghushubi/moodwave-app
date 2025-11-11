import express from "express";
import { getMusicByMood, postMusicFeedback, getCombinedMusic } from "../controllers/musicController.js";

const router = express.Router();

router.get("/combined", getCombinedMusic); 
router.get("/:moodId", getMusicByMood);
router.post("/feedback", postMusicFeedback);

export default router;
