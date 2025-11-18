import express from "express";
import { saveLikedSong, getLikedSongs, removeLikedSong } from "../controllers/likedSongsController.js";

const router = express.Router();

router.post("/add", saveLikedSong);
router.get("/:userId", getLikedSongs);
router.delete("/:userId/:youtubeId", removeLikedSong);

export default router;
