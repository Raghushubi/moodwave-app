import axios from "axios";

// Helper to get YouTube videos for a given mood
export const getYouTubeSongs = async (mood) => {
  try {
    const query = encodeURIComponent(`${mood} songs`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${query}&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`;

    const { data } = await axios.get(url);

    // Extract only useful details
    const songs = data.items.map((video) => ({
      title: video.snippet.title,
      videoId: video.id.videoId,
      thumbnail: video.snippet.thumbnails.default.url,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    }));

    return songs;
  } catch (error) {
    console.error("YouTube API error:", error.message);
    return [];
  }
};