export const SETTINGS_KEY = 'reproductor-ajustes';
export const PLAYLISTS_KEY = 'reproductor-listas';

export const DEFAULT_SETTINGS = Object.freeze({
  volume: 80,
  shuffle: false,
  repeat: 'off',
  eq: Array(10).fill(0),
  preset: 'Plano',
  skin: 'classic',
  lastId: null,
  pos: 0,
  queue: [],
  countdown: false,
  pan: 0,
  vizMode: 'bars',
  hidden: { eq: false, list: false },
  qfilter: 'all'
});

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`[state] unable to read ${key}`, error);
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[state] unable to write ${key}`, error);
  }
}

export function loadSettings() {
  const saved = readJSON(SETTINGS_KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    hidden: { ...DEFAULT_SETTINGS.hidden, ...(saved.hidden || {}) }
  };
}

export function saveSettings(settings) {
  writeJSON(SETTINGS_KEY, settings);
}

export function loadPlaylists() {
  return readJSON(PLAYLISTS_KEY, {});
}

export function savePlaylists(playlists) {
  writeJSON(PLAYLISTS_KEY, playlists);
}
