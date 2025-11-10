import { useEffect, useState } from "react";
import API from "../utils/api";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    API.get(`/users/${userId}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error("Error fetching profile:", err));
  }, []);

  if (!user) {
    return <div className="p-6 text-center text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">👤 Your Profile</h1>
      <div className="bg-white shadow-md rounded-lg p-6 inline-block text-left">
        <p className="mb-2">
          <strong>Name:</strong> {user.name}
        </p>
        <p className="mb-2">
          <strong>Email:</strong> {user.email}
        </p>
        <p className="text-sm text-gray-500">User ID: {user._id}</p>
      </div>
    </div>
  );
}
