// backend/controllers/chatbotController.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const processChatbotQuery = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Missing prompt" });
    }

    console.log("🤖 User prompt:", prompt);

    // -------------------------------------------
    // 1) Ask Gemini for the EXACT artist + song list
    // -------------------------------------------
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const aiPrompt = `
You are a music expert.
User requested: "${prompt}"

Return ONLY a clean JSON object:

{
  "mood": "romantic | sad | calm | energetic | happy | chill | lofi",
  "artists": ["artist1", "artist2"],
  "songs": ["Song Title 1", "Song Title 2", "Song Title 3"]
}

Rules:
- Pick only HIGH QUALITY songs.
- NO shorts. NO mashups. NO reels.
- Songs must be genuine from movies/albums/artists.
- Include a mix of Indian + English only if relevant.
`;

    const response = await model.generateContent(aiPrompt);
    let txt = response.response.text().replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(txt);
    } catch (err) {
      console.error("Gemini JSON error:", txt);
      return res.status(500).json({ message: "Invalid AI output" });
    }

    const { mood, artists, songs } = parsed;

    if (!songs || songs.length === 0) {
      return res.status(400).json({
        message: "AI returned no songs",
      });
    }

    // -------------------------------------------
    // 2) For EACH Gemini song, fetch real YouTube video
    // -------------------------------------------
    const finalSongs = [];
    for (const title of songs) {
      const result = await getSongByTitle(title);
      if (result) finalSongs.push(result);
    }

    return res.json({
      success: true,
      mood,
      artists,
      songs: finalSongs,
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(500).json({
      message: "Chatbot processing failed",
      error: error.message,
    });
  }
};
