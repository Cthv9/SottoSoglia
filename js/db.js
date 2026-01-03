const DB_NAME = "sottosoglia_db";
const DB_VERSION = 1;
export const STORE_EXP = "expenses";
export const STORE_SET = "settings";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_EXP)) {
        const s = db.createObjectStore(STORE_EXP, { keyPath: "id" });
        s.createIndex("by-month", "monthKey", { unique: false });
        s.createIndex("by-createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SET)) {
        db.createObjectStore(STORE_SET);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(store, value, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    const req = (key !== undefined) ? os.put(value, key) : os.put(value);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function listExpensesByMonth(monthKey) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXP, "readonly");
    const idx = tx.objectStore(STORE_EXP).index("by-month");
    const req = idx.getAll(monthKey);
    req.onsuccess = () => {
      const all = req.result || [];
      all.sort((a,b) => b.createdAt - a.createdAt);
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listRecentLabels(limit = 12) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXP, "readonly");
    const req = tx.objectStore(STORE_EXP).getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      all.sort((a,b) => b.createdAt - a.createdAt);
      const uniq = [];
      for (const e of all) {
        const lbl = String(e.label || "").trim();
        if (!lbl) continue;
        if (!uniq.includes(lbl)) uniq.push(lbl);
        if (uniq.length >= limit) break;
      }
      resolve(uniq);
    };
    req.onerror = () => reject(req.error);
  });
}
