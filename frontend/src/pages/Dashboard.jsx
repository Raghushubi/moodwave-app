// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

export default function Dashboard() {
  const [moods, setMoods] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [multiMode, setMultiMode] = useState(false);
  const [playlistSaved, setPlaylistSaved] = useState(false);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // 🔹 Load all moods from backend
  useEffect(() => {
    API.get("/moods")
      .then((res) => setMoods(res.data))
      .catch(() => setMessage("❌ Failed to load moods"));
  }, []);

  // 🔹 Opposite mood mapping (prevents clashing moods)
  const opposites = {
    Happy: ["Sad", "Angry"],
    Sad: ["Happy", "Energetic"],
    Angry: ["Calm", "Peaceful"],
    Calm: ["Angry", "Anxious"],
    Energetic: ["Peaceful", "Sad"],
    Peaceful: ["Energetic", "Angry"],
    Romantic: ["Anxious"],
    Anxious: ["Romantic", "Calm"],
  };

  // 🔹 Handle mood selection
  const handleMoodSelect = async (mood) => {
    if (multiMode) {
      const isSelected = selectedMoods.includes(mood.name);
      let updated = isSelected
        ? selectedMoods.filter((m) => m !== mood.name)
        : [...selectedMoods, mood.name];

      // remove opposites automatically
      const oppositeSet = opposites[mood.name] || [];
      updated = updated.filter((m) => !oppositeSet.includes(m));

      setSelectedMoods(updated);
    } else {
      handleManualSelect(mood._id);
    }
  };

  // 🔹 Handle manual (single) mood selection
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

  // 🔹 Fetch songs for a single mood
  const fetchMusic = async (moodId) => {
    try {
      setLoading(true);
      setSongs([]);
      const res = await API.get(`/music/${moodId}`);
      setSongs(res.data.songs || []);
      setMessage(`🎧 Songs for ${res.data.mood}`);
    } catch (err) {
      console.error("Fetch music error:", err);
      setMessage("❌ Failed to fetch songs");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Generate combined playlist (multi-mood)
  const generateCombinedPlaylist = async () => {
    if (selectedMoods.length === 0) return;
    setLoading(true);
    setSongs([]);
    setPlaylistSaved(false);
    setMessage("");

    try {
      const moodsParam = selectedMoods.join(",");
      const { data } = await API.get(`/music/combined?moods=${moodsParam}`);

      if (data && Array.isArray(data.songs) && data.songs.length > 0) {
        setSongs(data.songs);
        const moodList =
          data.combinedMoods?.join(", ") || selectedMoods.join(", ");
        setMessage(`🎧 Combined playlist for ${moodList}`);

        // ✅ Log this combined mood to backend as one entry
        if (userId) {
          await API.post("/moods/log", {
            userId,
            moodNames: selectedMoods,
            method: "Combined",
            confidence: 1.0,
          });
        }
      } else {
        setSongs([]);
        setMessage("ℹ️ No songs found for these moods (try different combo)");
      }
    } catch (err) {
      console.error("Error generating combined playlist:", err);
      setMessage("⚠️ Server delay or issue — please retry once.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Save playlist (single + multi mood support)
  const handleSavePlaylist = async () => {
    if (!userId) {
      alert("⚠ Please log in to save playlists!");
      return;
    }

    try {
      let moodsToSave = [];

      // Multi-mood mode → use selected moods
      if (multiMode && selectedMoods.length > 0) {
        moodsToSave = selectedMoods;
      }
      // Single-mood → infer from message
      else if (!multiMode && message.includes("Songs for")) {
        const lastMood = message.match(/Songs for (.+)$/)?.[1]?.trim();
        if (lastMood && lastMood !== "undefined") {
          moodsToSave = [lastMood];
        }
      }

      // Fallback if nothing detected
      if (moodsToSave.length === 0) moodsToSave = ["Custom"];

      console.log("🎯 Saving playlist with moods:", moodsToSave);

      await API.post("/playlists/save", {
        userId,
        moods: moodsToSave,
        songs,
        name: `Playlist - ${moodsToSave.join(", ")}`,
      });

      setPlaylistSaved(true);
      setMessage("💾 Playlist saved successfully!");
    } catch (err) {
      console.error("Save playlist error:", err);
      setMessage("❌ Failed to save playlist");
    }
  };

  // 🧠 UI Render
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">🌊 MoodWave Dashboard</h1>
        <button
          onClick={() => navigate("/detect-mood")}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition"
        >
          🎥 Webcam Detection
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="text-center mb-4">
        <button
          onClick={() => {
            setMultiMode(!multiMode);
            setSelectedMoods([]);
            setSongs([]);
            setMessage("");
            setPlaylistSaved(false);
          }}
          className={`px-5 py-2 rounded-lg font-semibold shadow transition ${
            multiMode
              ? "bg-blue-700 text-white hover:bg-blue-800"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {multiMode ? "🎛️ Multi-Mood Mode: ON" : "🎚️ Single-Mood Mode: ON"}
        </button>
      </div>

      {message && (
        <p
          className={`text-center mb-4 font-medium ${
            message.startsWith("❌") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      {/* Mood Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {moods.map((mood) => {
          const isActive = selectedMoods.includes(mood.name);
          return (
            <button
              key={mood._id}
              onClick={() => handleMoodSelect(mood)}
              className={`p-4 rounded-xl text-white font-semibold shadow-md flex flex-col items-center gap-2 transition-transform ${
                isActive ? "scale-110 border-4 border-yellow-400" : "hover:scale-105"
              }`}
              style={{
                backgroundColor: mood.colorCode,
                opacity: isActive || !multiMode ? 1 : 0.9,
              }}
            >
              <div className="text-2xl">{mood.icon}</div>
              <div>{mood.name}</div>
            </button>
          );
        })}
      </div>

      {/* Generate Playlist */}
      {multiMode && selectedMoods.length > 0 && (
        <div className="text-center mb-6">
          <p className="text-gray-700 mb-2">
            Selected: <b>{selectedMoods.join(", ")}</b>
          </p>
          <button
            onClick={generateCombinedPlaylist}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            🎧 Generate Combined Playlist
          </button>
        </div>
      )}

      {/* Save Playlist Button */}
      {songs.length > 0 && userId && !playlistSaved && (
        <div className="text-center mb-4">
          <button
            onClick={handleSavePlaylist}
            className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            💾 Save This Playlist
          </button>
        </div>
      )}

      {/* Song List */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          🎵 Recommended Songs
        </h2>
        {loading && <p>Loading songs...</p>}
        {!loading && songs.length === 0 && (
          <p className="text-gray-500">Select moods to get songs 🎧</p>
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
                  <div className="text-sm text-gray-500">{s.channelTitle}</div>
                )}
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-blue-600"
              >
                ▶ Play
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
