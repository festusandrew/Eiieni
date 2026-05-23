/**
 * Configuration and helpers for managing the API gateway state.
 * Bridges client-side fallback mode and local backend mode seamlessly.
 */

// Retrieve backend URL from environmental variables (Vite-style)
export const BACKEND_URL = (((import.meta as any).env?.VITE_BACKEND_URL) || '').trim();

/**
 * Checks if a valid backend endpoint is configured.
 * If yes, all Gemini operations proxy to the Express server.
 * If no, the client falls back safely to direct Google GenAI SDK calls.
 */
export const isBackendConfigured = (): boolean => {
  return BACKEND_URL.length > 0;
};
