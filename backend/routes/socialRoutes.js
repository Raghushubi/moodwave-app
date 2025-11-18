// backend/routes/socialRoutes.js
import express from "express";

// suggestions controller (you already have it)
import { getSuggestions } from "../controllers/socialController.js";

// feed & notification controller
import {
  getFeed,
  createFeedItem,
  postComment,
  postReply,
  aiSummary,
  getNotifications,
  markNotificationRead
} from "../controllers/feedController.js";

// friend requests controller
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getRequests,
  getFriends
} from "../controllers/socialRequestsController.js";

const router = express.Router();

// Feed
router.get("/feed/:userId", getFeed);
router.post("/feed/create", createFeedItem);
router.post("/feed/comment", postComment);
router.post("/feed/reply", postReply);
router.get("/feed/summary/:userId", aiSummary);

// Notifications
router.get("/notifications/:userId", getNotifications);
router.post("/notifications/markread", markNotificationRead);

// Friend requests & friends
router.post("/request", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.post("/reject", rejectFriendRequest);
router.post("/remove", removeFriend);
router.get("/requests/:userId", getRequests);
router.get("/friends/:userId", getFriends);

// Suggestions (existing)
router.get("/suggestions/:userId", getSuggestions);

export default router;
