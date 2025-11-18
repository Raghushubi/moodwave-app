// backend/controllers/socialActions.js
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { getSuggestions as getSuggestionsCore } from "./socialController.js"; // if default export adjust accordingly

// If socialController exported getSuggestions as named export above, this import works.
// If you kept socialController as a standalone file that exports getSuggestions, use this.

export const connectUsers = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(fromUserId) || !mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ error: "Invalid user ids" });
    }
    if (fromUserId === toUserId) return res.status(400).json({ error: "Cannot connect to yourself" });

    // create connection both ways (or single directional based on app design). We'll create single record representing accepted connection.
    try {
      const conn = await Connection.create({
        user: fromUserId,
        friend: toUserId,
        status: "connected",
      });
      return res.json({ success: true, connection: conn });
    } catch (err) {
      // if unique index conflict, we can return existing
      if (err.code === 11000) {
        return res.json({ success: true, message: "Already connected" });
      }
      throw err;
    }
  } catch (err) {
    console.error("Error in connectUsers:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // find connections where user == userId OR friend == userId
    const conns = await Connection.find({
      $or: [{ user: userId }, { friend: userId }],
      status: "connected",
    })
      .populate("user", "name email")
      .populate("friend", "name email")
      .lean();

    // convert to unique friend list
    const friends = conns.map((c) => {
      if (c.user._id.toString() === userId) return c.friend;
      return c.user;
    });

    res.json(friends);
  } catch (err) {
    console.error("Error in getFriends:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// (Optional) If you want to expose suggestions from here as well:
export const getSuggestions = async (req, res) => {
  // delegate to socialController.getSuggestions
  return getSuggestionsCore(req, res);
};
