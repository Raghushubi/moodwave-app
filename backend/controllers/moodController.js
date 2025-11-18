// backend/controllers/moodController.js
import Mood from "../models/Mood.js";
import MoodLog from "../models/MoodLog.js";
import Feed from "../models/Feed.js";       // <-- FEED MODEL ADDED
import mongoose from "mongoose";

/* ===========================================================
   GET /api/moods
=========================================================== */
export const getMoods = async (req, res) => {
  try {
    const moods = await Mood.find().sort({ name: 1 });
    res.json(moods);
  } catch (error) {
    console.error("getMoods error:", error);
    res.status(500).json({ message: "Error fetching moods" });
  }
};

/* ===========================================================
   POST /api/moods/log
   Log a mood entry (single OR combined)
   + FEED CREATION ADDED HERE
=========================================================== */
/* ===========================================================
   🔹 POST /api/moods/log
   Log mood + create feed item
=========================================================== */
export const logMood = async (req, res) => {
  try {
    const { userId, moodId, moodName, moodNames, method, confidence, caption } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // ============ CASE 1: Single Mood ============
    if (moodId || moodName) {
      let moodDoc;

      if (moodId) {
        moodDoc = await Mood.findById(moodId);
      } else {
        moodDoc = await Mood.findOne({
          name: { $regex: `^${moodName.trim()}$`, $options: "i" },
        });
      }

      if (!moodDoc) return res.status(404).json({ message: "Mood not found" });

      const newLog = await MoodLog.create({
        user: userId,
        mood: moodDoc._id,
        moods: [],
        caption: caption || "",
        method: method || "Manual",
        confidence: typeof confidence === "number" ? confidence : null,
      });

      // FEED HOOK
      await Feed.create({
        owner: userId,
        type: "mood",
        payload: {
          mood: moodDoc.name,
          emoji: moodDoc.icon || "",
          caption: caption || "",
        },
      });

      const populatedLog = await MoodLog.findById(newLog._id)
        .populate("mood", "name colorCode icon");

      return res.status(201).json(populatedLog);
    }

    // ============ CASE 2: Combined Moods ============
    if (Array.isArray(moodNames) && moodNames.length > 0) {
      const allMoods = await Mood.find({});

      const nameMap = new Map();
      const idMap = new Map();
      allMoods.forEach((doc) => {
        nameMap.set(doc.name.toLowerCase(), doc);
        idMap.set(String(doc._id), doc);
      });

      const resolved = [];

      for (const entry of moodNames) {
        const clean = entry.trim().toLowerCase();
        if (mongoose.Types.ObjectId.isValid(entry) && idMap.get(entry)) {
          resolved.push(idMap.get(entry));
        } else if (nameMap.get(clean)) {
          resolved.push(nameMap.get(clean));
        }
      }

      if (resolved.length === 0) {
        return res.status(400).json({ message: "No valid moods found" });
      }

      const uniqueIds = [...new Set(resolved.map((m) => m._id.toString()))];

      const newLog = await MoodLog.create({
        user: userId,
        mood: null,
        moods: uniqueIds,
        caption: caption || "",
        method: method || "Combined",
        confidence: typeof confidence === "number" ? confidence : 1.0,
      });

      // FEED HOOK for combined mood
      const names = resolved.map((m) => m.name);

      await Feed.create({
        owner: userId,
        type: "mood",
        payload: {
          mood: names.join(", "),
          emoji: "",
          caption: caption || "",
        },
      });

      const populated = await MoodLog.findById(newLog._id)
        .populate("moods", "name colorCode icon");

      return res.status(201).json(populated);
    }

    return res.status(400).json({ message: "Invalid mood input" });

  } catch (error) {
    console.error("logMood error:", error);
    res.status(500).json({ message: "Error logging mood", error: error.message });
  }
};

/* ===========================================================
   GET /api/moods/user/:userId/history
=========================================================== */
export const getUserMoodHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const logs = await MoodLog.find({ user: userId })
      .populate("mood", "name colorCode icon")
      .populate("moods", "name colorCode icon")
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error("getUserMoodHistory error:", error);
    res.status(500).json({ message: "Error fetching mood history" });
  }
};
