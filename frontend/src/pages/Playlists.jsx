import { useEffect, useState } from "react";
import API from "../utils/api";

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setMessage("⚠ Please log in to view saved playlists.");
      setLoading(false);
      return;
    }

    API.get(`/playlists/${userId}`)
      .then((res) => {
        setPlaylists(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading playlists:", err);
        setMessage("❌ Failed to load playlists.");
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading playlists...</div>;
  if (message) return <div className="p-6 text-center text-gray-500">{message}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">🎧 Your Saved Playlists</h1>

      {playlists.length === 0 ? (
        <p className="text-gray-500">No playlists saved yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((pl) => (
            <div key={pl._id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition">
              <h2 className="text-xl font-semibold text-blue-600 mb-2">{pl.name}</h2>
              <p className="text-sm text-gray-500 mb-2">
                {pl.moods?.length > 0 ? `Moods: ${pl.moods.join(", ")}` : "Custom Playlist"}
              </p>
              <div className="max-h-60 overflow-y-auto">
                {pl.songs?.length > 0 ? (
                  <ul className="space-y-1">
                    {pl.songs.map((song, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm border-b py-1">
                        {song.thumbnail && (
                          <img src={song.thumbnail} alt="thumb" width="40" height="40" className="rounded" />
                        )}
                        <a
                          href={song.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline flex-1"
                        >
                          {song.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No songs in this playlist.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
