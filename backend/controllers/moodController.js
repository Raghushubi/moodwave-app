import Mood from "../models/Mood.js";
import MoodLog from "../models/MoodLog.js";
import mongoose from "mongoose";

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
   🔹 POST /api/moods/log
   Log a mood entry (single or combined moods)
=========================================================== */
export const logMood = async (req, res) => {
  try {
    const { userId, moodId, moodName, moodNames, method, confidence } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // -------------------------
    // CASE 1: Single mood by ID or name
    // -------------------------
    if (moodId || moodName) {
      let moodRef;

      if (moodId) {
        if (!mongoose.Types.ObjectId.isValid(moodId)) {
          return res.status(400).json({ message: "Invalid moodId format" });
        }
        const moodExists = await Mood.findById(moodId);
        if (!moodExists) {
          return res.status(404).json({ message: "Mood not found" });
        }
        moodRef = moodId;
      } else {
        const trimmed = moodName.trim();
        const mood = await Mood.findOne({ 
          name: { $regex: `^${trimmed}$`, $options: "i" } 
        });
        if (!mood) {
          return res.status(404).json({ message: `Mood '${trimmed}' not found` });
        }
        moodRef = mood._id;
      }

      const newLog = await MoodLog.create({
        user: userId,
        mood: moodRef,
        moods: [], // Explicitly set empty array for single mood
        method: method || "Manual",
        confidence: typeof confidence === "number" ? confidence : null,
      });

      const populatedLog = await MoodLog.findById(newLog._id)
        .populate("mood", "name colorCode icon");

      return res.status(201).json(populatedLog);
    }

    // -------------------------
    // CASE 2: Combined moods (array of names or IDs)
    // -------------------------
    if (Array.isArray(moodNames) && moodNames.length > 0) {
      // Clean input
      const cleaned = moodNames
        .map((m) => (typeof m === "string" ? m.trim() : m))
        .filter((m) => m !== null && m !== undefined && m !== "");

      if (cleaned.length === 0) {
        return res.status(400).json({ message: "No valid mood names provided" });
      }

      // Fetch all moods once for efficiency
      const allMoods = await Mood.find({});
      const nameMap = new Map();
      const idMap = new Map();

      allMoods.forEach((doc) => {
        nameMap.set(doc.name.toLowerCase(), doc);
        idMap.set(String(doc._id), doc);
      });

      const resolvedIds = [];
      const invalids = [];

      for (const entry of cleaned) {
        let found = false;

        // Try as ObjectId first
        if (typeof entry === "string" && mongoose.Types.ObjectId.isValid(entry)) {
          const doc = idMap.get(entry);
          if (doc) {
            resolvedIds.push(doc._id);
            found = true;
          }
        }

        // Try as name (case-insensitive)
        if (!found && typeof entry === "string") {
          const doc = nameMap.get(entry.toLowerCase());
          if (doc) {
            resolvedIds.push(doc._id);
            found = true;
          }
        }

        if (!found) {
          invalids.push(entry);
        }
      }

      if (resolvedIds.length === 0) {
        return res.status(400).json({
          message: "No valid moods found",
          invalids,
        });
      }

      // Deduplicate IDs
      const uniqueIds = [...new Set(resolvedIds.map(String))];

      // Create log with ONLY moods array (no single mood field)
      const newLog = await MoodLog.create({
        user: userId,
        mood: null, // Explicitly null for combined moods
        moods: uniqueIds,
        method: method || "Combined",
        confidence: typeof confidence === "number" ? confidence : 1.0,
      });

      const populatedLog = await MoodLog.findById(newLog._id)
        .populate("moods", "name colorCode icon");

      return res.status(201).json({
        log: populatedLog,
        warning: invalids.length > 0 ? `Some entries were invalid: ${invalids.join(", ")}` : undefined,
      });
    }

    return res.status(400).json({ message: "Invalid mood input - provide moodId/moodName or moodNames array" });
  } catch (error) {
    console.error("logMood error:", error);
    return res.status(500).json({ message: "Error logging mood", error: error.message });
  }
};

/* ===========================================================
   🔹 GET /api/moods/user/:userId/history
   Fetch user's mood history (supports single + combined)
   FIXED: Removed broken validation
=========================================================== */
export const getUserMoodHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
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

/* ===========================================================
   🔹 POST /api/social/suggestions
   Sample social matches endpoint
=========================================================== */
export const getSocialMatches = async (req, res) => {
  try {
    const { mood, interests } = req.body;

    const users = [
      { name: "Aarav", mood: "Happy", interests: ["travel", "music"] },
      { name: "Meera", mood: "Calm", interests: ["books", "art"] },
      { name: "Rohan", mood: "Sad", interests: ["movies", "writing"] },
      { name: "Greeshmitha", mood: "Happy", interests: ["music", "dance"] },
    ];

    const matches = users.filter(
      (u) => u.mood === mood || u.interests.some((i) => interests?.includes(i))
    );

    res.status(200).json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("getSocialMatches error:", error);
    res.status(500).json({ success: false, message: "Error finding matches" });
  }
};