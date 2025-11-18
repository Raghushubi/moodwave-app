// File: frontend/src/utils/avatar.js
export default function getAvatar(seed) {
  // DiceBear 'thumbs' or 'bottts' v4+ endpoints. No API key required and deterministic per seed.
  if (!seed) seed = 'user';
  const s = encodeURIComponent(String(seed));
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${s}&scale=80`;
}
