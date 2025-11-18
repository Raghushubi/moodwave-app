// backend/models/Feed.js
import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
});

const FeedSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["mood", "song", "playlist", "custom"], required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { mood, emoji, caption } or { title, youtubeId, mood }
  comments: [CommentSchema],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Feed", FeedSchema);
