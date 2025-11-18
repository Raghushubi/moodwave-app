// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import DetectMood from "./pages/DetectMood";
import Friends from "./pages/Friends";
import Analytics from "./pages/Analytics";
import Playlists from "./pages/Playlists";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MoodLogs from "./pages/MoodLogs";
import LikedSongs from "./pages/LikedSongs";
import Admin from "./pages/Admin";

export default function App() {

  // 🔥 CLEAR ALL LOGIN STATES WHEN FRONTEND LOADS (your requirement)
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("admin_token");
  }, []);

  // 🔥 Cleanup webcam streams globally when navigating away or closing tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      const videoElements = document.querySelectorAll("video");
      videoElements.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject;
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/detect-mood" element={<DetectMood />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mood-logs" element={<MoodLogs />} />
        <Route path="/liked" element={<LikedSongs />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
