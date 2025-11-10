// frontend/src/pages/DetectMood.jsx
import React, { useEffect, useRef, useState } from "react";
import { detectMood } from "../utils/moodDetection";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DetectMood() {
  const videoRef = useRef();
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let stopMoodDetection = null;
    let stream = null;

    // Start webcam
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => {
        stream = mediaStream;
        videoRef.current.srcObject = mediaStream;

        // Start detection loop
        detectMood(videoRef, setResult).then((stop) => {
          stopMoodDetection = stop;
        });
      })
      .catch((err) => console.error("Webcam access error:", err));

    // 👇 Cleanup when leaving page
    return () => {
      if (stopMoodDetection) stopMoodDetection();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleConfirm = async () => {
    try {
      const userId = localStorage.getItem("userId");
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
      navigate(`/dashboard?moodId=${matchedMood._id}`);
    } catch (err) {
      console.error("Error logging mood:", err);
      alert("❌ Error logging mood!");
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">🎥 Webcam Mood Detection</h1>

      <video
        ref={videoRef}
        autoPlay
        muted
        width="400"
        height="300"
        className="rounded-lg shadow-md border border-gray-300"
      />

      {result && (
        <div className="mt-4 text-center">
          <p className="text-lg">
            Mood: <b>{result.emotion}</b>
          </p>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>

          <button
            onClick={handleConfirm}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Confirm Mood
          </button>
        </div>
      )}
    </div>
  );
}
