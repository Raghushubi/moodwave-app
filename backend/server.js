// Import libraries
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
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

// Connect to database
connectDB();

// Routes
import moodRoutes from "./routes/moodRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

app.use("/api/moods", moodRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/analytics", analyticsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Server is running successfully ✅");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
