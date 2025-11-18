// backend/models/Connection.js
import mongoose from "mongoose";

const ConnectionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  friend: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["connected", "pending"], default: "connected" },
  createdAt: { type: Date, default: Date.now },
});

ConnectionSchema.index({ user: 1, friend: 1 }, { unique: true });

export default mongoose.model("Connection", ConnectionSchema);
