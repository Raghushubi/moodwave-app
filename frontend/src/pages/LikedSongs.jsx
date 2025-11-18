// frontend/src/pages/LikedSongs.jsx
import { useEffect, useState } from "react";
import API from "../utils/api";
import { FaTrash } from "react-icons/fa";

export default function LikedSongs() {
  const userId = localStorage.getItem("userId");
  const [songs, setSongs] = useState([]);

  const loadSongs = async () => {
    if (!userId) return;
    const { data } = await API.get(`/liked/${userId}`);
    setSongs(data);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const remove = async (youtubeId) => {
    await API.delete(`/liked/${userId}/${youtubeId}`);
    setSongs((prev) => prev.filter((s) => s.youtubeId !== youtubeId));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">❤️ Liked Songs</h1>

      {songs.length === 0 && (
        <p className="text-gray-600 text-lg">No liked songs yet.</p>
      )}

      {songs.map((s) => (
        <div
          key={s.youtubeId}
          className="flex items-center gap-4 border-b py-3 hover:bg-blue-50 rounded-lg px-2"
        >
          <img
            src={s.thumbnail}
            className="w-20 h-20 rounded-lg object-cover shadow-sm"
          />

          <div className="flex-1">
            <a
              href={s.url}
              target="_blank"
              className="text-lg text-blue-700 hover:underline"
            >
              {s.title}
            </a>
            <p className="text-sm text-gray-500">{s.channelTitle}</p>
          </div>

          <button
            onClick={() => remove(s.youtubeId)}
            className="text-red-600 hover:text-red-800 text-xl hover:scale-110 transition"
          >
            <FaTrash />
          </button>
        </div>
      ))}
    </div>
  );
}
