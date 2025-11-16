import * as faceapi from "face-api.js";

let modelsLoaded = false;

export async function detectMood(videoRef, setResult, options = {}) {
  const { intervalMs = 1500, confidenceThreshold = 0.5 } = options;

  if (!modelsLoaded) {
    console.log("Loading face-api models...");
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
      modelsLoaded = true;
      console.log("Models loaded successfully");
    } catch (err) {
      console.error("Model loading error:", err);
      return () => {};
    }
  }

  const video = videoRef.current;
  if (!video) {
    console.warn("No video reference found");
    return () => {};
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

        if (confidence >= confidenceThreshold) {
          console.log(`Detected: ${mappedMood} (${(confidence * 100).toFixed(1)}%)`);
          setResult({
            emotion: mappedMood,
            confidence,
            raw: topLabel
          });
        }
      } else {
        console.log("No face detected");
      }
    } catch (err) {
      console.error("Detection error:", err);
    }

    setTimeout(loop, intervalMs);
  }

  loop();

  return () => {
    running = false;
    console.log("Mood detection stopped");
  };
}
