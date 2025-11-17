import { useState, useEffect } from "react";
import { fetchMoodImage } from "../utils/imageApi";

export default function MoodCard({ mood, isActive, onClick }) {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      const imageUrl = await fetchMoodImage(mood.name);
      if (mounted) {
        setBackgroundImage(imageUrl);
        setImageLoading(false);
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [mood.name]);

  const cardStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundColor: mood.colorCode,
      };

  return (
    <button
      onClick={() => onClick(mood)}
      className={`p-6 rounded-2xl text-white font-semibold shadow-lg flex flex-col items-center gap-3 transition-all relative overflow-hidden ${
        isActive ? "scale-110 ring-4 ring-yellow-400" : "hover:scale-105"
      }`}
      style={cardStyle}
    >
      {imageLoading && !backgroundImage && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <div className="text-4xl z-10 drop-shadow-lg">{mood.icon}</div>
      <div className="text-lg z-10 drop-shadow-lg">{mood.name}</div>
      
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      )}
    </button>
  );
}