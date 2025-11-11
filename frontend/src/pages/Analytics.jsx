import { useEffect, useState } from "react";
import API from "../utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Analytics() {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setMessage("⚠ Please log in to view analytics.");
      return;
    }

    API.get(`/analytics/${userId}`)
      .then((res) => {
        // Handle backend data gracefully
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Flatten combined moods like ["Happy", "Calm"] into one readable label
          const formatted = res.data.map((entry) => ({
            mood:
              Array.isArray(entry._id) && entry._id.length > 1
                ? entry._id.join(", ")
                : entry._id || "Unknown",
            count: entry.count,
          }));
          setData(formatted);
          setMessage("");
        } else {
          setMessage("📊 No mood data available yet.");
        }
      })
      .catch((err) => {
        console.error("Analytics error:", err);
        setMessage("❌ Failed to load analytics.");
      });
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">📈 Mood Analytics</h1>

      {message && (
        <p
          className={`mb-4 text-center font-medium ${
            message.startsWith("❌") ? "text-red-600" : "text-gray-700"
          }`}
        >
          {message}
        </p>
      )}

      {data.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-md">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="mood"
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name) =>
                  name === "count" ? [`${value} times`, "Logged"] : value
                }
              />
              <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
