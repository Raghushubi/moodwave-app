// frontend/src/pages/Friends.jsx
import { useEffect, useState } from "react";
import API from "../utils/api";

export default function Friends() {
  const [suggestions, setSuggestions] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    API.get(`/social/suggestions/${userId}`)
      .then((res) => setSuggestions(res.data))
      .catch((err) => console.error("Error loading suggestions:", err));
  }, [userId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        👥 People You Might Connect With
      </h1>

      {!userId && (
        <p className="text-gray-600 mb-4">
          Please log in to view friend suggestions.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.length > 0 ? (
          suggestions.map((s, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {s.user.name}
              </h2>
              <p className="text-sm text-gray-600">{s.user.email}</p>
              <p className="mt-2 text-sm">
                Match: <b>{s.score}%</b>
              </p>
              <button className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                Connect
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No suggestions yet.</p>
        )}
      </div>
    </div>
  );
}
