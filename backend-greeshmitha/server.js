// Import the libraries
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables from .env file
dotenv.config();

// Create an express app
const app = express();

// Allow JSON requests and cross-origin access
app.use(express.json());
app.use(cors());

// --- MongoDB Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// --- Test Route ---
app.get("/", (req, res) => {
  res.send("MoodWave backend is running! 🚀");
});

// --- Verify API Key Route (temporary test) ---
app.get("/api/test-env", (req, res) => {
  res.json({
    message: "Environment variables loaded successfully ✅",
    API_KEY: process.env.API_KEY ? "✅ Present" : "❌ Missing",
    JWT_SECRET: process.env.JWT_SECRET ? "✅ Present" : "❌ Missing",
    MONGO_URI: process.env.MONGO_URI ? "✅ Present" : "❌ Missing",
  });
});

app.get("/moods", (req, res) => {
  res.json({
    message: "Backend is connected and moods route works fine!",
  });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
