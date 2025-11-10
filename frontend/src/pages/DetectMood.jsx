import React, { useEffect, useRef, useState } from "react";
import { detectMood } from "../utils/moodDetection";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DetectMood() {
  const videoRef = useRef();
  const [result, setResult] = useState(null);
  const navigate = useNavigate(); // 👈 for redirecting to Dashboard

  useEffect(() => {
    // Access webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Webcam access error:", err));

    // Start mood detection
    detectMood(videoRef, setResult);
  }, []);

  const handleConfirm = async () => {
    try {
      const userId = localStorage.getItem("userId"); // ✅ use real logged-in user
      if (!userId) {
        alert("⚠ Please log in first!");
        return;
      }

      // Fetch moods from backend
      const { data: moods } = await axios.get("http://localhost:5000/api/moods");
      const matchedMood = moods.find((m) =>
        m.name.toLowerCase().includes(result.emotion.toLowerCase())
      );

      if (!matchedMood) {
        alert("❌ Mood not recognized in database!");
        return;
      }

      // Log the detected mood
      await axios.post("http://localhost:5000/api/moods/log", {
        userId,
        moodId: matchedMood._id,
        method: "Webcam",
        confidence: result.confidence,
      });

      alert(`✅ Mood "${matchedMood.name}" logged successfully!`);

      // ✅ Redirect to Dashboard, sending moodId
      navigate(`/dashboard?moodId=${matchedMood._id}`);
    } catch (err) {
      console.error("Error logging mood:", err);
      alert("❌ Error logging mood!");
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">Webcam Mood Detection</h1>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="400"
        height="300"
        className="rounded-lg shadow-md"
      />
      {result && (
        <div className="mt-4 text-center">
          <p className="text-lg">
            Mood: <b>{result.emotion}</b>
          </p>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <button
            onClick={handleConfirm}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Confirm Mood
          </button>
        </div>
      )}
    </div>
  );
}
