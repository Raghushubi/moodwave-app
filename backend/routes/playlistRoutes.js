// backend/routes/playlistRoutes.js
import express from "express";
import {
  savePlaylist,
  getUserPlaylists,
  renamePlaylist,
  deletePlaylist
} from "../controllers/playlistController.js";

const router = express.Router();

router.post("/save", savePlaylist);
router.get("/:userId", getUserPlaylists);
router.put("/rename/:id", renamePlaylist);
router.delete("/delete/:id", deletePlaylist);

export default router;
