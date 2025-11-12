import SavedPlaylist from "../models/SavedPlaylist.js";

// 🎧 Save new playlist
export const savePlaylist = async (req, res) => {
  try {
    const { userId, name, moods, songs } = req.body;

    if (!userId || !songs || songs.length === 0) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const playlist = new SavedPlaylist({
      user: userId,
      name: name || `Playlist - ${moods?.join(", ") || "Custom"}`,
      moods,
      songs,
    });

    await playlist.save();

    res.status(201).json({ message: "Playlist saved successfully", playlist });
  } catch (error) {
    console.error("savePlaylist error:", error);
    res.status(500).json({ message: "Error saving playlist" });
  }
};

// 📜 Get all playlists for a user
export const getUserPlaylists = async (req, res) => {
  try {
    const { userId } = req.params;
    const playlists = await SavedPlaylist.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(playlists);
  } catch (error) {
    console.error("getUserPlaylists error:", error);
    res.status(500).json({ message: "Error fetching playlists" });
  }
};
