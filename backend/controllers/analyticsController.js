import MoodLog from "../models/MoodLog.js";
import mongoose from "mongoose";

/* ===========================================================
   🔹 GET /api/analytics/:userId
   FIXED: Professional analytics with proper single + combined counting
=========================================================== */
export const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch all logs with populated mood data
    const logs = await MoodLog.find({ user: userObjectId })
      .populate("mood", "name")
      .populate("moods", "name")
      .lean();

    if (!logs || logs.length === 0) {
      return res.json({ single: [], multi: [] });
    }

    // ========================================
    // SINGLE MOOD ANALYTICS
    // Count each mood individually (even from combined logs)
    // ========================================
    const singleCounts = {};

    logs.forEach((log) => {
      const moodNames = [];

      // Collect mood names from single mood field
      if (log.mood && log.mood.name) {
        moodNames.push(log.mood.name);
      }

      // Collect mood names from moods array
      if (log.moods && Array.isArray(log.moods)) {
        log.moods.forEach((m) => {
          if (m && m.name) {
            moodNames.push(m.name);
          }
        });
      }

      // Increment count for each mood
      moodNames.forEach((name) => {
        singleCounts[name] = (singleCounts[name] || 0) + 1;
      });
    });

    const singleArray = Object.entries(singleCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);

    // ========================================
    // COMBINED MOOD ANALYTICS
    // Group by unique combinations (order-independent)
    // ========================================
    const comboCounts = {};

    logs.forEach((log) => {
      const moodNames = [];

      // Only process logs with moods array (combined moods)
      if (log.moods && Array.isArray(log.moods) && log.moods.length > 1) {
        log.moods.forEach((m) => {
          if (m && m.name) {
            moodNames.push(m.name);
          }
        });

        if (moodNames.length > 1) {
          // Sort alphabetically to make order-independent key
          const sortedKey = [...moodNames].sort().join(" + ");
          
          if (!comboCounts[sortedKey]) {
            comboCounts[sortedKey] = {
              moods: [...moodNames].sort(), // Store sorted array
              count: 0
            };
          }
          comboCounts[sortedKey].count += 1;
        }
      }
    });

    const multiArray = Object.values(comboCounts)
      .sort((a, b) => b.count - a.count);

    // ========================================
    // RETURN RESULTS
    // ========================================
    res.json({
      single: singleArray,
      multi: multiArray,
      totalLogs: logs.length
    });

  } catch (error) {
    console.error("getUserAnalytics error:", error);
    res.status(500).json({ 
      message: "Error fetching analytics", 
      error: error.message 
    });
  }
};