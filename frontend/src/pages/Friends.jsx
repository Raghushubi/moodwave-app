// frontend/src/pages/Friends.jsx
import { useEffect, useState } from "react";
import API from "../utils/api";

export default function Friends() {
  const [suggestions, setSuggestions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");

  // Load friends + suggestions
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      API.get(`/social/suggestions/${userId}`),
      API.get(`/social/friends/${userId}`)
    ])
      .then(([suggRes, friendsRes]) => {
        const friendIds = new Set(friendsRes.data.map((f) => f._id));

        // Mark suggestions as connected if they appear in friends
        const updatedSuggestions = suggRes.data.map((s) => ({
          ...s,
          connected: friendIds.has(s.user._id)
        }));

        setSuggestions(updatedSuggestions);
        setFriends(friendsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setError("Could not load suggestions");
        setLoading(false);
      });
  }, [userId]);

  const handleConnect = async (toUserId, i) => {
    try {
      // Optimistic update
      setSuggestions((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, connecting: true } : s
        )
      );

      await API.post("/social/connect", { fromUserId: userId, toUserId });

      // Move this user to friends list
      setFriends((prev) => [
        ...prev,
        suggestions[i].user
      ]);

      // Mark as connected in suggestions
      setSuggestions((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, connected: true, connecting: false } : s
        )
      );
    } catch (err) {
      console.error("Connect failed:", err);
      setSuggestions((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, connecting: false } : s
        )
      );
      alert("Could not connect. Try again.");
    }
  };

  // Avatar
  const avatar = (name) => {
    const letter = name?.charAt(0)?.toUpperCase() || "?";
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xl font-bold shadow">
        {letter}
      </div>
    );
  };

  // Mood chip color
  const moodColor = {
    happy: "bg-yellow-100 text-yellow-700",
    sad: "bg-blue-100 text-blue-700",
    anxious: "bg-red-100 text-red-700",
    angry: "bg-red-200 text-red-800",
    calm: "bg-green-100 text-green-700",
    peaceful: "bg-green-200 text-green-800",
    romantic: "bg-pink-100 text-pink-700",
    surprised: "bg-purple-100 text-purple-700",
    neutral: "bg-gray-200 text-gray-700"
  };

  const UserCard = ({ s, i, isFriend }) => (
    <div
      className="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-center space-x-4">
        {avatar(s.user.name)}

        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {s.user.name}
          </h2>
          <p className="text-sm text-gray-500">{s.user.email}</p>
        </div>

        {!isFriend && (
          <div className="ml-auto">
            <span className="px-3 py-1 text-sm font-bold text-green-700 bg-green-100 rounded-full">
              {s.score}%
            </span>
          </div>
        )}
      </div>

      {s.sharedMoods && s.sharedMoods.length > 0 && !isFriend && (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.sharedMoods.map((mood, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 text-xs rounded-full font-medium ${
                moodColor[mood] || "bg-gray-200 text-gray-700"
              }`}
            >
              {mood}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        {isFriend ? (
          <button
            disabled
            className="px-4 py-2 rounded-xl bg-gray-400 text-white cursor-default shadow"
          >
            Connected
          </button>
        ) : (
          <button
            onClick={() => handleConnect(s.user._id, i)}
            disabled={s.connected || s.connecting}
            className={`px-4 py-2 rounded-xl text-white font-medium shadow ${
              s.connected
                ? "bg-gray-400 cursor-default"
                : s.connecting
                ? "bg-gray-500 cursor-wait"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {s.connected ? "Connected" : s.connecting ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-8 text-blue-700 tracking-tight">
        👥 Friends & Connections
      </h1>

      {loading && <p className="text-gray-500 text-lg">Loading…</p>}
      {error && <p className="text-red-500 text-lg">{error}</p>}

      {/* Your Friends */}
      {friends.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Friends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {friends.map((f, idx) => (
              <UserCard
                key={f._id}
                s={{ user: f }}
                isFriend={true}
              />
            ))}
          </div>
        </>
      )}

      {/* Suggestions */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Find New People</h2>

      {suggestions.length === 0 ? (
        <p className="text-gray-500 text-lg">No suggestions available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {suggestions.map((s, i) => (
            <UserCard
              key={s.user._id}
              s={s}
              i={i}
              isFriend={s.connected}
            />
          ))}
        </div>
      )}
    </div>
  );
}