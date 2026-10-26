import { CloudinaryConfig, HistoryItem, Project, ThemeMode, User, UserStats } from '../types';

const STORAGE_KEYS = {
  USER: 'auracut_user',
  TOKEN: 'auracut_auth_token',
  HISTORY: 'auracut_history_cache',
  OFFLINE_QUEUE: 'auracut_offline_sync_queue',
  THEME: 'auracut_theme',
  CLOUDINARY: 'auracut_cloudinary_config',
  HAS_SEEN_TUTORIAL: 'auracut_has_seen_tutorial',
  PROJECTS: 'auracut_projects_v2',
  STATS: 'auracut_user_stats',
};

// ----------------- Auth & User -----------------

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function setStoredToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } else {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }
}

// ----------------- Theme -----------------

export function getStoredTheme(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'system';
}

export function applyTheme(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEYS.THEME, mode);
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// ----------------- Cloudinary Config -----------------

export function getStoredCloudinaryConfig(): CloudinaryConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLOUDINARY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    cloudName: '',
    uploadPreset: '',
    isConnected: false,
  };
}

export function setStoredCloudinaryConfig(config: CloudinaryConfig) {
  localStorage.setItem(STORAGE_KEYS.CLOUDINARY, JSON.stringify(config));
}

// ----------------- Tutorial -----------------

export function getHasSeenTutorial(): boolean {
  return localStorage.getItem(STORAGE_KEYS.HAS_SEEN_TUTORIAL) === 'true';
}

export function setHasSeenTutorial(seen: boolean) {
  localStorage.setItem(STORAGE_KEYS.HAS_SEEN_TUTORIAL, seen ? 'true' : 'false');
}

// ----------------- Edits History & Sync -----------------

export function getLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalHistoryItem(item: HistoryItem): HistoryItem[] {
  const current = getLocalHistory();
  const updated = [item, ...current.filter((i) => i.id !== item.id)].slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    // If quota exceeded, trim
    const trimmed = updated.slice(0, 20);
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    } catch {}
  }
  return updated;
}

export function deleteLocalHistoryItem(id: string): HistoryItem[] {
  const current = getLocalHistory();
  const updated = current.filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  return updated;
}

// Queue for offline items to be synced once online
export function queueOfflineItem(item: HistoryItem) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    const queue: HistoryItem[] = raw ? JSON.parse(raw) : [];
    queue.push(item);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch {}
}

export function getOfflineQueue(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
}

// ----------------- Instant Sample Images -----------------

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-portrait',
    name: 'Fashion Portrait',
    category: 'Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    description: 'Fine hair strands & soft lighting',
  },
  {
    id: 'sample-sneaker',
    name: 'Air Sport Sneaker',
    category: 'E-commerce',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    description: 'Crisp product contours',
  },
  {
    id: 'sample-puppy',
    name: 'Golden Puppy',
    category: 'Pet & Fur',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
    description: 'Soft fur and complex edges',
  },
  {
    id: 'sample-car',
    name: 'Vintage Red Porsche',
    category: 'Automotive',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    description: 'Reflective body & windshield',
  },
];

// ----------------- Projects Management -----------------

export function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalProject(project: Project): Project[] {
  const current = getLocalProjects();
  const existingIdx = current.findIndex((p) => p.id === project.id);
  let updated: Project[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current];
  }
  // Store up to 40 projects
  const limited = updated.slice(0, 40);
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(limited));
  } catch (err) {
    // If storage quota exceeded, store without large mask or trim
    const lightweight = limited.map((p) => ({
      ...p,
      maskDataUrl: undefined,
    }));
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(lightweight.slice(0, 20)));
    } catch {}
  }
  return limited;
}

export function deleteLocalProject(id: string): Project[] {
  const current = getLocalProjects();
  const updated = current.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
  return updated;
}

// ----------------- User Stats & Metrics -----------------

export function getUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    processedCount: 14,
    exportCount: 8,
    storageMb: 12.4,
    plan: 'pro',
    memberSince: 'March 2026',
  };
}

export function recordProcessAction(): void {
  const stats = getUserStats();
  stats.processedCount += 1;
  stats.storageMb = Number((stats.storageMb + 0.8).toFixed(1));
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {}
}

export function recordExportAction(): void {
  const stats = getUserStats();
  stats.exportCount += 1;
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {}
}

