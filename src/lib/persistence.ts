import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

// Files live in $APPDATA/ — on macOS that's ~/Library/Application Support/com.anish.tubestack/.
// Friendly enough that the user can open the folder and edit JSON by hand.
const HISTORY_FILE = "history.json";
const READ_LATER_FILE = "read-later.json";

const LEGACY_HISTORY_KEY = "history";
const LEGACY_WATCH_LATER_KEY = "watchLater";
const LEGACY_MIGRATED_KEY = "storageMigratedToFs";

const fsOpts = { baseDir: BaseDirectory.AppData };
const FRESH_STORAGE = import.meta.env.VITE_TUBESTACK_FRESH === "1";
let freshStorageCleared: Promise<void> | null = null;

async function ensureAppDataDir(): Promise<void> {
  try {
    if (!(await exists("", fsOpts))) {
      await mkdir("", { ...fsOpts, recursive: true });
    }
  } catch {
    // mkdir on existing dir is non-fatal; readers/writers will surface anything real.
  }
}

async function readJSONFile<T>(path: string, fallback: T): Promise<T> {
  try {
    if (!(await exists(path, fsOpts))) return fallback;
    const raw = await readTextFile(path, fsOpts);
    if (!raw.trim()) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSONFile<T>(path: string, value: T): Promise<void> {
  await ensureAppDataDir();
  await writeTextFile(path, JSON.stringify(value, null, 2), fsOpts);
}

async function clearFreshStorage(): Promise<void> {
  if (!FRESH_STORAGE) return;
  if (!freshStorageCleared) {
    freshStorageCleared = (async () => {
      await writeJSONFile(HISTORY_FILE, []);
      await writeJSONFile(READ_LATER_FILE, []);
      try {
        localStorage.removeItem(LEGACY_HISTORY_KEY);
        localStorage.removeItem(LEGACY_WATCH_LATER_KEY);
      } catch {}
    })();
  }
  await freshStorageCleared;
}

function readLegacyArray<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

// One-time migration: copy localStorage values into JSON files, then mark done.
// We don't delete localStorage — keeps a fallback if someone rolls back.
async function migrateLegacyOnce<T>(file: string, legacyKey: string): Promise<T[] | null> {
  if (localStorage.getItem(`${LEGACY_MIGRATED_KEY}:${file}`) === "1") return null;
  const legacy = readLegacyArray<T>(legacyKey);
  if (legacy && legacy.length > 0 && !(await exists(file, fsOpts))) {
    await writeJSONFile(file, legacy);
  }
  localStorage.setItem(`${LEGACY_MIGRATED_KEY}:${file}`, "1");
  return legacy;
}

export async function loadHistory<T>(): Promise<T[]> {
  if (FRESH_STORAGE) {
    await clearFreshStorage();
    return [];
  }
  await ensureAppDataDir();
  await migrateLegacyOnce<T>(HISTORY_FILE, LEGACY_HISTORY_KEY);
  return readJSONFile<T[]>(HISTORY_FILE, []);
}

export async function saveHistory<T>(history: T[]): Promise<void> {
  if (FRESH_STORAGE) return;
  await writeJSONFile(HISTORY_FILE, history);
}

export async function loadReadLater<T>(): Promise<T[]> {
  if (FRESH_STORAGE) {
    await clearFreshStorage();
    return [];
  }
  await ensureAppDataDir();
  await migrateLegacyOnce<T>(READ_LATER_FILE, LEGACY_WATCH_LATER_KEY);
  return readJSONFile<T[]>(READ_LATER_FILE, []);
}

export async function saveReadLater<T>(items: T[]): Promise<void> {
  if (FRESH_STORAGE) return;
  await writeJSONFile(READ_LATER_FILE, items);
}

export const STORAGE_FILES = {
  history: HISTORY_FILE,
  readLater: READ_LATER_FILE,
};
