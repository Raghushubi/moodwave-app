// backend/routes/socialRoutes.js
import express from "express";
import { getSuggestions, connectUsers, getFriends } from "../controllers/socialActions.js";

const router = express.Router();

router.get("/suggestions/:userId", getSuggestions);
router.post("/connect", connectUsers); // body: { fromUserId, toUserId }
router.get("/friends/:userId", getFriends);

export default router;
