/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme:{
    extend:{
      colors:{
        happy:"#FFD93D",
        sad:"#6C63FF",
        calm:"#A2D2FF",
        angry:"#FF6B6B",
        romantic:"#FF85A1",
      },
    },
  },
  plugins: [],
};
