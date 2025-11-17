// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";

export default function Dashboard() {
  const [moods, setMoods] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [multiMode, setMultiMode] = useState(false);
  const [playlistSaved, setPlaylistSaved] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [lastFetchedMood, setLastFetchedMood] = useState(null);

  const navigate = useNavigate();
  const location = useLocation(); // Get location state
  const userId = localStorage.getItem("userId");

  // Load moods and check for moodId in URL
  useEffect(() => {
    API.get("/moods")
      .then((res) => setMoods(res.data))
      .catch(() => setMessage("❌ Failed to load moods"));

    // Check if moodId is in URL (from webcam detection redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const moodId = urlParams.get('moodId');
    if (moodId) {
      // Find the mood and fetch music
      API.get("/moods")
        .then((res) => {
          const mood = res.data.find(m => m._id === moodId);
          if (mood) {
            fetchMusic(moodId, mood.name);
          }
        })
        .catch(() => {});
    }
  }, []);

  // 🆕 Handle detected mood from webcam
  useEffect(() => {
    if (location.state?.detectedMood && location.state?.shouldFetchMusic) {
      const mood = location.state.detectedMood;
      setMessage(`🎥 Webcam detected: ${mood.name}`);
      fetchMusic(mood._id, mood.name);

      // Clear state to prevent re-fetching
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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

  const handleMoodSelect = async (mood) => {
    if (multiMode) {
      const isSelected = selectedMoods.includes(mood.name);
      let updated = isSelected
        ? selectedMoods.filter((m) => m !== mood.name)
        : [...selectedMoods, mood.name];

      const oppositeSet = opposites[mood.name] || [];
      updated = updated.filter((m) => !oppositeSet.includes(m));

      setSelectedMoods(updated);
    } else {
      handleManualSelect(mood._id, mood.name);
    }
  };

  const handleManualSelect = async (moodId, moodName) => {
    if (!userId) {
      setMessage("You're not logged in - showing songs only");
      fetchMusic(moodId, moodName);
      return;
    }

    try {
      // Log single mood
      await API.post("/moods/log", {
        userId,
        moodId,
        method: "Manual",
        confidence: 1.0,
      });
      setMessage(`Mood logged: ${moodName}`);
      fetchMusic(moodId, moodName);
    } catch (err) {
      console.error("Failed to log mood:", err);
      setMessage("Failed to log mood");
    }
  };

  const fetchMusic = async (moodId, moodName) => {
    try {
      setLoading(true);
      setSongs([]);
      setPlaylistSaved(false);
      setPlaylistName("");
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

  const generateCombinedPlaylist = async () => {
    if (selectedMoods.length === 0) {
      setMessage("Please select at least one mood");
      return;
    }

    setLoading(true);
    setSongs([]);
    setPlaylistSaved(false);
    setPlaylistName("");
    setMessage("");
    setLastFetchedMood(null);

    try {
      // Fetch combined playlist music
      const moodsParam = selectedMoods.join(",");
      const { data } = await API.get(`/music/combined?moods=${moodsParam}`);

      if (data?.songs?.length > 0) {
        setSongs(data.songs);
        const moodList = data.combinedMoods?.join(", ") || selectedMoods.join(", ");
        setMessage(`Combined playlist for ${moodList}`);

        // Log combined mood if user is logged in
        if (userId) {
          await API.post("/moods/log", {
            userId,
            moodNames: selectedMoods, // Send array of mood names
            method: "Combined",
            confidence: 1.0,
          });
        }
      } else {
        setMessage("No songs found for this combination");
      }
    } catch (err) {
      console.error("Generate combined playlist error:", err);
      setMessage("Error generating combined playlist");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlaylist = async () => {
    if (!userId) {
      return alert("Please log in to save playlists!");
    }

    if (songs.length === 0) {
      return alert("No songs to save!");
    }

    let moodsToSave = [];

    if (multiMode && selectedMoods.length > 0) {
      moodsToSave = selectedMoods;
    } else if (!multiMode && lastFetchedMood) {
      moodsToSave = [lastFetchedMood];
    }

    if (moodsToSave.length === 0) moodsToSave = ["Custom"];

    const finalPlaylistName =
      playlistName.trim().length > 0
        ? playlistName.trim()
        : `Playlist - ${moodsToSave.join(", ")}`;

    try {
      await API.post("/playlists/save", {
        userId,
        moods: moodsToSave,
        songs,
        name: finalPlaylistName,
      });

      setPlaylistSaved(true);
      setMessage("✅ Playlist saved successfully!");
    } catch (err) {
      console.error("Save playlist error:", err);
      setMessage("❌ Failed to save playlist");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700">MoodWave Dashboard</h1>

          <button
            onClick={() => navigate("/detect-mood")}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
          >
            🎥 Webcam Detection
          </button>
        </div>

        {message && (
          <div className="text-center mb-4 p-3 bg-blue-100 border border-blue-300 rounded-xl">
            <p className="text-lg font-medium text-blue-700">{message}</p>
          </div>
        )}

        {/* Mood Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {moods.map((mood) => {
            const isActive = selectedMoods.includes(mood.name);
            return (
              <button
                key={mood._id}
                onClick={() => handleMoodSelect(mood)}
                className={`p-6 rounded-2xl text-white font-semibold shadow-lg flex flex-col items-center gap-3 transition ${
                  isActive ? "scale-110 border-4 border-yellow-400" : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: mood.colorCode,
                }}
              >
                <div className="text-4xl">{mood.icon}</div>
                <div className="text-lg">{mood.name}</div>
              </button>
            );
          })}
        </div>

        {/* Multi Mode Toggle */}
        <div className="text-center mb-6">
          <button
            onClick={() => {
              setMultiMode(!multiMode);
              setSelectedMoods([]);
              setSongs([]);
              setMessage("");
              setPlaylistSaved(false);
              setPlaylistName("");
              setLastFetchedMood(null);
            }}
            className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition ${
              multiMode
                ? "bg-blue-700 text-white"
                : "bg-white border-2 border-blue-300 text-blue-700"
            }`}
          >
            {multiMode ? "🎵 Multi-Mood Mode: ON" : "🎵 Single-Mood Mode: ON"}
          </button>
        </div>

        {/* Generate Combined Playlist Button */}
        {multiMode && selectedMoods.length > 0 && (
          <div className="text-center mb-6 bg-white p-4 rounded-xl shadow-md">
            <p className="text-gray-700 mb-3 text-lg">
              Selected: <b>{selectedMoods.join(", ")}</b>
            </p>

            <button
              onClick={generateCombinedPlaylist}
              disabled={loading}
              className="bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Combined Playlist"}
            </button>
          </div>
        )}

        {/* Save Playlist Section */}
        {songs.length > 0 && userId && !playlistSaved && (
          <div className="text-center mb-6 bg-white p-4 rounded-xl shadow-lg">
            <input
              type="text"
              placeholder="Enter playlist name (optional)"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full max-w-md px-4 py-2 border rounded-xl mb-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              onClick={handleSavePlaylist}
              className="bg-green-600 text-white px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition font-semibold"
            >
              💾 Save This Playlist
            </button>
          </div>
        )}

        {/* Songs List */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">🎵 Recommended Songs</h2>

          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading songs...</p>
            </div>
          )}

          {!loading && songs.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Select mood(s) to get song recommendations
            </p>
          )}

          <ul className="space-y-3">
            {songs.map((s, i) => (
              <li
                key={i}
                className="border-b border-gray-200 py-3 flex items-center gap-4 hover:bg-blue-50 transition rounded-lg px-2"
              >
                {s.thumbnail && (
                  <img
                    src={s.thumbnail}
                    alt="thumbnail"
                    width="80"
                    height="80"
                    className="rounded-lg shadow-sm object-cover"
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
                    <div className="text-sm text-gray-500 mt-1">
                      {s.channelTitle}
                    </div>
                  )}
                </div>

                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-100 px-4 py-2 rounded-lg hover:bg-blue-200 transition"
                >
                  ▶️ Play
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

