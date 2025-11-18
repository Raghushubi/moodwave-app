import LikedSong from "../models/LikedSong.js";

export const saveLikedSong = async (req, res) => {
  try {
    const { userId, youtubeId, title, thumbnail, channelTitle, url } = req.body;

    const exists = await LikedSong.findOne({ userId, youtubeId });
    if (exists) return res.status(200).json({ message: "Already saved" });

    const song = await LikedSong.create({
      userId,
      youtubeId,
      title,
      thumbnail,
      channelTitle,
      url,
    });

    res.status(201).json(song);
  } catch (error) {
    console.error("saveLikedSong error:", error);
    res.status(500).json({ message: "Error saving liked song" });
  }
};

export const getLikedSongs = async (req, res) => {
  try {
    const { userId } = req.params;
    const songs = await LikedSong.find({ userId }).sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch liked songs" });
  }
};

export const removeLikedSong = async (req, res) => {
  try {
    const { userId, youtubeId } = req.params;
    await LikedSong.deleteOne({ userId, youtubeId });
    res.json({ message: "Removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove song" });
  }
};
