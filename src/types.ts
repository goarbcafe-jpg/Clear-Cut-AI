export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  verified: boolean;
  provider: 'email' | 'google';
}

export interface AnalysisData {
  subject: string;
  confidence: number;
  category: string;
  dominantColors: string[];
  suggestedBackgrounds: string[];
  boundingBox?: [number, number, number, number];
}

export interface BackgroundConfig {
  type: 'transparent' | 'solid' | 'gradient' | 'studio' | 'blur' | 'custom';
  color: string;
  gradient: string;
  backdropUrl?: string;
  blurAmount: number;
}

export interface EffectsConfig {
  shadow: {
    enabled: boolean;
    type: 'drop' | 'contact' | 'cast';
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
    color: string;
  };
  outline: {
    enabled: boolean;
    width: number;
    color: string;
  };
  reflection: {
    enabled: boolean;
    opacity: number;
    distance: number;
  };
  colorAdjustments: {
    brightness: number; // 0.5 to 1.5, default 1
    contrast: number; // 0.5 to 1.5, default 1
    saturation: number; // 0 to 2, default 1
    colorHarmonize: boolean;
  };
  edgeChoke: number; // 0 to 5px - eliminates any outline / halo from original background
  feather: number;
  decontaminate: number;
  invert: boolean;
  autoCropPadding: number; // 0 = original aspect, 5 = tight subject crop with 5% padding, etc.
}

export interface ExportConfig {
  format: 'png' | 'webp' | 'jpeg' | 'svg';
  quality: number;
  scale: number;
  dimensionPreset: 'original' | 'instagram-post' | 'instagram-story' | 'youtube-thumb' | 'square' | 'passport';
}

export interface ImageItem {
  id: string;
  name: string;
  file?: File;
  originalUrl: string;
  processedUrl?: string;
  maskDataUrl?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  progressText?: string;
  engineUsed?: 'neural_deep_learning' | 'smart_contour_matte';
  width: number;
  height: number;
  analysis?: AnalysisData;
  error?: string;
}

export interface HistoryItem {
  id: string;
  name: string;
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  backgroundType: string;
  format: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: string;
  syncedAt?: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  isConnected: boolean;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export type MainNavTab = 'home' | 'editor' | 'ai-studio' | 'projects' | 'profile' | 'batch';

export type AIStudioTab = 'bg-generator' | 'product' | 'enhancement' | 'object-removal' | 'passport';

export interface Project {
  id: string;
  name: string;
  originalUrl: string;
  processedUrl: string;
  maskDataUrl?: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  backgroundConfig?: BackgroundConfig;
  effectsConfig?: EffectsConfig;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  processedCount: number;
  exportCount: number;
  storageMb: number;
  plan: 'free' | 'starter' | 'pro' | 'business';
  memberSince: string;
}

