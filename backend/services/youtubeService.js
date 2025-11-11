import axios from "axios";

const FALLBACK_SONGS = [
  {
    title: "Lofi Chill Beats to Relax",
    url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    thumbnail: "https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg",
    channelTitle: "Lofi Girl",
  },
  {
    title: "Calm Vibes Mix 🌙",
    url: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
    thumbnail: "https://img.youtube.com/vi/DWcJFNfaw9c/mqdefault.jpg",
    channelTitle: "Chillhop Music",
  },
  {
    title: "Soft Piano & Rain Sounds ☔",
    url: "https://www.youtube.com/watch?v=Mt4wzK0WZpE",
    thumbnail: "https://img.youtube.com/vi/Mt4wzK0WZpE/mqdefault.jpg",
    channelTitle: "Sleepy Panda",
  },
  {
    title: "Peaceful Guitar Playlist 🎸",
    url: "https://www.youtube.com/watch?v=2OEL4P1Rz04",
    thumbnail: "https://img.youtube.com/vi/2OEL4P1Rz04/mqdefault.jpg",
    channelTitle: "Relax Daily",
  },
  {
    title: "Romantic Chill Vibes ❤️",
    url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    thumbnail: "https://img.youtube.com/vi/3JZ_D3ELwOQ/mqdefault.jpg",
    channelTitle: "MixHub",
  },
];

export const getYouTubeSongs = async (mood) => {
  try {
    const query = encodeURIComponent(`${mood} relaxing songs playlist`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${query}&maxResults=8&key=${process.env.YOUTUBE_API_KEY}`;

    const { data } = await axios.get(url);
    const songs = data.items.map((video) => ({
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      thumbnail: video.snippet.thumbnails.medium.url,
      channelTitle: video.snippet.channelTitle,
    }));

    if (!songs || songs.length === 0) {
      console.warn("⚠️ No songs from YouTube, using fallback list.");
      return FALLBACK_SONGS.slice(0, 5);
    }

    return songs.slice(0, 8); // Limit display songs
  } catch (error) {
    console.error("❌ YouTube API failed, using fallback songs:", error.message);
    return FALLBACK_SONGS.slice(0, 5); // ✅ graceful fallback even on API crash
  }
};
