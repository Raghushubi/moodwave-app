import { useEffect, useState } from "react";
import API from "../utils/api";

function Dashboard() {
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const response = await API.get("/moods"); // this calls backend route /api/moods
        setMoods(response.data);
      } catch (error) {
        console.error("Error fetching moods:", error);
      }
    };
    fetchMoods();
  }, []);

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-happy">Mood Dashboard 🎭</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {moods.map((mood) => (
          <div
            key={mood._id}
            className="p-6 rounded-xl bg-gray-800 shadow-lg hover:scale-105 transition-transform"
          >
            <h2 className="text-2xl font-semibold text-happy">{mood.name}</h2>
            <p className="mt-2 text-gray-300">{mood.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
