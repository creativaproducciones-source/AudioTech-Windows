const DB_NAME = 'reproductor-audio';
const STORE_NAME = 'tracks';

export const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('IndexedDB unavailable'));
});

export function withStore(mode, callback) {
  return dbPromise.then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const result = callback(store);

      tx.oncomplete = () => resolve(result?.result ?? result);
      tx.onerror = () => reject(tx.error || new Error('Storage transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted'));
    });
  });
}

export async function persistTrack(track) {
  if (typeof track.id !== 'number') return null;

  const { url, coverUrl, ...data } = track;

  try {
    await withStore('readwrite', (store) => store.put(data));
    return track.id;
  } catch (error) {
    console.warn('[storage] unable to persist track', error);
    return null;
  }
}

export async function addTrack(track) {
  try {
    const id = await withStore('readwrite', (store) => store.add(track));
    return id;
  } catch (error) {
    console.warn('[storage] unable to add track', error);
    return null;
  }
}

export async function getAllTracks() {
  try {
    return await withStore('readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error || new Error('Unable to fetch tracks'));
      });
    });
  } catch (error) {
    console.warn('[storage] unable to load tracks', error);
    return [];
  }
}

export function toPersistable(track) {
  const { url, coverUrl, ...data } = track;
  return data;
}
