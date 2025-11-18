import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("backend/.env") });

import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Mood from "./models/Mood.js";
import MoodLog from "./models/MoodLog.js";

// Random date within last 30 days
function randomDate() {
  const now = Date.now();
  const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

async function seedMoodLogs() {
  await connectDB();
  console.log("🌱 Seeding dummy mood logs...");

  const users = await User.find({});
  const moods = await Mood.find({}); // <-- Needed for ObjectIds

  if (users.length === 0) {
    console.log("❌ No users found. Run seedUsers.js first.");
    mongoose.connection.close();
    return;
  }
  if (moods.length === 0) {
    console.log("❌ No moods found. Run your original seedMoods.js first.");
    mongoose.connection.close();
    return;
  }

  const TOTAL_LOGS = 1000;
  const logs = [];

  console.log(`Generating ${TOTAL_LOGS} logs for ${users.length} users...`);

  for (let i = 0; i < TOTAL_LOGS; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const mood = moods[Math.floor(Math.random() * moods.length)];

    logs.push({
      user: user._id,     // FIXED
      mood: mood._id,     // FIXED
      createdAt: randomDate()
    });
  }

  await MoodLog.insertMany(logs);
  console.log("✅ Dummy mood logs successfully added!");

  mongoose.connection.close();
}

seedMoodLogs();
