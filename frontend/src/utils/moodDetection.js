// frontend/src/utils/moodDetection.js
import * as faceapi from "face-api.js";

/**
 * Detects mood using webcam feed.
 * Returns a cleanup function to stop detection.
 */
export async function detectMood(videoRef, setResult, options = {}) {
  const { intervalMs = 1500 } = options;

  console.log("🧠 Loading face-api models...");
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
    console.log("✅ Models loaded successfully");
  } catch (err) {
    console.error("❌ Model loading error:", err);
    return;
  }

  const video = videoRef.current;
  if (!video) {
    console.warn("⚠ No video reference found!");
    return;
  }

  let running = true;
  const labelToMood = {
    happy: "Happy",
    sad: "Sad",
    angry: "Angry",
    neutral: "Calm",
    surprised: "Energetic",
    disgusted: "Angry",
    fearful: "Anxious",
  };

  async function loop() {
    if (!running) return;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const topLabel = Object.keys(expressions).reduce((a, b) =>
          expressions[a] > expressions[b] ? a : b
        );
        const confidence = expressions[topLabel];
        const mappedMood = labelToMood[topLabel] || "Calm";

        console.log(`🎯 Detected: ${mappedMood} (${(confidence * 100).toFixed(1)}%)`);
        setResult({ emotion: mappedMood, confidence });
      } else {
        console.log("🕵️‍♂️ No face detected yet...");
      }
    } catch (err) {
      console.error("Detection error:", err);
    }

    setTimeout(loop, intervalMs);
  }

  loop();

  // Stop detection cleanly when requested
  return () => {
    running = false;
    console.log("🛑 Mood detection stopped.");
  };
}
