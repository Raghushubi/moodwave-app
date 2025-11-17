import * as faceapi from "face-api.js";

let modelsLoaded = false;
let loadingPromise = null;

/**
 * Load face-api models (singleton pattern)
 */
async function ensureModelsLoaded() {
  if (modelsLoaded) return true;
  
  if (loadingPromise) {
    await loadingPromise;
    return true;
  }

  loadingPromise = (async () => {
    try {
      console.log("🔄 Loading face-api models...");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
      modelsLoaded = true;
      console.log("✅ Models loaded successfully");
      return true;
    } catch (err) {
      console.error("❌ Model loading error:", err);
      throw new Error("Failed to load face detection models");
    }
  })();

  await loadingPromise;
  return true;
}

/**
 * Map face-api expressions to your app's moods
 */
const EXPRESSION_TO_MOOD = {
  happy: "Happy",
  sad: "Sad",
  angry: "Angry",
  neutral: "Calm",
  surprised: "Energetic",
  disgusted: "Angry",
  fearful: "Anxious",
};

/**
 * Main mood detection function
 * @param {React.RefObject} videoRef - Reference to video element
 * @param {Function} onMoodDetected - Callback when mood is detected
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function to stop detection
 */
export async function detectMood(videoRef, onMoodDetected, options = {}) {
  const {
    intervalMs = 2000, // Check every 2 seconds (reduced frequency)
    confidenceThreshold = 0.6, // Higher threshold for better accuracy
    onError = null,
    onNoFace = null,
  } = options;

  try {
    await ensureModelsLoaded();
  } catch (err) {
    if (onError) onError(err.message);
    return () => {};
  }

  const video = videoRef.current;
  if (!video) {
    console.warn("⚠️ No video reference found");
    return () => {};
  }

  let running = true;
  let consecutiveNoFace = 0;
  const MAX_NO_FACE = 3; // Alert after 3 consecutive no-face detections

  async function detectLoop() {
    if (!running) return;

    try {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224, // Smaller = faster
          scoreThreshold: 0.5,
        }))
        .withFaceExpressions();

      if (detections) {
        consecutiveNoFace = 0;
        
        const expressions = detections.expressions;
        const sortedExpressions = Object.entries(expressions)
          .sort(([, a], [, b]) => b - a);
        
        const [topLabel, confidence] = sortedExpressions[0];
        const mappedMood = EXPRESSION_TO_MOOD[topLabel] || "Calm";

        if (confidence >= confidenceThreshold) {
          console.log(`✅ Detected: ${mappedMood} (${(confidence * 100).toFixed(1)}%)`);
          onMoodDetected({
            emotion: mappedMood,
            confidence: confidence,
            raw: topLabel,
            allExpressions: expressions,
          });
        } else {
          console.log(`⚠️ Low confidence: ${topLabel} (${(confidence * 100).toFixed(1)}%)`);
        }
      } else {
        consecutiveNoFace++;
        console.log(`❌ No face detected (${consecutiveNoFace}/${MAX_NO_FACE})`);
        
        if (consecutiveNoFace >= MAX_NO_FACE && onNoFace) {
          onNoFace();
        }
      }
    } catch (err) {
      console.error("❌ Detection error:", err);
      if (onError) onError("Detection failed. Please try again.");
    }

    if (running) {
      setTimeout(detectLoop, intervalMs);
    }
  }

  // Wait for video to be ready
  const startDetection = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      detectLoop();
    } else {
      video.addEventListener("loadeddata", detectLoop, { once: true });
    }
  };

  startDetection();

  // Return cleanup function
  return () => {
    running = false;
    console.log("🛑 Mood detection stopped");
  };
}

/**
 * Stop webcam stream
 */
export function stopWebcam(videoRef) {
  if (videoRef.current && videoRef.current.srcObject) {
    const stream = videoRef.current.srcObject;
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log("🛑 Webcam track stopped:", track.kind);
    });
    videoRef.current.srcObject = null;
  }
}