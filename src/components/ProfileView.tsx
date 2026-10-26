import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  HardDrive,
  Activity,
  Sparkles,
  Zap,
  CheckCircle2,
  Trash2,
  Download,
  Moon,
  Sun,
  Smartphone,
  Server,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Database,
  Sliders,
} from 'lucide-react';
import { ThemeMode, User, UserStats } from '../types';
import { getUserStats } from '../utils/storage';

interface ProfileViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onClearCache: () => void;
  onExportAllData: () => void;
  onOpenCloudinaryModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  theme,
  onThemeChange,
  onClearCache,
  onExportAllData,
  onOpenCloudinaryModal,
}) => {
  const [stats, setStats] = useState<UserStats>(getUserStats());
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Fetch admin metrics
  const fetchAdminMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const data = await res.json();
        setAdminMetrics(data.metrics);
      }
    } catch (e) {
      console.warn('Failed to fetch admin metrics:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (showAdminSection) {
      fetchAdminMetrics();
    }
  }, [showAdminSection]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
      {/* User Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
                }
                alt="Avatar"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow">
                PRO
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {currentUser?.name || 'AuraCut Creator'}
                </h2>
                {currentUser?.verified && (
                  <span title="Verified Account">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {currentUser?.email || 'goarbcafe@gmail.com'}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlimited Neural AI Cutouts Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentUser ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage & Platform Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Processed Images', value: `${stats.processedCount} Photos`, icon: Zap },
          { label: 'Studio Exports', value: `${stats.exportCount} Files`, icon: Download },
          { label: 'Local Vault Storage', value: `${stats.storageMb} MB`, icon: HardDrive },
          { label: 'AI Model Engine', value: 'RMBG Neural', icon: Activity },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">{item.value}</div>
              <div className="text-xs text-slate-400">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Subscription & Monetization Tier */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
              Current Plan: Pro Lifetime
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold">Full-Stack AI Creator Edition</h3>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-lg">
              Unlimited high-resolution cutouts, batch processing, AI background generation, and Cloudinary cloud sync included.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCloudinaryModal}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>Cloudinary Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* App & Theme Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Preferences & Environment
        </h3>

        {/* Theme Switching */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Appearance Theme</div>
            <div className="text-xs text-slate-400">Select your preferred interface color mode</div>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Smartphone },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    theme === t.id
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Local Storage & Cache Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Local Cache Management</div>
            <div className="text-xs text-slate-400">Clear temporary neural masks and cached bitmaps to free storage</div>
          </div>
          <button
            onClick={onClearCache}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all self-start sm:self-auto"
          >
            Clear Cache
          </button>
        </div>

        {/* Data Backup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Export All Projects Data</div>
            <div className="text-xs text-slate-400">Download a full JSON backup of all your saved projects and history</div>
          </div>
          <button
            onClick={onExportAllData}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup</span>
          </button>
        </div>
      </div>

      {/* Admin Telemetry & Health Panel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              System Health & Engine Telemetry
            </h3>
          </div>
          <button
            onClick={() => setShowAdminSection(!showAdminSection)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showAdminSection ? 'Hide Telemetry' : 'View System Metrics'}
          </button>
        </div>

        {showAdminSection && (
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {isLoadingMetrics ? (
              <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Checking server status...</span>
              </div>
            ) : adminMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Platform Health</span>
                    <div className="text-sm font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{adminMetrics.systemHealth.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Success Rate</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {adminMetrics.successRatePct}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Avg Model Latency</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {adminMetrics.avgProcessingTimeSec}s
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Active Storage</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {adminMetrics.storageUsedMb} MB
                    </div>
                  </div>
                </div>

                {/* Engine Matrix */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">Active Segmentation & AI Engines:</span>
                  <div className="space-y-1.5">
                    {adminMetrics.engines?.map((eng: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">{eng.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400">{eng.latency}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {eng.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Telemetry currently active.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
