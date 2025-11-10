import mongoose from "mongoose";

const moodLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mood: { type: mongoose.Schema.Types.ObjectId, ref: "Mood", required: true },
  method: { type: String, enum: ["Webcam", "Manual"], default: "Manual" },
  // optional confidence from AI (0-1)
  confidence: { type: Number, min: 0, max: 1, default: null },
  timestamp: { type: Date, default: Date.now }
});

const MoodLog = mongoose.model("MoodLog", moodLogSchema);
export default MoodLog;