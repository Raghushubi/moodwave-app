# MoodWave Frontend - Setup Guide

## Overview
This is the complete, production-ready frontend for MoodWave built with React, Vite, and Tailwind CSS.

## Prerequisites
- Node.js v20.x or higher
- npm v10.x or higher
- Backend server running on `http://localhost:5000`

## Installation

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE=http://localhost:5000/api
VITE_IMAGE_API_KEY=your_unsplash_or_pexels_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** The frontend will work without these API keys. They are optional for enhanced features:
- `VITE_IMAGE_API_KEY` - For mood-based background images (Unsplash/Pexels)
- `VITE_GEMINI_API_KEY` - For AI-enhanced song recommendations (future feature)

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## Features Implemented

### Core Functionality
- **Dashboard** - Landing page with mood selection (single & multi-mode)
- **Webcam Detection** - AI-based mood detection using face-api.js
- **Music Recommendations** - YouTube-based playlists per mood
- **Combined Playlists** - Multi-mood playlist generation
- **Playlist Saving** - Save and view playlists
- **Mood Logs** - Track mood history with timestamps
- **Analytics** - Visualize mood patterns with charts

### Key Fixes Applied
1. **Playlist Saving** - Fixed mood tracking to save correct moods (not "Custom")
2. **Combined Moods** - Proper handling of multi-mood logs in backend
3. **Webcam Cleanup** - Camera properly stops when navigating away
4. **MoodLogs Display** - Handles both single and combined mood entries
5. **Opposites Logic** - Prevents selecting conflicting moods

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx          # Top navigation
│   ├── pages/
│   │   ├── Dashboard.jsx        # Main landing page
│   │   ├── DetectMood.jsx       # Webcam detection
│   │   ├── MoodLogs.jsx         # Mood history table
│   │   ├── Playlists.jsx        # Saved playlists
│   │   ├── Analytics.jsx        # Mood analytics charts
│   │   ├── Friends.jsx          # Social matching (beta)
│   │   ├── Profile.jsx          # User profile
│   │   ├── Login.jsx            # Login page
│   │   └── Register.jsx         # Registration page
│   ├── utils/
│   │   ├── api.js               # Axios instance with interceptors
│   │   └── moodDetection.js     # Face-api.js mood detection
│   ├── App.jsx                  # Router configuration
│   └── main.jsx                 # App entry point
├── public/
│   └── models/                  # Face-api.js models
├── .env.example                 # Environment template
└── package.json
```

## Backend API Endpoints Used

The frontend connects to these backend endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Moods
- `GET /api/moods` - Fetch all moods
- `POST /api/moods/log` - Log single or combined moods
- `GET /api/moods/user/:userId/history` - Get mood history

### Music
- `GET /api/music/:moodId` - Songs for single mood
- `GET /api/music/combined?moods=A,B` - Combined playlist
- `POST /api/music/feedback` - Like/dislike feedback

### Playlists
- `POST /api/playlists/save` - Save playlist
- `GET /api/playlists/:userId` - Get user playlists

### Analytics
- `GET /api/analytics/:userId` - Aggregated mood data

### Users
- `GET /api/users/:userId` - User profile

## Mood Mapping

### Database Moods
- Happy, Sad, Calm, Energetic, Romantic, Angry, Anxious, Peaceful

### Face-API Detection Mapping
```javascript
{
  happy: "Happy",
  sad: "Sad",
  angry: "Angry",
  neutral: "Calm",
  surprised: "Energetic",
  disgusted: "Angry",
  fearful: "Anxious"
}
```

### Opposites (Auto-Unselect in Multi-Mode)
```javascript
{
  Happy: ["Sad", "Angry"],
  Sad: ["Happy", "Energetic"],
  Angry: ["Calm", "Peaceful"],
  Calm: ["Angry", "Anxious"],
  Energetic: ["Peaceful", "Sad"],
  Peaceful: ["Energetic", "Angry"],
  Romantic: ["Anxious"],
  Anxious: ["Romantic", "Calm"]
}
```

## Troubleshooting

### Port Already in Use
If port 5173 is busy:
```bash
PORT=3000 npm run dev
```

### Backend Connection Failed
Ensure backend is running on port 5000:
```bash
cd ../backend
npm start
```

### Face-API Models Not Loading
Models should be in `public/models/`. Check console for loading errors.

### CORS Errors
Backend must have CORS enabled for `http://localhost:5173`

## Design Philosophy

- **Modern & Clean** - Gradient backgrounds, smooth transitions
- **Accessible** - High contrast, readable fonts, clear labels
- **Responsive** - Works on mobile, tablet, and desktop
- **User-Friendly** - Guest preview, clear error messages
- **Performance** - Lazy loading, optimized images

## Next Steps

1. Test all features with backend running
2. Deploy to production (Vercel/Netlify for frontend)
3. Add environment-specific API base URLs
4. Enable analytics tracking
5. Implement AI song recommendations (Gemini integration)

## License
MIT License - See LICENSE file for details
