// backend/routes/chatbotRoutes.js
import express from "express";
import { processChatbotQuery } from "../controllers/chatbotController.js"; // ensure this exists
const router = express.Router();

// Helpful GET to indicate the endpoint exists and is POST-only for queries
router.get("/", (req, res) => {
  res.status(200).json({ message: "Chatbot endpoint — POST to /api/music/chatbot with { prompt }" });
});

// Main chatbot POST
router.post("/", processChatbotQuery);

export default router;
