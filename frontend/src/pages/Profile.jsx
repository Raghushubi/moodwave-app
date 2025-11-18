// File: frontend/src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import getAvatar from '../utils/avatar';

export default function Profile() {
  const [user, setUser] = useState(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    API.get(`/users/${userId}`).then((res) => { if (mounted) setUser(res.data); }).catch((err) => console.error(err));
    return () => { mounted = false; };
  }, [userId]);

  if (!user) return <div className="p-6 text-center text-gray-600">Loading profile...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow flex gap-6 items-center">
        <img src={getAvatar(user.name)} alt="avatar" className="w-28 h-28 rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="mt-3 text-xs text-gray-400">User ID: {user._id}</div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="text-sm text-gray-500">Mood Logs</div>
              <div className="font-semibold">—</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="text-sm text-gray-500">Playlists</div>
              <div className="font-semibold">—</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="text-sm text-gray-500">Friends</div>
              <div className="font-semibold">—</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">About</h3>
        <p className="text-sm text-gray-600">This is your MoodWave profile. Add a bio and more details on the profile edit page later.</p>
      </div>
    </div>
  );
}

