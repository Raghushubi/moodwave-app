import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String },
  youtubeId: { type: String, required: true, unique: true },
  thumbnailUrl: { type: String },
  mood: { type: mongoose.Schema.Types.ObjectId, ref: "Mood" },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
}, { timestamps: true });

const Song = mongoose.models.Song || mongoose.model("Song", songSchema);
export default Song;