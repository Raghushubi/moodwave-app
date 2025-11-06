// Import thee libraries we installed
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Create an express app
const app = express();

// Allow JSON requests and cross-origin access
app.use(express.json());
app.use(cors());

// Create first route
app.get("/", (req,res) => {
    res.send("MoodWave backend is running!");
});

// Tell the server which port to listen on
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});