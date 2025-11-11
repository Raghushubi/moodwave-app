import Mood from "../models/Mood.js";
import { getYouTubeSongs } from "../services/youtubeService.js";

// 🎵 Fetch songs for a single mood
export const getMusicByMood = async (req, res) => {
  try {
    const moodId = req.params.moodId;
    const mood = await Mood.findById(moodId);

    if (!mood) {
      return res.status(404).json({ message: "Mood not found" });
    }

    const songs = await getYouTubeSongs(mood.name);
    res.status(200).json({ mood: mood.name, songs });
  } catch (error) {
    console.error("getMusicByMood error:", error);
    res.status(500).json({ message: "Server error fetching music" });
  }
};

// 🎧 Combined playlist across multiple moods
export const getCombinedMusic = async (req, res) => {
  try {
    const moodsParam = req.query.moods;
    if (!moodsParam) {
      return res.status(400).json({ message: "Missing moods parameter" });
    }

    const moodList = moodsParam.split(",");
    console.log("🎧 Generating combined playlist for:", moodList);

    // Fetch songs for each mood (parallel)
    const moodSongArrays = await Promise.all(
      moodList.map((mood) => getYouTubeSongs(mood))
    );

    // Flatten all arrays + remove duplicates
    const allSongs = moodSongArrays.flat();
    const uniqueSongs = allSongs.filter(
      (song, index, self) =>
        index === self.findIndex((s) => s.url === song.url)
    );

    res.status(200).json({
      combinedMoods: moodList,
      songs: uniqueSongs.slice(0, 10), // Limit to 10 songs for frontend
    });
  } catch (error) {
    console.error("getCombinedMusic error:", error);
    res.status(500).json({ message: "Error generating combined playlist" });
  }
};

// ❤️ Handle feedback (like/dislike)
export const postMusicFeedback = async (req, res) => {
  try {
    const { userId, youtubeId, feedback } = req.body;
    if (!userId || !youtubeId || !feedback) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log(`🎵 Feedback: User ${userId} gave '${feedback}' to ${youtubeId}`);
    res.status(201).json({ message: "Feedback recorded", userId, youtubeId, feedback });
  } catch (error) {
    console.error("postMusicFeedback error:", error);
    res.status(500).json({ message: "Error recording feedback" });
  }
};
