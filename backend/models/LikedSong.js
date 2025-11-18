// backend/models/LikedSong.js
import mongoose from "mongoose";

const LikedSongSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  youtubeId: { type: String, required: true },
  title: String,
  thumbnail: String,
  channelTitle: String,
  url: String,
}, { timestamps: true });

export default mongoose.model("LikedSong", LikedSongSchema);
