import { getYouTubeSongs } from "../services/youtubeService.js";
import Mood from "../models/Mood.js";

export const getCombinedMusic = async (req, res) => {
  try {
    const moods = req.query.moods?.split(",").map((m) => m.trim()) || [];

    if (moods.length === 0) {
      return res.status(400).json({ message: "At least one mood required" });
    }

    // Fetch only valid mood names from DB (ignore invalid ones)
    const validMoods = await Mood.find({ name: { $in: moods } }).select("name");
    const moodNames = validMoods.map((m) => m.name);

    if (moodNames.length === 0) {
      return res.status(404).json({ message: "No valid moods found" });
    }

    const songs = await getYouTubeSongs(moodNames, 15); 

    res.status(200).json({
      combinedMoods: moodNames,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("getCombinedMusic error:", error);
    res.status(500).json({ message: "Error fetching combined playlist" });
  }
};
