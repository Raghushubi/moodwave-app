// frontend/src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import API from "../utils/api";
import getAvatar from "../utils/avatar";

export default function Profile() {
  const userId = localStorage.getItem("userId");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId) return;
    API.get(`/users/${userId}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err));
  }, [userId]);

  if (!user)
    return (
      <div className="p-6 text-center text-gray-500">Loading profile...</div>
    );

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-6">
          <img
            src={getAvatar(user.name)}
            className="w-28 h-28 rounded-full shadow"
          />

          <div>
            <h1 className="text-3xl font-bold text-blue-700">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">About</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Welcome to your MoodWave profile.  
            More personalization options—bio, themes, mood stats—will come in the
            next versions of the project.
          </p>
        </div>
      </div>
    </div>
  );
}
