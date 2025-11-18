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

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // toast fn
  const showToast = (txt, ms = 2200) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(txt);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  // robust YT ID extractor
  const extractYouTubeId = (urlOrId) => {
    if (!urlOrId) return null;
    if (!urlOrId.includes("http") && !urlOrId.includes("/")) return urlOrId;

    try {
      const u = new URL(urlOrId);
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return v;
        const parts = u.pathname.split("/");
        const embedIndex = parts.indexOf("embed");
        if (embedIndex >= 0 && parts[embedIndex + 1])
          return parts[embedIndex + 1];
      }
      if (u.hostname === "youtu.be") return u.pathname.replace("/", "");
    } catch (err) {
      const re = /(?:v=|\/)([0-9A-Za-z_-]{6,})(?:&|$)/;
      const m = (urlOrId || "").match(re);
      if (m) return m[1];
    }
    return urlOrId;
  };

  // load liked songs
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
    if (
      location.state?.detectedMood &&
      location.state?.shouldFetchMusic
    ) {
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

  const handleMoodSelect = async (mood) => {
    if (multiMode) {
      const isSel = selectedMoods.includes(mood.name);
      let updated = isSel
        ? selectedMoods.filter((m) => m !== mood.name)
        : [...selectedMoods, mood.name];
      updated = updated.filter(
        (n) => !(opposites[mood.name] || []).includes(n)
      );
      setSelectedMoods(updated);
    } else {
      handleManualSelect(mood._id, mood.name);
    }
  };

  const handleManualSelect = async (moodId, moodName) => {
    if (!userId) {
      setMessage("You're not logged in — showing songs only");
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
      loadLikedSongs();
    } catch (err) {
      console.error("fetchMusic error:", err);
      setMessage("Failed to fetch songs");
    } finally {
      setLoading(false);
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

    setLikedMap((m) => ({ ...m, [youtubeId]: true }));

    try {
      const payload = {
        userId,
        youtubeId,
        title: song.title,
        url: song.url,
        thumbnail: song.thumbnail,
        channelTitle: song.channelTitle,
      };

      await API.post("/liked/add", payload);
      showToast(`Liked: ${song.title}`);
    } catch (err) {
      console.error("likeSong error:", err);
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

    if (sendingLikes.has(youtubeId)) return;
    setSendingLikes((s) => new Set(s).add(youtubeId));

    setSongs((prev) =>
      prev.filter((p) => extractYouTubeId(p.url) !== youtubeId)
    );
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
      await loadLikedSongs();
      showToast("Could not remove — data may be out of sync");
    } finally {
      setSendingLikes((s) => {
        const cp = new Set(s);
        cp.delete(youtubeId);
        return cp;
      });
    }
  };

  const isLiked = (song) => {
    const id = extractYouTubeId(song.url);
    return id && !!likedMap[id];
  };

  const getInitials = (name) =>
    name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700">
            MoodWave Dashboard
          </h1>
          <button
            onClick={() => navigate("/detect-mood")}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
          >
            🎥 Webcam Detection
          </button>
        </div>

        {message && (
          <div className="text-center mb-4 p-3 bg-blue-100 border border-blue-300 rounded-xl">
            <p className="text-lg font-medium text-blue-700">
              {message}
            </p>
          </div>
        )}

        {/* Mood grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {moods.map((m) => (
            <MoodCard
              key={m._id}
              mood={m}
              isActive={selectedMoods.includes(m.name)}
              onClick={handleMoodSelect}
            />
          ))}
        </div>

        {/* Songs */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">
            🎵 Recommended Songs
          </h2>

          {loading && (
            <p className="text-center text-gray-500 py-6">
              Loading songs...
            </p>
          )}

          {!loading && songs.length === 0 && (
            <p className="text-gray-500 text-center py-6">
              Select mood(s) to get song recommendations
            </p>
          )}

          <ul className="space-y-3">
            {songs.map((s, i) => {
              const liked = isLiked(s);
              const youtubeId = extractYouTubeId(s.url);
              const sending = sendingLikes.has(youtubeId);

              return (
                <li
                  key={i}
                  className="border-b border-gray-200 py-3 flex items-center gap-4 hover:bg-blue-50 transition rounded-lg px-2"
                >
                  {s.thumbnail && (
                    <img
                      src={s.thumbnail}
                      alt=""
                      width="80"
                      height="80"
                      className="rounded-lg object-cover shadow-sm"
                    />
                  )}

                  <div className="flex-1">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
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

                  <div className="flex items-center gap-3 pr-4">
                    {!userId ? (
                      <div className="text-gray-400 text-sm">
                        Log in to react
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => likeSong(s)}
                          disabled={sending}
                          aria-label={liked ? "Unlike" : "Like"}
                          className="text-2xl transition-transform hover:scale-105"
                        >
                          {liked ? (
                            <FaHeart className="text-red-600" />
                          ) : (
                            <FaRegHeart className="text-gray-500" />
                          )}
                        </button>

                        <button
                          onClick={() => dislikeSong(s)}
                          disabled={sending}
                          aria-label="Dislike"
                          className="text-xl text-gray-600 hover:text-black transition-transform hover:scale-105"
                        >
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
      <div className="fixed right-6 bottom-6">
        {toast && (
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg shadow-md">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
