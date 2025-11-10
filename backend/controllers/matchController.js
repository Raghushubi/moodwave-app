import MoodLog from "../models/MoodLog.js"; // Your mood logging model
import User from "../models/User.js";

export const findMatches = async (req, res) => {
  try {
    const moodId = req.params.moodId;
    // Find recent mood logs with the same mood, exclude current user (optional)
    const logs = await MoodLog.find({ moodId })
      .populate("userId", "name email")
      .limit(10);
    // Return array of user profiles
    const users = logs.map(log => log.userId);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Matching failed" });
  }
};
