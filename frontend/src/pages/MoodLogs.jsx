import { useEffect, useState } from "react";
import API from "../utils/api";

export default function MoodLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setError("Please log in to view mood logs");
      setLoading(false);
      return;
    }

    API.get(`/moods/user/${userId}/history`) 
      .then((res) => {
        setLogs(res.data);
        setError("");
      })
      .catch((err) => {
        console.error("Fetch mood history error:", err);
        setError("Failed to load mood history.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading mood history...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-8 text-center">
          📝 Mood History
        </h1>

        {logs.length === 0 ? (
          <p className="text-center text-gray-500">No mood logs yet. Start tracking your moods!</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log._id} className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    {/* Single Mood */}
                    {log.mood && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{log.mood.icon}</span>
                        <span className="font-semibold text-lg">{log.mood.name}</span>
                      </div>
                    )}

                    {/* Combined Moods */}
                    {log.moods && log.moods.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.moods.map((m, idx) => (
                          <span key={idx} className="flex items-center gap-1">
                            <span className="text-2xl">{m.icon}</span>
                            <span className="font-semibold">{m.name}</span>
                            {idx < log.moods.length - 1 && <span className="text-gray-400">+</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      Method: {log.method} | {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
