// IndexedDB offline persistence layer (`alamin_offline_db`) for cached key-value settings, downloaded quiz bundles, and sync queue.
// IndexedDB helper for offline storage (question sets, local attempts, sync queue)
import { useState, useEffect } from "react";

const DB_NAME = "alamin_offline_db";
const DB_VERSION = 2;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
      if (!db.objectStoreNames.contains("sets")) {
        db.createObjectStore("sets", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("attempts")) {
        db.createObjectStore("attempts", { keyPath: "attempt_id" });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

export async function get(k) {
  try {
    const db = await openDB();
    return await new Promise(r => {
      const q = db.transaction("kv").objectStore("kv").get(k);
      q.onsuccess = () => r(q.result);
      q.onerror = () => r(undefined);
    });
  } catch (e) {
    return undefined;
  }
}

export async function put(k, v) {
  try {
    const db = await openDB();
    db.transaction("kv", "readwrite").objectStore("kv").put(v, k);
  } catch (e) {}
}

export function usePersist(key, init) {
  const [v, setV] = useState(init);
  useEffect(() => {
    get(key).then(x => {
      if (x !== undefined) setV(x);
    });
  }, [key]);

  const set = n => setV(p => {
    const nx = typeof n === "function" ? n(p) : n;
    put(key, nx);
    return nx;
  });

  return [v, set];
}

// Downloaded question sets management
export async function saveDownloadedSet(bundle) {
  try {
    const db = await openDB();
    const tx = db.transaction("sets", "readwrite");
    tx.objectStore("sets").put(bundle);
  } catch (e) {
    console.error("Failed to save set to IndexedDB:", e);
  }
}

export async function getDownloadedSet(id) {
  try {
    const db = await openDB();
    return await new Promise(r => {
      const q = db.transaction("sets").objectStore("sets").get(id);
      q.onsuccess = () => r(q.result);
      q.onerror = () => r(null);
    });
  } catch (e) {
    return null;
  }
}

export async function getAllDownloadedSets() {
  try {
    const db = await openDB();
    return await new Promise(r => {
      const q = db.transaction("sets").objectStore("sets").getAll();
      q.onsuccess = () => r(q.result || []);
      q.onerror = () => r([]);
    });
  } catch (e) {
    return [];
  }
}

export async function removeDownloadedSet(id) {
  try {
    const db = await openDB();
    db.transaction("sets", "readwrite").objectStore("sets").delete(id);
  } catch (e) {}
}
