import mongoose from "mongoose";

const moodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // "Happy"
    description: { type: String, default: "" },           // optional
    colorCode: { type: String, default: "#ffffff" },      // hex for UI
    icon: { type: String, default: "🙂" }                 // short emoji or icon key
  },
  { timestamps: true }
);

const Mood = mongoose.model("Mood", moodSchema);
export default Mood;
