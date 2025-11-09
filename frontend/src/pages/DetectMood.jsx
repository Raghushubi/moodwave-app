import React, { useEffect, useRef, useState } from "react";
import { detectMood } from "../utils/moodDetection";
import axios from "axios";

export default function DetectMood() {
  const videoRef = useRef();
  const [result, setResult] = useState(null);

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
    const userId = "690d1759a2ffc4c1f4caefef"; // test user from backend
    const moodId = "690f0091e04b38a3ffe7d4b6"; // example (Happy)

    await axios.post("http://localhost:5000/api/moods/log", {
      userId,
      moodId,
      method: "Webcam",
      confidence: result.confidence
    });

    alert("Mood logged successfully!");
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">Webcam Mood Detection</h1>
      <video ref={videoRef} autoPlay muted width="400" height="300" className="rounded-lg shadow-md" />
      {result && (
        <div className="mt-4 text-center">
          <p className="text-lg">Mood: <b>{result.emotion}</b></p>
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
