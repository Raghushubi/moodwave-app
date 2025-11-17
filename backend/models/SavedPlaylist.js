// backend/models/SavedPlaylist.js
import mongoose from "mongoose";

const savedPlaylistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    // We'll store mood NAMES as strings (e.g. ["Happy", "Calm"])
    moods: [
      {
        type: String,
        trim: true,
      },
    ],
    songs: [
      {
        title: { type: String, default: "" },
        url: { type: String, default: "" },
        thumbnail: { type: String, default: "" },
        channelTitle: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// Ensure default array values to avoid nulls
savedPlaylistSchema.pre("save", function (next) {
  if (!this.moods) this.moods = [];
  if (!Array.isArray(this.moods)) {
    // if somehow a string got through, try to convert
    if (typeof this.moods === "string") {
      this.moods = this.moods.split(",").map((m) => m.trim()).filter(Boolean);
    } else {
      this.moods = [];
    }
  }
  if (!this.songs) this.songs = [];
  next();
});

const SavedPlaylist = mongoose.models.SavedPlaylist || mongoose.model("SavedPlaylist", savedPlaylistSchema);
export default SavedPlaylist;
