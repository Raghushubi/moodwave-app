import { useEffect, useState } from "react";
import API from "../utils/api";

export default function MoodLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setMessage("Please log in to view your mood history.");
      setLoading(false);
      return;
    }

    API.get(`/moods/user/${userId}/history`)
      .then((res) => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching mood logs:", err);
        setMessage("Failed to load mood history.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading mood history...
      </div>
    );
  }

  if (message) {
    return <div className="p-6 text-center text-gray-600">{message}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Your Mood History
        </h1>

        {logs.length === 0 ? (
          <p className="text-gray-500">No moods logged yet.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-xl">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                  <th className="py-3 px-6 text-left font-semibold">Mood(s)</th>
                  <th className="py-3 px-6 text-left font-semibold">Method</th>
                  <th className="py-3 px-6 text-left font-semibold">Confidence</th>
                  <th className="py-3 px-6 text-left font-semibold">Logged On</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log, i) => {
                const moodList = [];

                // Handle single mood logs
                if (log.mood) {
                  moodList.push(log.mood);
                }

                // Handle combined moods (array)
                if (log.moods && Array.isArray(log.moods)) {
                  moodList.push(...log.moods);
                }

                  return (
                    <tr
                      key={i}
                      className="border-t border-gray-100 hover:bg-blue-50 transition"
                    >
                      <td className="py-3 px-6">
                        {moodList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {moodList.map((m, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-lg text-sm font-medium shadow-sm"
                                style={{
                                  backgroundColor: m.colorCode || "#eee",
                                  color: "#fff",
                                }}
                              >
                                {m.icon} {m.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Unknown</span>
                        )}
                      </td>

                      <td className="py-3 px-6 text-gray-700">{log.method || "—"}</td>
                      <td className="py-3 px-6 text-gray-700">
                        {log.confidence
                          ? `${(log.confidence * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="py-3 px-6 text-gray-600 text-sm">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
