import jwt from "jsonwebtoken";
import User from "../models/User.js";
import MoodLog from "../models/MoodLog.js";

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { email: process.env.ADMIN_EMAIL, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      role: "admin",
      email: process.env.ADMIN_EMAIL,
    });
  }

  return res.status(401).json({ message: "Invalid admin credentials" });
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name email createdAt").lean();

    const mapped = await Promise.all(
      users.map(async (u) => {
        const count = await MoodLog.countDocuments({ userId: u._id });
        return { ...u, moodLogCount: count };
      })
    );

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const listMoodLogs = async (req, res) => {
  try {
    const logs = await MoodLog.find({}, "userId mood confidence createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json(logs);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    await MoodLog.deleteMany({ userId: id });

    res.json({ message: "User + mood logs deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
