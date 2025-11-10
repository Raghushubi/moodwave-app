import MoodLog from "../models/MoodLog.js";

export const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await MoodLog.aggregate([
      { $match: { user: { $toObjectId: userId } } },
      {
        $lookup: {
          from: "moods",
          localField: "mood",
          foreignField: "_id",
          as: "moodDetails"
        }
      },
      { $unwind: "$moodDetails" },
      {
        $group: {
          _id: "$moodDetails.name",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};