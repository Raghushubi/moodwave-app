// backend/models/MoodLog.js
import mongoose from "mongoose";

const moodLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // single mood
    mood: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mood",
    },

    // multiple moods
    moods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mood",
      },
    ],

    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 250,
    },

    method: {
      type: String,
      enum: ["Webcam", "Manual", "Combined"],
      default: "Manual",
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const MoodLog = mongoose.model("MoodLog", moodLogSchema);
export default MoodLog;
