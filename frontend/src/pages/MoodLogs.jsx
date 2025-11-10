import { useEffect, useState } from "react";
import API from "../utils/api";

export default function MoodLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setMessage("⚠ Please log in to view your mood history.");
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
        setMessage("❌ Failed to load mood history.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading mood history...</div>;
  }

  if (message) {
    return <div className="p-6 text-center text-gray-600">{message}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">🧠 Mood Log History</h1>

      {logs.length === 0 ? (
        <p className="text-gray-500">No moods logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead>
              <tr className="bg-blue-100 text-blue-700">
                <th className="py-2 px-4 text-left">Mood</th>
                <th className="py-2 px-4 text-left">Method</th>
                <th className="py-2 px-4 text-left">Confidence</th>
                <th className="py-2 px-4 text-left">Logged On</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-t hover:bg-blue-50 transition">
                  <td className="py-2 px-4">{log.mood?.name || "Unknown"}</td>
                  <td className="py-2 px-4">{log.method}</td>
                  <td className="py-2 px-4">
                    {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-2 px-4">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
