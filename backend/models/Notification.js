// backend/models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // receiver
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional actor
  type: { type: String, enum: ["friend_request", "friend_accept", "comment", "reply"], required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", NotificationSchema);
