// backend/testYouTube.js
import dotenv from "dotenv";
dotenv.config();

import { getYouTubeSongs } from "./services/youtubeService.js";

async function run() {
  try {
    console.log("🔎 Testing YouTube service with query: Romantic");
    const songs = await getYouTubeSongs("Romantic");
    console.log("✅ Returned songs count:", (songs && songs.length) || 0);
    console.log("✅ First 5 results (trimmed):", JSON.stringify((songs || []).slice(0,5), null, 2));
  } catch (err) {
    console.error("❌ Test error:", err);
  }
}

run();
