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
    moods: [
      {
        type: String,
      },
    ],
    songs: [
      {
        title: String,
        url: String,
        thumbnail: String,
        channelTitle: String,
      },
    ],
  },
  { timestamps: true }
);

const SavedPlaylist = mongoose.model("SavedPlaylist", savedPlaylistSchema);
export default SavedPlaylist;
