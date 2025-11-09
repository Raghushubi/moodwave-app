// backend/controllers/musicController.js

import Mood from "../models/Mood.js";
import { getYouTubeSongs } from "../services/youtubeService.js";

// 🎵 Controller to fetch songs based on mood
export const getMusicByMood = async (req, res) => {
  try {
    const moodId = req.params.moodId;
    const mood = await Mood.findById(moodId);

    if (!mood) {
      return res.status(404).json({ message: "Mood not found" });
    }

    // Fetch songs from YouTube API for that mood
    const songs = await getYouTubeSongs(mood.name);

    res.status(200).json({
      mood: mood.name,
      songs,
    });
  } catch (error) {
    console.error("getMusicByMood error:", error);
    res.status(500).json({ message: "Server error fetching music" });
  }
};
