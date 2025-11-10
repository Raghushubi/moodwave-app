// backend/controllers/moodController.js
import Mood from "../models/Mood.js";
import MoodLog from "../models/MoodLog.js";

// GET /api/moods
export const getMoods = async (req, res) => {
  try {
    const moods = await Mood.find().sort({ name: 1 });
    res.json(moods);
  } catch (error) {
    console.error("getMoods error:", error);
    res.status(500).json({ message: "Error fetching moods" });
  }
};

// POST /api/moods/log
export const logMood = async (req, res) => {
  try {
    const { userId, moodId, method, confidence } = req.body;

    if (!userId || !moodId) {
      return res.status(400).json({ message: "userId and moodId are required" });
    }

    const newLog = await MoodLog.create({
      user: userId,
      mood: moodId,
      method: method || "Manual",
      confidence: typeof confidence === "number" ? confidence : null
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error("logMood error:", error);
    res.status(500).json({ message: "Error logging mood" });
  }
};

// OPTIONAL small helper: get user's mood history (useful for testing)
export const getUserMoodHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await MoodLog.find({ user: userId })
      .populate("mood", "name colorCode icon")
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error("getUserMoodHistory error:", error);
    res.status(500).json({ message: "Error fetching mood history" });
  }
};

export const getSocialMatches = async (req, res) => {
  try {
    const { mood, interests } = req.body;

    // Temporary simulated data (later you can connect to actual user collection)
    const users = [
      { name: "Aarav", mood: "happy", interests: ["travel", "music"] },
      { name: "Meera", mood: "calm", interests: ["books", "art"] },
      { name: "Rohan", mood: "sad", interests: ["movies", "writing"] },
      { name: "Greeshmitha", mood: "happy", interests: ["music", "dance"] },
    ];

    // Filter users by matching mood or overlapping interests
    const matches = users.filter(
      (u) => u.mood === mood || u.interests.some((i) => interests.includes(i))
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
