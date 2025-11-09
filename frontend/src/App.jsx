import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DetectMood from "./pages/DetectMood";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DetectMood />} />
      </Routes>
    </Router>
  );
}

export default App;
