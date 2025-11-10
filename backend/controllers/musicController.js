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

// POST /api/music/feedback
export const postMusicFeedback = async (req, res) => {
  try {
    const { userId, youtubeId, feedback } = req.body;

    if (!userId || !youtubeId || !feedback) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // In a real system, you'd have a Song model; for now, just log feedback.
    console.log(`User ${userId} gave a ${feedback} to video ${youtubeId}`);

    res.status(201).json({ message: "Feedback recorded", userId, youtubeId, feedback });
  } catch (error) {
    console.error("postMusicFeedback error:", error);
    res.status(500).json({ message: "Error recording feedback" });
  }
};
