// backend/controllers/socialController.js
import mongoose from "mongoose";
import User from "./../models/User.js";
import MoodLog from "./../models/MoodLog.js";

/**
 * Compute a simple frequency-based similarity:
 * score = (sum of min counts for shared moods) / (total counts of target user's moods) * 100
 */
function computeSimilarityAndShared(targetMap, otherMap) {
  let overlap = 0;
  let totalTarget = 0;

  for (const [mood, cnt] of Object.entries(targetMap)) {
    totalTarget += cnt;
  }
  if (totalTarget === 0) return { score: 0, shared: [] };

  const shared = [];

  for (const [mood, cntA] of Object.entries(targetMap)) {
    const cntB = otherMap[mood] || 0;
    if (cntB > 0) {
      overlap += Math.min(cntA, cntB);
      shared.push({ mood, countA: cntA, countB: cntB });
    }
  }

  const score = Math.round((overlap / totalTarget) * 100);
  // sort shared moods by combined count desc and pick top 3
  shared.sort((a, b) => (b.countA + b.countB) - (a.countA + a.countB));
  const topShared = shared.slice(0, 3).map(s => s.mood);

  return { score, sharedMoods: topShared };
}

/**
 * GET /api/social/suggestions/:userId
 */
export const getSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const targetId = new mongoose.Types.ObjectId(userId);

    // 1) Get target user's mood frequencies (by mood name)
    const targetAgg = await MoodLog.aggregate([
      { $match: { user: targetId } },
      {
        $lookup: {
          from: "moods",
          localField: "mood",
          foreignField: "_id",
          as: "moodDoc",
        },
      },
      { $unwind: "$moodDoc" },
      { $group: { _id: "$moodDoc.name", count: { $sum: 1 } } },
    ]);

    const targetMap = {};
    targetAgg.forEach((d) => {
      if (d._id) targetMap[d._id.toLowerCase()] = d.count;
    });

    // 2) Get other users' mood frequencies in ONE aggregated query grouped by user
    const othersAgg = await MoodLog.aggregate([
      { $match: { user: { $ne: targetId } } },
      {
        $lookup: {
          from: "moods",
          localField: "mood",
          foreignField: "_id",
          as: "moodDoc",
        },
      },
      { $unwind: "$moodDoc" },
      {
        $group: {
          _id: { user: "$user", moodName: { $toLower: "$moodDoc.name" } },
          count: { $sum: 1 },
        },
      },
      {
        // reshape: group by user and push moods
        $group: {
          _id: "$_id.user",
          moods: { $push: { mood: "$_id.moodName", count: "$count" } },
        },
      },
    ]);

    // Early exit: if no target moods, return empty list quickly
    if (Object.keys(targetMap).length === 0) {
      // still return users but all 0 — or empty? we'll return empty array to avoid explosion
      return res.json([]);
    }

    // 3) For each userAgg build a map and compute similarity
    const suggestions = [];
    const otherUserIds = [];

    for (const u of othersAgg) {
      const otherMap = {};
      (u.moods || []).forEach((m) => {
        otherMap[m.mood] = m.count;
      });

      const { score, sharedMoods } = computeSimilarityAndShared(targetMap, otherMap);
      suggestions.push({ userId: u._id, score, sharedMoods });
      otherUserIds.push(u._id);
    }

    // 4) Fetch user details for users present in suggestions
    const users = await User.find({ _id: { $in: otherUserIds } })
      .select("_id name email")
      .lean();

    const usersById = {};
    users.forEach((u) => (usersById[u._id.toString()] = u));

    // 5) Combine and sort, limit to top 50
    const enriched = suggestions
      .map((s) => {
        const uid = s.userId.toString();
        const user = usersById[uid] || { _id: uid, name: "Unknown", email: "" };
        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          score: s.score,
          sharedMoods: s.sharedMoods,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json(enriched);
  } catch (err) {
    console.error("Error in getSuggestions:", err);
    res.status(500).json({ error: "Server error" });
  }
};
