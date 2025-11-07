import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// Route for registration
router.post("/register", registerUser);

// Route for login
router.post("/login", loginUser);

export default router;
