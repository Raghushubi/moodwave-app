import express from "express";
import { savePlaylist, getUserPlaylists } from "../controllers/playlistController.js";

const router = express.Router();

router.post("/save", savePlaylist);
router.get("/:userId", getUserPlaylists);

export default router;
