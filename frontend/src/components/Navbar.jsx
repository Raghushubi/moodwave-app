import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const adminToken = localStorage.getItem("admin_token");

  const handleLogout = () => {
    // Stop any ongoing webcam streams globally
    const videoElements = document.querySelectorAll("video");
    videoElements.forEach((video) => {
      if (video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => {
          console.log("Stopping track on logout:", track.label);
          track.stop();
        });
        video.srcObject = null;
      }
    });

    // Extra cleanup for good measure
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: false, video: false });
      }
    } catch {}

    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <h1
        onClick={() => navigate("/")}
        className="text-2xl font-bold cursor-pointer hover:text-yellow-300 transition-colors duration-200"
      >
        MoodWave
      </h1>

      <div className="flex gap-6 items-center text-base">

        {/* ---------------------- ADMIN VIEW ---------------------- */}
        {adminToken ? (
          <>
            <Link
              to="/admin"
              className="hover:text-yellow-300 transition-colors"
            >
              Admin Panel
            </Link>

            <button
              onClick={handleAdminLogout}
              className="bg-red-500 px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors font-medium shadow"
            >
              Admin Logout
            </button>
          </>
        ) : null}

        {/* ---------------------- NORMAL USER VIEW ---------------------- */}
        {!adminToken && userId ? (
          <>
            <Link
              to="/friends"
              className="hover:text-yellow-300 transition-colors"
            >
              Friends
            </Link>
            <Link
              to="/analytics"
              className="hover:text-yellow-300 transition-colors"
            >
              Analytics
            </Link>
            <Link
              to="/mood-logs"
              className="hover:text-yellow-300 transition-colors"
            >
              Mood Logs
            </Link>
            <Link
              to="/playlists"
              className="hover:text-yellow-300 transition-colors"
            >
              Playlists
            </Link>
            <Link
              to="/liked"
              className="hover:text-yellow-300 transition-colors"
            >
              Liked Songs
            </Link>
            <Link
              to="/profile"
              className="hover:text-yellow-300 transition-colors"
            >
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors font-medium shadow"
            >
              Logout
            </button>
          </>
        ) : null}

        {/* ---------------------- LOGGED-OUT VIEW ---------------------- */}
        {!adminToken && !userId ? (
          <>
            <Link
              to="/login"
              className="hover:text-yellow-300 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors font-semibold shadow"
            >
              Sign Up
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
