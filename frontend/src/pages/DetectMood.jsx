// frontend/src/pages/DetectMood.jsx
import React, { useEffect, useRef, useState } from "react";
import { detectMood } from "../utils/moodDetection";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DetectMood() {
  const videoRef = useRef();
  const [result, setResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
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
          setIsDetecting(true);
        });
      })
      .catch((err) => console.error("Webcam access error:", err));

    // 👇 Cleanup when leaving page
    return () => {
      if (stopMoodDetection) {
        stopMoodDetection();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsDetecting(false);
    };
  }, []);

  const handleConfirm = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("Please log in first!");
        return;
      }

      // Fetch moods from backend
      const { data: moods } = await axios.get("http://localhost:5000/api/moods");
      const matchedMood = moods.find((m) =>
        m.name.toLowerCase().includes(result.emotion.toLowerCase())
      );

      if (!matchedMood) {
        alert("Mood not recognized in database!");
        return;
      }

      // Log the detected mood
      await axios.post("http://localhost:5000/api/moods/log", {
        userId,
        moodId: matchedMood._id,
        method: "Webcam",
        confidence: result.confidence,
      });

      alert(`Mood "${matchedMood.name}" logged successfully!`);
      navigate(`/dashboard?moodId=${matchedMood._id}`);
    } catch (err) {
      console.error("Error logging mood:", err);
      alert("Error logging mood!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
          Webcam Mood Detection
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full rounded-lg shadow-md border-2 border-gray-200"
          />

          {result && (
            <div className="mt-6 text-center bg-blue-50 p-4 rounded-xl">
              <p className="text-2xl font-semibold text-blue-700 mb-2">
                Detected Mood: <span className="text-blue-900">{result.emotion}</span>
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </p>

              <button
                onClick={handleConfirm}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg transform hover:scale-105"
              >
                Confirm Mood
              </button>
            </div>
          )}

          {!result && isDetecting && (
            <p className="text-center mt-4 text-gray-600">
              Detecting your mood...
            </p>
          )}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
