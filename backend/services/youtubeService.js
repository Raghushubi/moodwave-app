import axios from "axios";

const SONG_QUERY_MAP = {
  Happy: ["pop hits", "english songs", "upbeat songs", "top tracks"],
  Sad: ["sad songs", "english sad songs", "breakup tracks", "emotional songs"],
  Calm: ["soft pop", "ambient chill", "acoustic songs", "calm indie"],
  Energetic: ["workout music", "edm hits", "hype pop", "dance music"],
  Romantic: ["love songs", "couple songs", "romantic hits", "english romantic"],
  Angry: ["rock metal", "hard rock songs", "rage playlist", "energy rock"],
  Anxious: ["chill indie", "soft pop calm", "soothing indie", "gentle english"],
  Peaceful: ["acoustic chill", "soft piano songs", "indie calm playlist"],
};

export const getYouTubeSongs = async (mood) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

    // Pick query list for mood OR fallback
    const queries = SONG_QUERY_MAP[mood] || ["top english songs"];

    // Choose randomly so results don't repeat always
    const search = queries[Math.floor(Math.random() * queries.length)];

    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=video&videoCategoryId=10` +
      `&maxResults=12&q=${encodeURIComponent(search)}` +
      `&key=${apiKey}`;

    const { data } = await axios.get(url);

    const songs = data.items
      .filter((item) => item.id.videoId) // remove shorts & weird junk
      .map((item) => ({
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails?.medium?.url,
      }));

    // fallback if empty
    if (!songs.length) {
      return [
        {
          title: "Chill Songs Vol.02 | Cozy Vibes",
          url: "https://www.youtube.com/watch?v=8O-1qB-fxjc",
          thumbnail: "https://i.ytimg.com/vi/8O-1qB-fxjc/mqdefault.jpg",
          channelTitle: "MocktailMusic",
        },
      ];
    }

    return songs;
  } catch (err) {
    console.error("YouTubeService Error:", err.message);
    return [];
  }
};
