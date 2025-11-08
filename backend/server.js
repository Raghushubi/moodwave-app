// Import thee libraries we installed
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";

// Load environment variables from .env file
dotenv.config();
connectDB();

// Create an express app
const app = express();

// Allow JSON requests and cross-origin access
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/moods", moodRoutes);

// Create first route
app.get("/", (req,res) => {
    res.send("MoodWave backend is running!");
});

// Tell the server which port to listen on
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});