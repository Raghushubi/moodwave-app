import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DetectMood from "./pages/DetectMood";
import Analytics from "./pages/Analytics";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/detect-mood" element={<DetectMood />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}
