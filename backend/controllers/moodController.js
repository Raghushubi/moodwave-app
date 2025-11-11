import Mood from "../models/Mood.js";
import MoodLog from "../models/MoodLog.js";

/* ===========================================================
   🔹 GET /api/moods
   Fetch all moods available in the database
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
   🔹 POST /api/moods/log
   Log a mood entry (works for single or combined moods)
=========================================================== */
export const logMood = async (req, res) => {
  try {
    const { userId, moodId, moodName, moodNames, method, confidence } = req.body;

    if (!userId || (!moodId && !moodName && !moodNames)) {
      return res.status(400).json({ message: "userId and mood info are required" });
    }

    // 🔹 Handle single mood logging (moodId or moodName)
    if (moodId || moodName) {
      let moodRef;
      if (moodName) {
        const mood = await Mood.findOne({ name: moodName });
        if (!mood) {
          return res.status(404).json({ message: `Mood '${moodName}' not found` });
        }
        moodRef = mood._id;
      } else {
        moodRef = moodId;
      }

      const newLog = await MoodLog.create({
        user: userId,
        mood: moodRef,
        method: method || "Manual",
        confidence: typeof confidence === "number" ? confidence : null,
      });

      return res.status(201).json(newLog);
    }

    // 🔹 Handle combined moods (multiple names)
    if (Array.isArray(moodNames) && moodNames.length > 0) {
      const moodDocs = await Mood.find({ name: { $in: moodNames } });

      if (moodDocs.length === 0) {
        return res.status(404).json({ message: "No valid moods found for combined log" });
      }

      const newLog = await MoodLog.create({
        user: userId,
        moods: moodDocs.map((m) => m._id),
        method: method || "Combined",
        confidence: typeof confidence === "number" ? confidence : 1.0,
      });

      return res.status(201).json(newLog);
    }

    res.status(400).json({ message: "Invalid mood input" });
  } catch (error) {
    console.error("logMood error:", error);
    res.status(500).json({ message: "Error logging mood" });
  }
};

/* ===========================================================
   🔹 GET /api/moods/user/:userId/history
   Fetch a user’s entire mood history (supports combined moods)
=========================================================== */
export const getUserMoodHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const logs = await MoodLog.find({ user: userId })
      .populate("mood", "name colorCode icon")   // single mood
      .populate("moods", "name colorCode icon")  // combined moods
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
   Dummy endpoint: returns sample social matches
=========================================================== */
export const getSocialMatches = async (req, res) => {
  try {
    const { mood, interests } = req.body;

    // Temporary mock data (you can replace this with DB users)
    const users = [
      { name: "Aarav", mood: "Happy", interests: ["travel", "music"] },
      { name: "Meera", mood: "Calm", interests: ["books", "art"] },
      { name: "Rohan", mood: "Sad", interests: ["movies", "writing"] },
      { name: "Greeshmitha", mood: "Happy", interests: ["music", "dance"] },
    ];

    // Match users by shared mood or overlapping interests
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
