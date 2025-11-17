// backend/controllers/playlistController.js
import SavedPlaylist from "../models/SavedPlaylist.js";

/**
 * Helper: sanitize moods input into an array of clean strings.
 * Removes falsy values and any "Custom" placeholders.
 */
function normalizeMoods(raw) {
  if (!raw) return [];

  // If a single string like "Happy, Calm"
  if (typeof raw === "string") {
    raw = raw.split(",").map((m) => m.trim());
  }

  if (!Array.isArray(raw)) return [];

  const cleaned = raw
    .map((m) => (m || "").toString().trim())
    .filter((m) => m.length > 0 && m.toLowerCase() !== "custom" && m.toLowerCase() !== "unspecified");

  // Deduplicate while preserving order
  const seen = new Set();
  return cleaned.filter((m) => {
    const key = m.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 🎧 Save new playlist
export const savePlaylist = async (req, res) => {
  try {
    const { userId, name, moods, songs } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }
    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ message: "Missing songs (provide a non-empty songs array)" });
    }

    const normalizedMoods = normalizeMoods(moods);

    // If no explicit name provided, build a safe default
    const finalName =
      (typeof name === "string" && name.trim().length > 0)
        ? name.trim()
        : `Playlist - ${normalizedMoods.length > 0 ? normalizedMoods.join(", ") : "Unspecified"}`;

    const playlist = new SavedPlaylist({
      user: userId,
      name: finalName,
      moods: normalizedMoods,
      songs,
    });

    await playlist.save();

    return res.status(201).json({ message: "Playlist saved successfully", playlist });
  } catch (error) {
    console.error("savePlaylist error:", error);
    return res.status(500).json({ message: "Error saving playlist" });
  }
};

// 📜 Get all playlists for a user
export const getUserPlaylists = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Missing userId param" });

    // Return playlists most recent first
    const playlists = await SavedPlaylist.find({ user: userId }).sort({ createdAt: -1 }).lean();

    // Defensive fix: ensure moods array exists and doesn't contain "Custom"
    const cleaned = playlists.map((pl) => {
      let moods = Array.isArray(pl.moods) ? pl.moods : [];
      moods = moods.map((m) => (m || "").toString().trim()).filter((m) => m.length > 0 && m.toLowerCase() !== "custom");
      // dedupe
      const seen = new Set();
      moods = moods.filter((m) => {
        const key = m.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Ensure name fallback is sane
      const name = pl.name && pl.name.trim().length > 0 ? pl.name : `Playlist - ${moods.length > 0 ? moods.join(", ") : "Unspecified"}`;

      return {
        ...pl,
        moods,
        name,
      };
    });

    return res.json(cleaned);
  } catch (error) {
    console.error("getUserPlaylists error:", error);
    return res.status(500).json({ message: "Error fetching playlists" });
  }
};

export const renamePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0)
      return res.status(400).json({ message: "Invalid name" });

    const updated = await SavedPlaylist.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    return res.json(updated);
  } catch (err) {
    console.error("renamePlaylist error:", err);
    res.status(500).json({ message: "Rename failed" });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;

    await SavedPlaylist.findByIdAndDelete(id);

    res.json({ message: "Playlist deleted" });
  } catch (err) {
    console.error("deletePlaylist error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

