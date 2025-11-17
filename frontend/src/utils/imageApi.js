// frontend/src/utils/imageApi.js
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_IMAGE_API_KEY;
const CACHE_PREFIX = "unsplash_mood_";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_DELAY_MS = 100;

/**
 * A small set of custom queries for moods that often return poor or empty Unsplash results.
 * Add more mood-specific queries here as you see fit.
 */
const SPECIAL_QUERIES = {
  Angry: "dramatic red abstract texture",
  Anxious: "soft foggy landscape calming",
  Sad: "moody rainy cityscape",
  Happy: "bright joyful portrait",
  Calm: "peaceful nature landscape",
  Energetic: "dynamic neon lights abstract",
  Romantic: "soft warm couple silhouette",
  Peaceful: "serene lake sunrise",
};

/**
 * Try to fetch a mood image from Unsplash using /photos/random, then fallback to /search/photos.
 * Returns the final image URL string or null on failure.
 */
export async function fetchMoodImage(moodName) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("Unsplash API key not found (VITE_IMAGE_API_KEY). Mood images disabled.");
    return null;
  }

  const key = `${CACHE_PREFIX}${String(moodName).toLowerCase()}`;
  const cached = getCachedImage(key);
  if (cached) {
    // console.debug(`Using cached image for ${moodName}`);
    return cached;
  }

  // Build query: prefer special query for known problematic moods
  const baseQuery = SPECIAL_QUERIES[moodName] || `${moodName} aesthetic mood`;
  const queriesToTry = [baseQuery, `${moodName} aesthetic`, `${moodName} mood`, `${moodName} background`];

  // Try /photos/random first (quieter endpoint), then fallback to search if needed
  try {
    // attempt random with first query
    for (const q of queriesToTry) {
      const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=landscape&content_filter=high`;
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        });

        if (!res.ok) {
          // If rate-limited or no results, continue to next query
          // 404 or 204 may mean no results for this query
          // console.warn(`Unsplash random failed for "${q}": ${res.status}`);
          continue;
        }

        const data = await res.json();
        const imageUrl = data?.urls?.regular || data?.urls?.small || null;
        if (imageUrl) {
          setCachedImage(key, imageUrl);
          // console.debug(`Fetched Unsplash random image for ${moodName} (query="${q}")`);
          return imageUrl;
        }
      } catch (err) {
        // network or parse error - try next query
        // console.error("Unsplash random request error", err);
        continue;
      }
    }

    // If random didn't work, try search endpoint (safer to get first result)
    for (const q of queriesToTry) {
      const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&orientation=landscape&per_page=1&content_filter=high`;
      try {
        const res = await fetch(searchUrl, {
          headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        });

        if (!res.ok) {
          // console.warn(`Unsplash search failed for "${q}": ${res.status}`);
          continue;
        }

        const data = await res.json();
        const first = Array.isArray(data.results) && data.results[0];
        const imageUrl = first?.urls?.regular || first?.urls?.small || null;
        if (imageUrl) {
          setCachedImage(key, imageUrl);
          // console.debug(`Fetched Unsplash search image for ${moodName} (query="${q}")`);
          return imageUrl;
        }
      } catch (err) {
        // console.error("Unsplash search request error", err);
        continue;
      }
    }

    // No image found from any query
    // console.info(`No Unsplash image found for mood "${moodName}"`);
    return null;
  } catch (error) {
    console.error(`fetchMoodImage unexpected error for ${moodName}:`, error);
    return null;
  }
}

/**
 * Batch fetch images for multiple moods with a tiny delay between calls to be polite to the API.
 * Returns an object mapping moodName -> imageUrl (or null).
 */
export async function fetchMoodImages(moodNames = []) {
  const results = {};
  for (const moodName of moodNames) {
    try {
      results[moodName] = await fetchMoodImage(moodName);
    } catch (err) {
      results[moodName] = null;
    }
    // small delay to avoid hammering API
    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
  }
  return results;
}

/* ---------- Cache helpers ---------- */

function getCachedImage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.url || !parsed?.timestamp) return null;
    const expired = Date.now() - parsed.timestamp > CACHE_DURATION;
    if (expired) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.url;
  } catch (err) {
    // console.error("getCachedImage parse error", err);
    return null;
  }
}

function setCachedImage(key, url) {
  try {
    const payload = { url, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    // console.error("setCachedImage error", err);
  }
}

/**
 * Clear mood image cache (for debugging / dev).
 */
export function clearMoodImageCache() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    });
    // console.info("Mood image cache cleared");
  } catch (err) {
    console.error("clearMoodImageCache error", err);
  }
}
