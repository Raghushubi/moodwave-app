import dotenv from "dotenv";
import path from "path";

// Load correct .env path
dotenv.config({ path: path.resolve("backend/.env") });

import mongoose from "mongoose";
import User from "./models/User.js";
import { connectDB } from "./config/db.js";

// A valid bcrypt hash for "dummy123"
const dummyHash =
  "$2a$10$BrjVojtq0VqD6rQSCxNpoOw9DY4Msl7YwFe2wnBOlX1tF3gBojjtm";

const names = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
  "Zeta", "Theta", "Omega", "Phoenix", "Orion",
  "Nova", "Luna", "Cypher", "Quantum", "Echo",
  "Blaze", "Shadow", "Comet", "Solaris", "Nebula"
];

function randomEmail(name) {
  return `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`;
}

async function seed() {
  await connectDB();
  console.log("🌱 Seeding 100 dummy users...");

  const users = [];

  for (let i = 0; i < 100; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    users.push({
      name,
      email: randomEmail(name),
      passwordHash: dummyHash   // FIXED
    });
  }

  await User.insertMany(users);
  console.log("✅ 100 Users added");

  mongoose.connection.close();
}

seed();
