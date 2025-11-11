// frontend/src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* 🌊 MoodWave title now acts as Dashboard link */}
      <h1
        onClick={() => navigate("/dashboard")}
        className="text-2xl font-bold cursor-pointer hover:text-yellow-300 transition"
      >
        🌊 MoodWave
      </h1>

      <div className="flex gap-4 items-center text-lg">
        {userId ? (
          <>
            <Link to="/friends" className="hover:underline">
              Friends
            </Link>
            <Link to="/analytics" className="hover:underline">
              Analytics
            </Link>
            <Link to="/mood-logs" className="hover:underline">
              Mood Logs
            </Link>
            <Link to="/playlists" className="hover:underline">
            Playlists
            </Link>
            <Link to="/profile" className="hover:underline">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
