// backend/controllers/socialRequestsController.js
import Connection from "../models/Connection.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * POST /api/social/request
 * body: { fromUserId, toUserId }
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) return res.status(400).json({ error: "Missing ids" });
    if (!mongoose.Types.ObjectId.isValid(fromUserId) || !mongoose.Types.ObjectId.isValid(toUserId))
      return res.status(400).json({ error: "Invalid ids" });
    if (fromUserId === toUserId) return res.status(400).json({ error: "Cannot send request to self" });

    // try to create; unique index will prevent duplicates
    try {
      const doc = await Connection.create({ user: fromUserId, friend: toUserId, status: "pending" });
      // notification to receiver
      await Notification.create({ user: toUserId, fromUser: fromUserId, type: "friend_request", data: { connectionId: doc._id } });
      return res.json({ success: true, request: doc });
    } catch (err) {
      // if duplicate exists, return existing
      if (err.code === 11000) {
        const existing = await Connection.findOne({ user: fromUserId, friend: toUserId });
        return res.json({ success: true, request: existing, message: "Request exists" });
      }
      throw err;
    }
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/social/accept
 * body: { requestId, userId } // userId must be the recipient (friend)
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId, userId } = req.body;
    if (!requestId || !userId) return res.status(400).json({ error: "Missing fields" });
    const conn = await Connection.findById(requestId);
    if (!conn) return res.status(404).json({ error: "Request not found" });
    // check that the user is the receiver (friend)
    if (conn.friend.toString() !== userId) return res.status(403).json({ error: "Not authorized" });

    conn.status = "connected";
    await conn.save();

    // Create reciprocal connection if you want two rows (optional).
    // If you prefer single-row symmetric model, skip this. We'll keep single-row = OK.
    // Notify requester
    await Notification.create({ user: conn.user, fromUser: userId, type: "friend_accept", data: { connectionId: conn._id } });

    res.json({ success: true, connection: conn });
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/social/reject
 * body: { requestId, userId }
 */
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId, userId } = req.body;
    if (!requestId || !userId) return res.status(400).json({ error: "Missing fields" });
    const conn = await Connection.findById(requestId);
    if (!conn) return res.status(404).json({ error: "Request not found" });
    if (conn.friend.toString() !== userId) return res.status(403).json({ error: "Not authorized" });

    conn.status = "rejected";
    await conn.save();
    res.json({ success: true });
  } catch (err) {
    console.error("rejectFriendRequest error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/social/remove
 * body: { userId, friendId }
 * removes an accepted connection regardless of direction
 */
export const removeFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) return res.status(400).json({ error: "Missing fields" });

    await Connection.deleteOne({
      $or: [
        { user: userId, friend: friendId, status: "connected" },
        { user: friendId, friend: userId, status: "connected" }
      ]
    });

    res.json({ success: true });
  } catch (err) {
    console.error("removeFriend error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/social/requests/:userId
 * returns incoming (where friend==userId & pending) and outgoing (where user==userId & pending)
 */
export const getRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const incoming = await Connection.find({ friend: userId, status: "pending" }).populate("user", "name email").lean();
    const outgoing = await Connection.find({ user: userId, status: "pending" }).populate("friend", "name email").lean();
    res.json({ incoming, outgoing });
  } catch (err) {
    console.error("getRequests error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/social/friends/:userId
 * returns accepted friends as a simple list of users (other side)
 */
export const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    // find connections where userId is either side and status connected
    const conns = await Connection.find({
      $or: [{ user: userId }, { friend: userId }],
      status: "connected"
    }).lean();

    const otherIds = new Set();
    conns.forEach(c => {
      if (c.user.toString() === userId) otherIds.add(c.friend.toString());
      else otherIds.add(c.user.toString());
    });

    const users = await User.find({ _id: { $in: Array.from(otherIds) } }).select("_id name email").lean();
    res.json(users);
  } catch (err) {
    console.error("getFriends error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
