import * as faceapi from "face-api.js";

export async function detectMood(videoRef, setResult) {
  // Load models (from the public/models folder — you’ll create that later)
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models")
  ]);

  const video = videoRef.current;

  // Start detection loop
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      const emotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      const confidence = expressions[emotion];
      setResult({ emotion, confidence });
    }
  }, 2000); // every 2 seconds
}
