// Import required libraries
import express from "express";
import cors from "cors";
import dotenv from "dotenv";


// Import MongoDB connection function (from Raghu’s config)
import { connectDB } from "./config/db.js";

// Import routes
import matchRoutes from "./routes/matchRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Initialize environment variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Allow requests from frontend

// Base routes
app.use("/api/auth", authRoutes);   // Authentication routes 
app.use("/api/moods", moodRoutes);  // Mood & MoodLog routes 
app.use("/api/music", musicRoutes); // Music Recommendation routes
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/match", matchRoutes);

// Default route (root)
app.get("/", (req, res) => {
  res.send("MoodWave backend is running!");
});

// Set port from environment or fallback to 5000
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

console.log("Music routes mounted successfully");
app.use("/api/music", musicRoutes);

