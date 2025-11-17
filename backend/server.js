// ----------------------
// Load Environment Variables
// ----------------------
import dotenv from "dotenv";
dotenv.config();

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
import chatbotRoutes from "./routes/chatbotRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";

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
app.use("/api/music/chatbot", chatbotRoutes);   // <-- FIX
app.use("/api/music", musicRoutes);             // <-- FIX order
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/playlists", playlistRoutes);

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
