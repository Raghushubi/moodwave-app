# 🌊 MoodWave – Personalized Mood-Based Music Companion Platform

MoodWave is a full-stack emotion-aware web application that detects a user's mood (via webcam or manual selection) and generates personalized music playlists accordingly. It integrates AI-based emotion detection, RESTful APIs, and dynamic YouTube playlist generation to enhance mental well-being through music.

## 📁 Repository Overview

This repository contains the **complete source code** for both backend (Node.js + Express + MongoDB) and frontend (React.js + Tailwind CSS) components of the MoodWave application.

## 🧠 Key Features

- 🎭 AI-based webcam mood detection and manual mood selection
- 🎧 Real-time YouTube music recommendations based on detected moods
- 💾 User playlists with save and retrieval features
- 📊 Mood analytics with charts
- 🧾 Mood logging for emotional tracking
- 🤝 Social matching suggestions (beta)

## ⚙️ Instructions to Run the Software

### 1. Clone the Repository

```bash
git clone https://github.com/Raghushubi/moodwave-app.git
cd moodwave-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `/backend`:

```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_secret_key>
YOUTUBE_API_KEY=<your_youtube_api_key>
```

Run the backend:

```bash
npm start
```

Backend runs on **http://localhost:5000**

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

### 4. Access the Application

1. Open your browser → `http://localhost:5173`
2. Register or login
3. Detect mood via webcam or manual selection
4. View mood-based playlists, analytics, and saved mood logs

## 🧰 Prerequisites & Dependencies

### Languages & Frameworks

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)

### Important Libraries

| Library | Purpose |
|---------|---------|
| **axios** | API calls |
| **mongoose** | MongoDB ORM |
| **jsonwebtoken** | Authentication |
| **bcryptjs** | Password encryption |
| **dotenv** | Environment variables |
| **recharts** | Analytics visualization |
| **cors** | CORS handling |
| **react-router-dom** | Routing |
| **Tailwind CSS** | Styling framework |

### APIs Used

- **YouTube Data API v3** – For fetching songs and playlists dynamically
- **Custom REST API** – For mood detection, playlist saving, analytics, and logs

## 🧪 Testing the Application

1. Start backend (`npm start`) inside `/backend`
2. Start frontend (`npm run dev`) inside `/frontend`
3. Test key endpoints:
   - `GET /api/moods`
   - `POST /api/moods/log`
   - `GET /api/music/:moodId`
   - `GET /api/music/combined?moods=Happy,Sad`
   - `GET /api/playlists/:userId`
4. Check MongoDB to ensure mood logs and playlists are stored

## 👥 Team Members

| Name | Role |
|------|------|
| Raghu Shubhangi | Authentication & System Integration |
| Varun Chaitanya | Music Feedback & Recommendation System |
| Nandana Renjith | AI Mood Detection Refinement |
| Greeshmitha Sai | Analytics & Social Matching |

## 🧩 Version Information

| Component | Version |
|-----------|---------|
| Node.js | v20.x |
| npm | v10.x |
| React | v18.x |
| MongoDB | v7.x |
| Tailwind CSS | v3.x |

## 🧠 Architecture Summary

- **Frontend:** React-based SPA (Single Page Application)
- **Backend:** RESTful Express API
- **Database:** MongoDB with Mongoose
- **Integration:** YouTube Data API + AI mood detection utilities
- **Authentication:** JWT-based

## 🧩 Additional Notes

- MoodWave follows **MVC architecture** for maintainability
- Fallback playlists are generated when YouTube API quota is exceeded
- Each mood log and playlist is associated with a user via MongoDB references
- Combined mood playlists are generated dynamically through backend aggregation

---

## 📄 License

This project is part of an academic submission. All rights reserved.
