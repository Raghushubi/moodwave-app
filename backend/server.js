// ----------------------
// Load Environment Variables
// ----------------------
// FORCE dotenv to use correct path and override dotenvx
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env")
});

// ----------------------
// Import Libraries
// ----------------------
import express from "express";
import cors from "cors";

// ----------------------
// Import DB Connection
// ----------------------
import { connectDB } from "./config/db.js";

// ----------------------
// Import Routes
// ----------------------
import authRoutes from "./routes/authRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import socialRoutes from "./routes/socialRoutes.js";
import likedSongsRoutes from "./routes/likedSongsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// ----------------------
// Initialize App
// ----------------------
const app = express();

// ----------------------
// Middleware
// ----------------------
app.use(express.json());
app.use(cors());

// ----------------------
// Connect Database
// ----------------------
connectDB();

// ----------------------
// Register Routes
// IMPORTANT: chatbot FIRST, then /api/music
// ----------------------
app.use("/api/auth", authRoutes);
app.use("/api/moods", moodRoutes);   
app.use("/api/music", musicRoutes);             
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/liked", likedSongsRoutes);
app.use("/api/admin", adminRoutes);

// ----------------------
// Root Route
// ----------------------
app.get("/", (req, res) => {
  res.send("MoodWave backend is running!");
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("✅ Express 5 server started successfully");
});
