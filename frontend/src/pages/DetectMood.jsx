import React, { useEffect, useRef, useState } from "react";
import { detectMood, stopWebcam } from "../utils/moodDetection";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function DetectMood() {
  const videoRef = useRef();
  const [result, setResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  const stopDetectionRef = useRef(null);
  const streamRef = useRef(null); // 🆕 Store stream reference
  const navigate = useNavigate();

  // 🆕 Centralized cleanup function
  const cleanup = () => {
    console.log("🧹 Starting cleanup...");

    // Stop detection loop
    if (stopDetectionRef.current) {
      stopDetectionRef.current();
      stopDetectionRef.current = null;
    }

    // Stop webcam stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind, track.label);
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setWebcamActive(false);
    setIsDetecting(false);
    console.log("✅ Cleanup complete");
  };

  // Initialize webcam and detection
  useEffect(() => {
    let mounted = true;

    const initializeWebcam = async () => {
      try {
        console.log("🎥 Requesting webcam access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        if (!mounted) {
          // Component unmounted during setup - stop immediately
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // 🆕 Store stream reference for cleanup
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setWebcamActive(true);
          setLoading(false);

          // Wait for video to be ready before starting detection
          videoRef.current.onloadedmetadata = () => {
            if (mounted) {
              startDetection();
            }
          };
        }
      } catch (err) {
        console.error("❌ Webcam access error:", err);
        setError("Could not access webcam. Please check permissions.");
        setLoading(false);
      }
    };

    const startDetection = async () => {
      try {
        const stopFn = await detectMood(videoRef, setResult, {
          intervalMs: 2000,
          confidenceThreshold: 0.6,
          onError: (msg) => setError(msg),
          onNoFace: () => {
            setError("No face detected. Please position yourself in front of the camera.");
          },
        });

        stopDetectionRef.current = stopFn;
        setIsDetecting(true);
      } catch (err) {
        console.error("❌ Detection start error:", err);
        setError("Failed to start mood detection.");
      }
    };

    initializeWebcam();

    // 🆕 Cleanup on unmount
    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  const handleConfirm = async () => {
    if (!result) return;

    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");

      // Always proceed to dashboard with detected mood, regardless of login status
      // Dashboard will handle the logic for logged-in vs non-logged-in users

      // Fetch all moods from backend
      const { data: moods } = await API.get("/moods");

      // Find matching mood (case-insensitive)
      const matchedMood = moods.find((m) =>
        m.name.toLowerCase() === result.emotion.toLowerCase()
      );

      if (!matchedMood) {
        alert(`Mood "${result.emotion}" not found in database!`);
        setLoading(false);
        return;
      }

      // Log the detected mood only if user is logged in
      if (userId) {
        await API.post("/moods/log", {
          userId,
          moodId: matchedMood._id,
          method: "Webcam",
          confidence: result.confidence,
        });
        alert(`✅ Mood "${matchedMood.name}" logged successfully!`);
      } else {
        alert(`✅ Mood "${matchedMood.name}" detected! Showing songs only (log in to save playlists).`);
      }

      // 🆕 Cleanup BEFORE navigation
      cleanup();

      // Navigate to dashboard with mood data
      navigate("/dashboard", {
        state: {
          detectedMood: matchedMood,
          shouldFetchMusic: true,
        },
      });
    } catch (err) {
      console.error("❌ Error logging mood:", err);
      alert("Error logging mood. Please try again.");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 🆕 Cleanup BEFORE navigation
    cleanup();
    navigate("/dashboard");
  };

  // 🆕 Handle browser back button / tab close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      cleanup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-700 mb-2 text-center">
          🎥 Webcam Mood Detection
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Look at the camera and let AI detect your mood
        </p>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Webcam Status */}
        <div className="mb-4 text-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              webcamActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                webcamActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {webcamActive ? "Webcam Active" : "Webcam Inactive"}
          </span>
        </div>

        {/* Video Container */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-2xl mx-auto rounded-lg shadow-md border-2 border-gray-200"
              style={{ maxHeight: "480px", objectFit: "cover" }}
            />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Initializing webcam...</p>
                </div>
              </div>
            )}
          </div>

          {/* Detection Result */}
          {result && !loading && (
            <div className="mt-6 text-center bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200">
              <div className="text-5xl mb-3">
                {result.emotion === "Happy" && "😊"}
                {result.emotion === "Sad" && "😢"}
                {result.emotion === "Angry" && "😠"}
                {result.emotion === "Calm" && "😌"}
                {result.emotion === "Energetic" && "😃"}
                {result.emotion === "Anxious" && "😰"}
              </div>
              <p className="text-3xl font-bold text-purple-700 mb-2">
                {result.emotion}
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Confirm & Get Music
              </button>
            </div>
          )}

          {/* Detecting Status */}
          {!result && isDetecting && !loading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-pulse">
                <p className="text-xl text-gray-600 mb-2">
                  🔍 Detecting your mood...
                </p>
                <p className="text-sm text-gray-500">
                  Make sure your face is clearly visible
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 Tips for better detection:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure good lighting on your face</li>
            <li>• Look directly at the camera</li>
            <li>• Keep a neutral expression initially</li>
            <li>• Wait 2-3 seconds for detection to complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}