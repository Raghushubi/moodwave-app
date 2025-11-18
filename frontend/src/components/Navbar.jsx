import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleLogout = () => {
    // Stop any ongoing webcam streams globally
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          console.log("Stopping track on logout:", track.label);
          track.stop();
        });
        video.srcObject = null;
      }
    });

    // Also try to stop any MediaStreamTracks that might still be running
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // This is a best-effort cleanup
      try {
        navigator.mediaDevices.getUserMedia({ audio: false, video: false });
      } catch (e) {
        // Ignore errors here
      }
    }

    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    navigate("/login");
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
        {userId ? (
          <>
            <Link to="/friends" className="hover:text-yellow-300 transition-colors">
              Friends
            </Link>
            <Link to="/analytics" className="hover:text-yellow-300 transition-colors">
              Analytics
            </Link>
            <Link to="/mood-logs" className="hover:text-yellow-300 transition-colors">
              Mood Logs
            </Link>
            <Link to="/playlists" className="hover:text-yellow-300 transition-colors">
              Playlists
            </Link>
             <Link to="/liked" className="hover:text-yellow-300 transition-colors">
              Liked Songs
            </Link>
            <Link to="/profile" className="hover:text-yellow-300 transition-colors">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors font-medium shadow"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-yellow-300 transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors font-semibold shadow">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
