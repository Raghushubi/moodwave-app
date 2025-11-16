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
      handleManualSelect(mood._id, mood.name);
    }
  };

  const [lastFetchedMood, setLastFetchedMood] = useState(null);

  const handleManualSelect = async (moodId, moodName) => {
    if (!userId) {
      setMessage("You're not logged in - showing songs only (not logged)");
      fetchMusic(moodId, moodName);
      return;
    }

    try {
      await API.post("/moods/log", {
        userId,
        moodId,
        method: "Manual",
        confidence: 1.0,
      });
      setMessage("Mood logged manually!");
      fetchMusic(moodId, moodName);
    } catch {
      setMessage("Failed to log mood");
    }
  };

  const fetchMusic = async (moodId, moodName) => {
    try {
      setLoading(true);
      setSongs([]);
      setPlaylistSaved(false);
      const res = await API.get(`/music/${moodId}`);
      setSongs(res.data.songs || []);
      setLastFetchedMood(moodName || res.data.mood);
      setMessage(`Songs for ${moodName || res.data.mood}`);
    } catch (err) {
      console.error("Fetch music error:", err);
      setMessage("Failed to fetch songs");
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
    setLastFetchedMood(null);

    try {
      const moodsParam = selectedMoods.join(",");
      const { data } = await API.get(`/music/combined?moods=${moodsParam}`);

      if (data && Array.isArray(data.songs) && data.songs.length > 0) {
        setSongs(data.songs);
        const moodList = data.combinedMoods?.join(", ") || selectedMoods.join(", ");
        setMessage(`Combined playlist for ${moodList}`);

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
        setMessage("No songs found for these moods (try different combo)");
      }
    } catch (err) {
      console.error("Error generating combined playlist:", err);
      setMessage("Server delay or issue - please retry");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Save playlist (single + multi mood support)
  const handleSavePlaylist = async () => {
    if (!userId) {
      alert("Please log in to save playlists!");
      return;
    }

    try {
      let moodsToSave = [];

      if (multiMode && selectedMoods.length > 0) {
        moodsToSave = selectedMoods;
      } else if (!multiMode && lastFetchedMood) {
        moodsToSave = [lastFetchedMood];
      } else if (!multiMode && message.includes("Songs for")) {
        const match = message.match(/Songs for (.+)$/);
        if (match && match[1] && match[1] !== "undefined") {
          moodsToSave = [match[1].trim()];
        }
      }

      if (moodsToSave.length === 0) {
        moodsToSave = ["Custom"];
      }

      console.log("Saving playlist with moods:", moodsToSave);

      await API.post("/playlists/save", {
        userId,
        moods: moodsToSave,
        songs,
        name: `Playlist - ${moodsToSave.join(", ")}`,
      });

      setPlaylistSaved(true);
      setMessage("Playlist saved successfully!");
    } catch (err) {
      console.error("Save playlist error:", err);
      setMessage("Failed to save playlist");
    }
  };

  // 🧠 UI Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700">MoodWave Dashboard</h1>
          <button
            onClick={() => navigate("/detect-mood")}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            Webcam Detection
          </button>
        </div>

        <div className="text-center mb-6">
          <button
            onClick={() => {
              setMultiMode(!multiMode);
              setSelectedMoods([]);
              setSongs([]);
              setMessage("");
              setPlaylistSaved(false);
              setLastFetchedMood(null);
            }}
            className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 ${
              multiMode
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                : "bg-white text-blue-700 border-2 border-blue-300"
            }`}
          >
            {multiMode ? "Multi-Mood Mode: ON" : "Single-Mood Mode: ON"}
          </button>
        </div>

        {message && (
          <p
            className={`text-center mb-4 font-medium text-lg ${
              message.includes("Failed") || message.includes("Failed")
                ? "text-red-600"
                : message.includes("successfully")
                ? "text-green-600"
                : "text-blue-600"
            }`}
          >
            {message}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {moods.map((mood) => {
            const isActive = selectedMoods.includes(mood.name);
            return (
              <button
                key={mood._id}
                onClick={() => handleMoodSelect(mood)}
                className={`p-6 rounded-2xl text-white font-semibold shadow-lg flex flex-col items-center gap-3 transition-all transform ${
                  isActive
                    ? "scale-110 border-4 border-yellow-400 shadow-2xl"
                    : "hover:scale-105 hover:shadow-xl"
                }`}
                style={{
                  backgroundColor: mood.colorCode,
                  opacity: isActive || !multiMode ? 1 : 0.85,
                }}
              >
                <div className="text-4xl">{mood.icon}</div>
                <div className="text-lg">{mood.name}</div>
              </button>
            );
          })}
        </div>

        {multiMode && selectedMoods.length > 0 && (
          <div className="text-center mb-6 bg-white p-4 rounded-xl shadow-md">
            <p className="text-gray-700 mb-3 text-lg">
              Selected: <b>{selectedMoods.join(", ")}</b>
            </p>
            <button
              onClick={generateCombinedPlaylist}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
            >
              Generate Combined Playlist
            </button>
          </div>
        )}

        {songs.length > 0 && userId && !playlistSaved && (
          <div className="text-center mb-6">
            <button
              onClick={handleSavePlaylist}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 font-semibold"
            >
              Save This Playlist
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">
            Recommended Songs
          </h2>
          {loading && <p className="text-gray-500">Loading songs...</p>}
          {!loading && songs.length === 0 && (
            <p className="text-gray-500">Select moods to get songs</p>
          )}
          <ul className="space-y-3">
            {songs.map((s, i) => (
              <li key={i} className="border-b border-gray-200 py-3 flex items-center gap-4 hover:bg-blue-50 transition-colors rounded-lg px-2">
                {s.thumbnail && (
                  <img
                    src={s.thumbnail}
                    alt="thumb"
                    width="80"
                    height="80"
                    className="rounded-lg shadow-sm"
                  />
                )}
                <div className="flex-1">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline font-medium text-lg"
                  >
                    {s.title}
                  </a>
                  {s.channelTitle && (
                    <div className="text-sm text-gray-500 mt-1">{s.channelTitle}</div>
                  )}
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-100 px-4 py-2 rounded-lg hover:bg-blue-200 transition"
                >
                  Play
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
