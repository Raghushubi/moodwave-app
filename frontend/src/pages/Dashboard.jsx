// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";

export default function Dashboard() {
  const [moods, setMoods] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem("userId");

  // 🔹 Load moods
  useEffect(() => {
    API.get("/moods")
      .then((res) => setMoods(res.data))
      .catch(() => setMessage("Failed to load moods"));
  }, []);

  // 🔹 If redirected from DetectMood
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const moodId = params.get("moodId");
    if (moodId) {
      fetchMusic(moodId);
      setMessage("Loaded songs for detected mood");
    }
  }, [location.search]);

  // 🔹 Manual mood select
  const handleManualSelect = async (moodId) => {
    if (!userId) {
      setMessage("You’re not logged in — showing songs only (not logged).");
      fetchMusic(moodId);
      return;
    }

    try {
      await API.post("/moods/log", {
        userId,
        moodId,
        method: "Manual",
        confidence: 1.0,
      });
      setMessage("✅ Mood logged manually!");
      fetchMusic(moodId);
    } catch {
      setMessage("❌ Failed to log mood");
    }
  };

  // 🔹 Fetch music
  const fetchMusic = async (moodId) => {
    try {
      setLoading(true);
      setSongs([]);
      const res = await API.get(`/music/${moodId}`);
      setSongs(res.data.songs || []);
      if (!res.data.songs || res.data.songs.length === 0) {
        setMessage("No songs found for this mood.");
      }
    } catch {
      setMessage("❌ Failed to fetch songs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">
          🌊 MoodWave Dashboard
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/detect-mood")}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition"
          >
            🎥 Webcam Detection
          </button>

          {userId && (
            <button
              onClick={() => navigate("/profile")}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg shadow hover:shadow-md transition"
            >
              👤 Profile
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <p className="text-center mb-4 font-medium text-green-600">{message}</p>
      )}

      {/* Manual Mood Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">🎛️ Manual Mood Selection</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {moods.map((mood) => (
            <button
              key={mood._id}
              onClick={() => handleManualSelect(mood._id)}
              className="p-4 rounded-xl text-white font-semibold shadow-md hover:scale-105 transition-transform flex flex-col items-center gap-2"
              style={{ backgroundColor: mood.colorCode }}
            >
              <div className="text-2xl">{mood.icon}</div>
              <div>{mood.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Songs */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          🎵 Recommended Songs
        </h2>

        {loading && <p>Loading songs...</p>}

        {!loading && songs.length === 0 && (
          <p className="text-gray-500">
            Select a mood or use webcam detection to get songs 🎧
          </p>
        )}

        <ul className="space-y-2">
          {songs.map((s, i) => (
            <li key={i} className="border-b py-2 flex items-center gap-3">
              {s.thumbnail && (
                <img
                  src={s.thumbnail}
                  alt="thumb"
                  width="56"
                  height="56"
                  className="rounded-md"
                />
              )}
              <div className="flex-1">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  {s.title}
                </a>
                {s.channelTitle && (
                  <div className="text-sm text-gray-500">
                    {s.channelTitle}
                  </div>
                )}
              </div>
              <div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-blue-600"
                >
                  ▶ Play
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
