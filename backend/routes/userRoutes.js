import express from "express";
import User from "../models/User.js";

const router = express.Router();

// List all users (IDs + name + email)
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "_id name email").limit(500);
    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch single user by ID
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name email _id");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
