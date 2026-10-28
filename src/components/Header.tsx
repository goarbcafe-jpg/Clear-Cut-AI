import React from 'react';
import {
  Sparkles,
  Layers,
  History,
  Cloud,
  Sun,
  Moon,
  Laptop,
  HelpCircle,
  Star,
  ShieldCheck,
  Wifi,
  WifiOff,
  User as UserIcon,
  LogOut,
  FolderSync,
  Home,
  Wand2,
  FolderArchive,
  Bell,
  Crown,
  Zap,
} from 'lucide-react';
import { CloudinaryConfig, MainNavTab, ThemeMode, User, UserSubscription } from '../types';

interface HeaderProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  isOnline: boolean;
  theme: ThemeMode;
  onThemeToggle: (mode: ThemeMode) => void;
  cloudinaryConfig: CloudinaryConfig;
  onOpenCloudinary: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenTutorial: () => void;
  offlineQueueCount: number;
  onOpenFeedback?: () => void;
  onOpenAdmin?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenPricing?: () => void;
  onOpenSubscriptionDashboard?: () => void;
  entitlement?: UserSubscription | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  theme,
  onThemeToggle,
  cloudinaryConfig,
  onOpenCloudinary,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenTutorial,
  offlineQueueCount,
  onOpenFeedback,
  onOpenAdmin,
  unreadCount = 0,
  onOpenNotifications,
  onOpenPricing,
  onOpenSubscriptionDashboard,
  entitlement,
}) => {
  const nextTheme: Record<ThemeMode, ThemeMode> = {
    system: 'dark',
    dark: 'light',
    light: 'system',
  };

  const themeIcon = {
    system: <Laptop className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
    dark: <Moon className="w-4 h-4 text-indigo-400" />,
    light: <Sun className="w-4 h-4 text-amber-500" />,
  }[theme];

  const isPremium = entitlement?.isPremium && entitlement.status === 'active';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/25 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
                GURUCUT AI
              </span>
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black tracking-wider uppercase rounded-md bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/70">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden lg:block -mt-0.5">
              AI Background Remover & Creative Suite
            </p>
          </div>
        </div>

        {/* Center Mode Switch Tabs */}
        <nav className="hidden md:flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'home'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'editor'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ai-studio'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'batch'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Right Tools, Notifications & Subscription */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Subscription Status or Upgrade Button */}
          {isPremium ? (
            <button
              onClick={onOpenSubscriptionDashboard || onOpenPricing}
              title={`Active: ${entitlement.planName} (${entitlement.daysRemaining} days remaining)`}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 font-extrabold text-xs hover:border-amber-400 shadow-xs transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Premium:</span>
              <span>{entitlement.daysRemaining}d</span>
            </button>
          ) : (
            <button
              onClick={onOpenPricing}
              title="Unlock Unlimited Background Removals & All Studio Tools"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pricing</span>
              <span className="text-[10px] bg-white/20 px-1 rounded-md">₹49.83/mo</span>
            </button>
          )}

          {/* Notification Center Bell with unread counter */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              title="Notifications & Subscription Expiry Alerts"
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Cloudinary Integration Button */}
          <button
            onClick={onOpenCloudinary}
            title="Cloudinary Cloud Sync & CDN Settings"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              cloudinaryConfig.isConnected
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden lg:inline">
              {cloudinaryConfig.isConnected ? 'Cloudinary' : 'Sync'}
            </span>
          </button>

          {/* Feedback & Star Rating */}
          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              title="Community Star Ratings & Reviews"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 hover:border-amber-400 hover:shadow-xs transition-all text-xs font-bold"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => onThemeToggle(nextTheme[theme])}
            title={`Current theme: ${theme} (Click to toggle)`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all"
            aria-label="Toggle theme"
          >
            {themeIcon}
          </button>

          {/* Admin Dashboard */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Admin Operations Console"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all"
              aria-label="Admin"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* User Profile / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1">
              <div
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200/60 transition-all"
                title={`Signed in as ${currentUser.name} (${currentUser.email})`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] truncate hidden md:inline">
                  {currentUser.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
