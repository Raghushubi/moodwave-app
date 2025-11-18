// backend/controllers/feedController.js
// Controllers for feed, comments, replies, AI summary and notifications.
// Fixes common Mongoose populate-on-subdoc issues by always populating from parent document.

import mongoose from "mongoose";
import Feed from "../models/Feed.js";
import Connection from "../models/Connection.js";
import Notification from "../models/Notification.js";

/**
 * GET /api/social/feed/:userId
 * Return feed items from user's friends + the user themself.
 * - Uses Connection documents where status === "connected".
 * - Populates owner (name,email) and comment/reply users (name).
 */
export const getFeed = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Find connections where either side is the user and status connected
    const conns = await Connection.find({
      $or: [{ user: userId }, { friend: userId }],
      status: "connected",
    }).lean();

    const friendSet = new Set();
    conns.forEach((c) => {
      // c.user and c.friend may be ObjectId or populated object (lean used so they are ids)
      const u = c.user?.toString();
      const f = c.friend?.toString();
      if (u && u !== userId) friendSet.add(u);
      if (f && f !== userId) friendSet.add(f);
    });

    // include the user's own id so they see their items too
    friendSet.add(userId);

    const ids = Array.from(friendSet);

    // Query feed items owned by friends or self, newest first
    const items = await Feed.find({ owner: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("owner", "name email")
      .lean();

    // Populate comment & reply users names using Feed documents (can't populate on subdocs after lean)
    // We need fully hydrated docs to populate sub-doc user refs, so fetch again without lean for populate:
    const itemIds = items.map((it) => it._id);
    const hydrated = await Feed.find({ _id: { $in: itemIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("owner", "name email")
      .populate("comments.user", "name")
      .populate("comments.replies.user", "name")
      .lean();

    res.json(hydrated);
  } catch (err) {
    console.error("getFeed error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/social/feed/create
 * body: { owner, type, payload }
 * (Used for manual feed creation if needed.)
 */
export const createFeedItem = async (req, res) => {
  try {
    const { owner, type, payload } = req.body;
    if (!owner || !type) return res.status(400).json({ error: "owner and type required" });

    const feed = await Feed.create({ owner, type, payload });
    await feed.populate("owner", "name email");
    res.json(feed);
  } catch (err) {
    console.error("createFeedItem error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/social/feed/comment
 * body: { feedId, userId, text }
 *
 * IMPORTANT:
 * - Pushes a comment subdoc, saves parent Feed, then populates via parent:
 *   await feed.populate("comments.user", "name")
 * - Returns the populated last comment to the client.
 */
export const postComment = async (req, res) => {
  try {
    const { feedId, userId, text } = req.body;
    if (!feedId || !userId || !text) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const feed = await Feed.findById(feedId);
    if (!feed) return res.status(404).json({ error: "Feed not found" });

    // Add comment
    feed.comments.push({ user: userId, text });
    await feed.save();

    // Populate comment users on parent document (safe/populate-on-parent)
    await feed.populate("comments.user", "name");

    const lastComment = feed.comments[feed.comments.length - 1];
    // Notify feed owner if different
    try {
      if (feed.owner?.toString() !== userId) {
        await Notification.create({
          user: feed.owner,
          fromUser: userId,
          type: "comment",
          data: { feedId, text },
        });
      }
    } catch (nerr) {
      console.error("notification error (postComment):", nerr);
      // don't fail the request because of notification issues
    }

    res.json({ success: true, comment: lastComment });
  } catch (err) {
    console.error("postComment error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/social/feed/reply
 * body: { feedId, commentId, userId, text }
 *
 * Adds a reply subdoc under the specific comment, saves, populates and returns reply.
 */
export const postReply = async (req, res) => {
  try {
    const { feedId, commentId, userId, text } = req.body;
    if (!feedId || !commentId || !userId || !text) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const feed = await Feed.findById(feedId);
    if (!feed) return res.status(404).json({ error: "Feed not found" });

    const comment = feed.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    comment.replies.push({ user: userId, text });
    await feed.save();

    // Populate comment.user and comment.replies.user on parent
    await feed.populate([
      { path: "comments.user", select: "name" },
      { path: "comments.replies.user", select: "name" },
    ]);

    const lastReply = comment.replies[comment.replies.length - 1];

    // Notify comment owner if different
    try {
      if (comment.user?.toString() !== userId) {
        await Notification.create({
          user: comment.user,
          fromUser: userId,
          type: "reply",
          data: { feedId, commentId, text },
        });
      }
    } catch (nerr) {
      console.error("notification error (postReply):", nerr);
    }

    res.json({ success: true, reply: lastReply });
  } catch (err) {
    console.error("postReply error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/social/feed/summary/:userId
 * Simple heuristic AI summary (no external API).
 * IMPORTANT: Exclude the user's own mood posts when computing friends' moods summary.
 */
export const aiSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Find connected friends
    const conns = await Connection.find({
      $or: [{ user: userId }, { friend: userId }],
      status: "connected",
    }).lean();

    const friendSet = new Set();
    conns.forEach((c) => {
      const u = c.user?.toString();
      const f = c.friend?.toString();
      if (u && u !== userId) friendSet.add(u);
      if (f && f !== userId) friendSet.add(f);
    });

    const friendIds = Array.from(friendSet);
    if (friendIds.length === 0) {
      return res.json({ summary: "No recent activity from your friends yet." });
    }

    // Only consider feed items of type "mood" by friends (EXCLUDE owner === userId)
    const moods = await Feed.find({
      owner: { $in: friendIds },
      type: "mood",
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const counter = {};
    moods.forEach((m) => {
      const mm = (m.payload?.mood || "unknown").toString().toLowerCase();
      counter[mm] = (counter[mm] || 0) + 1;
    });

    const entries = Object.entries(counter).sort((a, b) => b[1] - a[1]);
    let summary = "No recent activity from your friends yet.";
    if (entries.length > 0) {
      const top = entries.slice(0, 3).map((e) => `${e[0]} (${e[1]})`).join(", ");
      summary = `Your friends have been mostly: ${top}. Consider sharing a playlist that matches their mood!`;
    }

    res.json({ summary });
  } catch (err) {
    console.error("aiSummary error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/social/notifications/:userId
 */
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const notifs = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(notifs);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/social/notifications/markread
 * body: { notificationId }
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) return res.status(400).json({ error: "notificationId required" });
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
