import { useEffect, useState } from "react";
import API from "../utils/api";

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [renameActive, setRenameActive] = useState(null); // playlist ID
  const [renameValue, setRenameValue] = useState("");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setMessage("Please log in to view saved playlists.");
      setLoading(false);
      return;
    }

    fetchPlaylists();
  }, [userId]);

  const fetchPlaylists = () => {
    API.get(`/playlists/${userId}`)
      .then((res) => {
        setPlaylists(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading playlists:", err);
        setMessage("Failed to load playlists.");
        setLoading(false);
      });
  };

  const handleRename = async () => {
    if (!renameValue.trim()) return;

    try {
      const res = await API.put(`/playlists/rename/${renameActive}`, {
        name: renameValue,
      });

      // Update UI without refetch
      setPlaylists((prev) =>
        prev.map((pl) => (pl._id === renameActive ? res.data : pl))
      );

      setRenameActive(null);
      setRenameValue("");
    } catch (err) {
      console.error("Rename error:", err);
      alert("Failed to rename playlist.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;

    try {
      await API.delete(`/playlists/delete/${id}`);

      setPlaylists((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete playlist.");
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading playlists...</div>;
  if (message) return <div className="p-6 text-center text-gray-500">{message}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 relative">
      {/* RENAME MODAL */}
      {renameActive && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96">
            <h2 className="text-xl font-semibold text-blue-700 mb-3">Rename Playlist</h2>

            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 mb-4"
              placeholder="Enter new name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRenameActive(null);
                  setRenameValue("");
                }}
                className="px-4 py-2 rounded-lg border text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN UI */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-8">Your Saved Playlists</h1>

        {playlists.length === 0 ? (
          <p className="text-gray-500">No playlists saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((pl) => {
              const displayMoods =
                pl.moods?.length > 0
                  ? `Moods: ${pl.moods.join(", ")}`
                  : "Moods: Unspecified";

              return (
                <div
                  key={pl._id}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 relative"
                >
                  {/* ACTION BUTTONS */}
                  <div className="absolute top-3 right-3 flex gap-3">
                    <button
                      onClick={() => {
                        setRenameActive(pl._id);
                        setRenameValue(pl.name);
                      }}
                      className="text-blue-600 font-bold text-xl hover:text-blue-800"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(pl._id)}
                      className="text-red-600 font-bold text-xl hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>

                  <h2 className="text-xl font-semibold text-blue-700 mb-2">{pl.name}</h2>
                  <p className="text-sm text-gray-600 mb-4">{displayMoods}</p>

                  <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-2">
                    {pl.songs?.length > 0 ? (
                      <ul className="space-y-2">
                        {pl.songs.map((song, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-3 text-sm border-b border-gray-200 py-2 hover:bg-white transition rounded"
                          >
                            {song.thumbnail && (
                              <img
                                src={song.thumbnail}
                                alt="thumb"
                                width="50"
                                height="50"
                                className="rounded shadow-sm"
                              />
                            )}
                            <a
                              href={song.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 hover:underline flex-1 font-medium"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
