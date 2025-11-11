// backend/seedMoods.js
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import Mood from "./models/Mood.js";

dotenv.config();
await connectDB();

const moods = [
  { name: "Happy", description: "Joyful, upbeat", colorCode: "#FFD93D", icon: "😊" },
  { name: "Sad", description: "Feeling down", colorCode: "#6C63FF", icon: "😢" },
  { name: "Calm", description: "Relaxed and peaceful", colorCode: "#00C49A", icon: "😌" },
  { name: "Energetic", description: "Pumped and active", colorCode: "#FF6B6B", icon: "⚡" },
  { name: "Romantic", description: "Affectionate and warm", colorCode: "#FF85A1", icon: "❤️" },
  { name: "Angry", description: "Irritated or upset", colorCode: "#D9534F", icon: "😠" },
  { name: "Anxious", description: "Worried or nervous", colorCode: "#17A2B8", icon: "😰" },
  { name: "Peaceful", description: "Calm and balanced", colorCode: "#A0E7E5", icon: "🕊️" }
];

try {
  await Mood.deleteMany();
  await Mood.insertMany(moods);
  console.log("✅ Mood data imported successfully");
  process.exit(0);
} catch (err) {
  console.error("❌ Mood seed error:", err);
  process.exit(1);
}
