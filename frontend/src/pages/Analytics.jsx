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
  const [single, setSingle] = useState([]);
  const [multi, setMulti] = useState([]);
  const [view, setView] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setMessage("⚠ Please log in to view analytics.");
      setLoading(false);
      return;
    }

    setLoading(true);
    API.get(`/analytics/${userId}`)
      .then((res) => {
        setSingle(res.data.single || []);
        setMulti(res.data.multi || []);
        setMessage("");
      })
      .catch((err) => {
        console.error("Analytics fetch error:", err);
        setMessage("❌ Failed to load analytics.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Unified data for chart based on selected view
  const getData = () => {
    if (view === "single") {
      return single.map((s) => ({
        mood: s.mood,
        count: s.count,
      }));
    }

    if (view === "multi") {
      return multi.map((m) => ({
        mood: m.moods.join(" + "),
        count: m.count,
      }));
    }

    // ALL view: combine single + multi
    return [
      ...single.map((s) => ({
        mood: s.mood,
        count: s.count,
      })),
      ...multi.map((m) => ({
        mood: m.moods.join(" + "),
        count: m.count,
      })),
    ];
  };

  const data = getData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-2 text-center">
          📊 Mood Analytics
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          A breakdown of your emotional patterns over time
        </p>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setView("all")}
            className={`px-5 py-2 rounded-xl shadow-md font-semibold transition ${
              view === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
            }`}
          >
            All Moods
          </button>

          <button
            onClick={() => setView("single")}
            className={`px-5 py-2 rounded-xl shadow-md font-semibold transition ${
              view === "single"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
            }`}
          >
            Single Moods
          </button>

          <button
            onClick={() => setView("multi")}
            className={`px-5 py-2 rounded-xl shadow-md font-semibold transition ${
              view === "multi"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
            }`}
          >
            Combined Moods
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <p className="text-gray-600 text-sm mb-1">Unique Single Moods</p>
            <p className="text-3xl font-bold text-blue-600">{single.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <p className="text-gray-600 text-sm mb-1">Unique Combinations</p>
            <p className="text-3xl font-bold text-purple-600">{multi.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <p className="text-gray-600 text-sm mb-1">Total Entries</p>
            <p className="text-3xl font-bold text-green-600">
              {single.reduce((sum, s) => sum + s.count, 0) + 
               multi.reduce((sum, m) => sum + m.count, 0)}
            </p>
          </div>
        </div>

        {/* Error/Loading Messages */}
        {message && (
          <div className="text-center mb-4 p-3 bg-red-100 border border-red-300 rounded-xl">
            <p className="text-red-600 font-medium">{message}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading analytics...</p>
          </div>
        )}

        {/* Bar Chart */}
        {!loading && data.length > 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {view === "all" && "All Mood Data"}
              {view === "single" && "Individual Mood Frequency"}
              {view === "multi" && "Combination Frequency"}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="mood"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  allowDecimals={false}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} times`, "Logged"]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={view === "multi" ? "#8B5CF6" : "#4F46E5"}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : !loading && data.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-xl text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg mb-2">
              No analytics data available yet
            </p>
            <p className="text-gray-400 text-sm">
              Start logging your moods to see insights here!
            </p>
          </div>
        ) : null}

        {/* Detailed Tables */}
        {!loading && data.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Single Moods Table */}
            {(view === "all" || view === "single") && single.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  📋 Single Mood Details
                </h3>
                <div className="overflow-auto max-h-96">
                  <table className="w-full text-left">
                    <thead className="bg-blue-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-blue-700">Mood</th>
                        <th className="px-4 py-2 text-blue-700 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {single.map((s, idx) => (
                        <tr key={idx} className="border-b hover:bg-blue-50 transition">
                          <td className="px-4 py-2 font-medium">{s.mood}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{s.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Combined Moods Table */}
            {(view === "all" || view === "multi") && multi.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  🎭 Combined Mood Details
                </h3>
                <div className="overflow-auto max-h-96">
                  <table className="w-full text-left">
                    <thead className="bg-purple-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-purple-700">Combination</th>
                        <th className="px-4 py-2 text-purple-700 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multi.map((m, idx) => (
                        <tr key={idx} className="border-b hover:bg-purple-50 transition">
                          <td className="px-4 py-2 font-medium">
                            {m.moods.join(" + ")}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-600">{m.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}