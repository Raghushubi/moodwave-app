// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

export default function App() {
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
      </Routes>
    </Router>
  );
}
