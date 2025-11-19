// frontend/src/pages/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";
import MoodCard from "../components/MoodCard";
import { FaHeart, FaRegHeart, FaThumbsDown } from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [moods, setMoods] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [multiMode, setMultiMode] = useState(false);
  const [playlistSaved, setPlaylistSaved] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [lastFetchedMood, setLastFetchedMood] = useState(null);

  const [likedMap, setLikedMap] = useState({});
  const [sendingLikes, setSendingLikes] = useState(new Set());

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // toast handling
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (txt, ms = 2200) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(txt);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  // robust YT ID extractor
  const extractYouTubeId = (urlOrId) => {
    if (!urlOrId) return null;
    // if it's just an id-like string, return it
    if (!urlOrId.includes("http") && !urlOrId.includes("/")) return urlOrId;

    try {
      const u = new URL(urlOrId);
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return v;
        const parts = u.pathname.split("/");
        const embedIndex = parts.indexOf("embed");
        if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
      }
      if (u.hostname === "youtu.be") return u.pathname.replace("/", "");
    } catch (err) {
      // fallback regex
      const re = /(?:v=|\/)([0-9A-Za-z_-]{6,})(?:&|$)/;
      const m = (urlOrId || "").match(re);
      if (m) return m[1];
    }
    return urlOrId;
  };

  // load liked songs (map)
  const loadLikedSongs = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/liked/${userId}`);
      const m = {};
      (res.data || []).forEach((s) => {
        if (s.youtubeId) m[s.youtubeId] = true;
      });
      setLikedMap(m);
    } catch (err) {
      console.error("loadLikedSongs error:", err);
    }
  };

  // initial load
  useEffect(() => {
    API.get("/moods")
      .then((res) => setMoods(res.data || []))
      .catch(() => setMessage("❌ Failed to load moods"));

    loadLikedSongs();

    const params = new URLSearchParams(window.location.search);
    const moodId = params.get("moodId");

    if (moodId) {
      API.get("/moods").then((res) => {
        const mood = (res.data || []).find((m) => m._id === moodId);
        if (mood) fetchMusic(moodId, mood.name);
      });
    }

    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // webcam detection redirect
  useEffect(() => {
    if (location.state?.detectedMood && location.state?.shouldFetchMusic) {
      const mood = location.state.detectedMood;
      setMessage(`🎥 Webcam detected: ${mood.name}`);
      fetchMusic(mood._id, mood.name);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleMoodSelect = (mood) => {
    if (multiMode) {
      const isSelected = selectedMoods.includes(mood.name);
      let updated = isSelected ? selectedMoods.filter((m) => m !== mood.name) : [...selectedMoods, mood.name];

      // remove opposites
      updated = updated.filter((m) => !(opposites[mood.name] || []).includes(m));
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
      await API.post("/moods/log", {
        userId,
        moodId,
        method: "Manual",
        confidence: 1.0,
      });

      setMessage(`Mood logged: ${moodName}`);
    } catch (err) {
      console.error("Failed to log mood:", err);
      setMessage("Failed to log mood");
    }
    fetchMusic(moodId, moodName);
  };

  const fetchMusic = async (moodId, moodName) => {
    try {
      setLoading(true);
      setSongs([]);
      setPlaylistSaved(false);
      setPlaylistName("");

      const res = await API.get(`/music/${moodId}`);
      setSongs(res.data.songs || []);
      setLastFetchedMood(moodName || (res.data && res.data.mood) || null);

      // refresh liked map
      await loadLikedSongs();
    } catch (err) {
      console.error("fetchMusic error:", err);
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
    setMessage("");

    try {
      const moodsParam = selectedMoods.join(",");
      const { data } = await API.get(`/music/combined?moods=${encodeURIComponent(moodsParam)}`);

      if (data?.songs?.length > 0) {
        setSongs(data.songs);
        const moodList = data.combinedMoods?.join(", ") || selectedMoods.join(", ");
        setMessage(`Combined playlist for ${moodList}`);
        setLastFetchedMood(null);

        if (userId) {
          try {
            await API.post("/moods/log", {
              userId,
              moodNames: selectedMoods,
              method: "Combined",
              confidence: 1.0,
            });
          } catch (e) {
            // non-blocking
            console.warn("Could not log combined mood:", e);
          }
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
    if (!userId) return alert("Please log in to save playlists!");
    if (songs.length === 0) return alert("No songs to save!");

    let moodsToSave = [];
    if (multiMode && selectedMoods.length > 0) moodsToSave = selectedMoods;
    else if (!multiMode && lastFetchedMood) moodsToSave = [lastFetchedMood];
    if (moodsToSave.length === 0) moodsToSave = ["Custom"];

    const finalPlaylistName = playlistName.trim().length > 0 ? playlistName.trim() : `Playlist - ${moodsToSave.join(", ")}`;

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

  const likeSong = async (song) => {
    if (!userId) {
      showToast("Log in to like songs");
      return;
    }

    const youtubeId = extractYouTubeId(song.url);
    if (!youtubeId) return;

    if (sendingLikes.has(youtubeId)) return;
    setSendingLikes((s) => new Set(s).add(youtubeId));

    // optimistic
    setLikedMap((m) => ({ ...m, [youtubeId]: true }));

    try {
      await API.post("/liked/add", {
        userId,
        youtubeId,
        title: song.title,
        url: song.url,
        thumbnail: song.thumbnail,
        channelTitle: song.channelTitle,
      });
      showToast(`Liked: ${song.title}`);
    } catch (err) {
      console.error("likeSong error:", err);
      // rollback
      setLikedMap((m) => {
        const cp = { ...m };
        delete cp[youtubeId];
        return cp;
      });
      showToast("Could not like — try again");
    } finally {
      setSendingLikes((s) => {
        const cp = new Set(s);
        cp.delete(youtubeId);
        return cp;
      });
    }
  };

  const dislikeSong = async (song) => {
    if (!userId) {
      showToast("Log in to remove songs");
      return;
    }

    const youtubeId = extractYouTubeId(song.url);
    if (!youtubeId) return;

    // optimistic remove from songs list
    setSongs((prev) => prev.filter((p) => extractYouTubeId(p.url) !== youtubeId));
    setLikedMap((m) => {
      const cp = { ...m };
      delete cp[youtubeId];
      return cp;
    });

    try {
      await API.delete(`/liked/${userId}/${youtubeId}`);
      showToast("Removed");
    } catch (err) {
      console.error("dislikeSong error:", err);
      // refresh liked list to re-sync
      await loadLikedSongs();
      showToast("Could not remove — data may be out of sync");
    }
  };

  const isLiked = (song) => {
    const id = extractYouTubeId(song.url);
    return id && !!likedMap[id];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700">MoodWave Dashboard</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/detect-mood")}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
            >
              🎥 Webcam Detection
            </button>
          </div>
        </div>

        {message && (
          <div className="text-center mb-4 p-3 bg-blue-100 border border-blue-300 rounded-xl">
            <p className="text-lg font-medium text-blue-700">{message}</p>
          </div>
        )}

        {/* Mood Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {moods.map((m) => (
            <MoodCard key={m._id} mood={m} isActive={selectedMoods.includes(m.name)} onClick={handleMoodSelect} />
          ))}
        </div>

        {/* Multi Mode Toggle */}
        <div className="text-center mb-6">
          <button
            onClick={() => {
              setMultiMode((v) => !v);
              setSelectedMoods([]);
              setSongs([]);
              setMessage("");
              setPlaylistSaved(false);
              setPlaylistName("");
              setLastFetchedMood(null);
            }}
            className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition ${multiMode ? "bg-blue-700 text-white" : "bg-white border-2 border-blue-300 text-blue-700"}`}
          >
            {multiMode ? "🎵 Multi-Mood Mode: ON" : "🎵 Single-Mood Mode: ON"}
          </button>
        </div>

        {/* Selected Moods display */}
        {multiMode && selectedMoods.length > 0 && (
          <div className="text-center text-lg mb-4">
            Selected: <b>{selectedMoods.join(", ")}</b>
          </div>
        )}

        {/* Generate Combined Playlist */}
        {multiMode && selectedMoods.length > 0 && (
          <div className="text-center mb-6 bg-white p-4 rounded-xl shadow-md">
            <button onClick={generateCombinedPlaylist} disabled={loading} className="bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition disabled:opacity-50">
              {loading ? "Generating..." : "Generate Combined Playlist"}
            </button>
          </div>
        )}

        {/* Save Playlist */}
        {songs.length > 0 && userId && !playlistSaved && (
          <div className="text-center mb-6 bg-white p-4 rounded-xl shadow-lg">
            <input
              type="text"
              placeholder="Enter playlist name (optional)"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full max-w-md px-4 py-2 border rounded-xl mb-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <button onClick={handleSavePlaylist} className="bg-green-600 text-white px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition font-semibold">
              💾 Save This Playlist
            </button>
          </div>
        )}

        {/* Songs List */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">🎵 Recommended Songs</h2>

          {loading && (
            <p className="text-center text-gray-500 py-6">Loading songs...</p>
          )}

          {!loading && songs.length === 0 && (
            <p className="text-gray-500 text-center py-6">Select mood(s) to get song recommendations</p>
          )}

          <ul className="space-y-3">
            {songs.map((s, i) => {
              const liked = isLiked(s);
              const youtubeId = extractYouTubeId(s.url);
              const sending = sendingLikes.has(youtubeId);

              return (
                <li key={i} className="border-b border-gray-200 py-3 flex items-center gap-4 hover:bg-blue-50 transition rounded-lg px-2">
                  {s.thumbnail && (
                    <img src={s.thumbnail} alt="" width="80" height="80" className="rounded-lg object-cover shadow-sm" />
                  )}

                  <div className="flex-1">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline font-medium text-lg">
                      {s.title}
                    </a>

                    {s.channelTitle && <div className="text-sm text-gray-500 mt-1">{s.channelTitle}</div>}
                  </div>

                  <div className="flex items-center gap-3 pr-4">
                    {!userId ? (
                      <div className="text-gray-400 text-sm">Log in to react</div>
                    ) : (
                      <>
                        <button onClick={() => likeSong(s)} disabled={sending} aria-label={liked ? "Unlike" : "Like"} className="text-2xl transition-transform hover:scale-105">
                          {liked ? <FaHeart className="text-red-600" /> : <FaRegHeart className="text-gray-500" />}
                        </button>

                        <button onClick={() => dislikeSong(s)} disabled={sending} aria-label="Dislike" className="text-xl text-gray-600 hover:text-black transition-transform hover:scale-105">
                          <FaThumbsDown />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 bg-black/80 text-white px-4 py-2 rounded-lg shadow-md">
          {toast}
        </div>
      )}
    </div>
  );
}
