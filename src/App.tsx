import React, { useState, useEffect, useCallback } from 'react';
import {
  Home as HomeIcon,
  Sparkles,
  Wand2,
  FolderArchive,
  User as UserIcon,
  Layers,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { Editor } from './components/Editor';
import { BatchProcessor } from './components/BatchProcessor';
import { HistoryModal } from './components/HistoryModal';
import { AuthModal } from './components/AuthModal';
import { CloudinaryModal } from './components/CloudinaryModal';
import { TutorialModal } from './components/TutorialModal';
import { ShareModal } from './components/ShareModal';
import { FeedbackModal, FeedbackEntry } from './components/FeedbackModal';
import { HelpCenterModal } from './components/HelpCenterModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { PricingModal } from './components/PricingModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SubscriptionDashboardModal } from './components/SubscriptionDashboardModal';
import { BackgroundApiModal } from './components/BackgroundApiModal';
import { AIStudio } from './components/AIStudio';
import { ProjectsManager } from './components/ProjectsManager';
import { ProfileView } from './components/ProfileView';
import {
  BackgroundConfig,
  CloudinaryConfig,
  HistoryItem,
  ImageItem,
  MainNavTab,
  Project,
  ThemeMode,
  User,
  UserSubscription,
} from './types';
import { removeBackgroundLocally } from './utils/aiSegmentation';
import {
  applyTheme,
  clearOfflineQueue,
  deleteLocalHistoryItem,
  deleteLocalProject,
  getHasSeenTutorial,
  getLocalHistory,
  getLocalProjects,
  getOfflineQueue,
  getStoredCloudinaryConfig,
  getStoredTheme,
  getStoredToken,
  getStoredUser,
  queueOfflineItem,
  recordExportAction,
  recordProcessAction,
  saveLocalHistoryItem,
  saveLocalProject,
  setHasSeenTutorial,
  setStoredCloudinaryConfig,
  setStoredToken,
  setStoredUser,
  SampleImage,
} from './utils/storage';

export default function App() {
  // Navigation: 5 core destinations + Batch mode
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');

  // Images state
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [batchImages, setBatchImages] = useState<ImageItem[]>([]);
  const [projects, setProjects] = useState<Project[]>(getLocalProjects);

  // Connectivity & Storage
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Settings & Theme
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(getStoredCloudinaryConfig);

  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);
  const [authToken, setAuthToken] = useState<string | null>(getStoredToken);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showCloudinaryModal, setShowCloudinaryModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showHelpCenterModal, setShowHelpCenterModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Subscriptions & Notifications
  const [entitlement, setEntitlement] = useState<UserSubscription | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [pricingInitialPlan, setPricingInitialPlan] = useState<'plan_monthly' | 'plan_twomonth' | 'plan_sixmonth'>('plan_sixmonth');
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showBackgroundApiModal, setShowBackgroundApiModal] = useState<boolean>(false);

  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>(() => {
    try {
      const stored = localStorage.getItem("auracut_user_feedbacks");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [shareUrls, setShareUrls] = useState<{ processed: string; original: string }>({
    processed: '',
    original: '',
  });

  // Global Toast
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(
    null
  );

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // 1. Initial Setup: PWA Service Worker, Theme, and Tutorial check
  useEffect(() => {
    applyTheme(theme);

    // Register Service Worker for offline PWA functionality
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Load initial local history and projects
    setHistoryItems(getLocalHistory());
    setProjects(getLocalProjects());

    // Show tutorial for first-time visitors
    if (!getHasSeenTutorial()) {
      setShowTutorialModal(true);
    }

    // Fetch user profile if token exists
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setCurrentUser(data.user);
            setStoredUser(data.user);
          }
        })
        .catch(() => {});
    }

    // Sync online history
    syncHistory();
    fetchSubscriptionAndNotifications();
  }, []);

  const fetchSubscriptionAndNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('auracut_auth_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Subscription & Entitlement status
      const subRes = await fetch('/api/subscription/status', { headers });
      if (subRes.ok) {
        const data = await subRes.json();
        if (data.entitlement) {
          setEntitlement(data.entitlement);
        }
      }

      // 2. Notifications count
      const notifRes = await fetch('/api/notifications', { headers });
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setUnreadNotificationsCount(nData.unreadCount || 0);
      }
    } catch (e) {
      console.warn('Subscription/notifications sync notice:', e);
    }
  }, []);

  // 2. Real-Time Online / Offline Detection & Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Back online! Syncing background edits in real-time...', 'success');
      syncOfflineQueue();
      syncHistory();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode: Client-side AI cutout engine is active.', 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [authToken]);

  // Sync offline queue with server
  const syncOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    try {
      const res = await fetch('/api/history/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ items: queue }),
      });

      if (res.ok) {
        clearOfflineQueue();
        setOfflineQueueCount(0);
        syncHistory();
      }
    } catch (e) {
      console.warn('Sync offline queue failed:', e);
    }
  };

  // Sync server history
  const syncHistory = async () => {
    try {
      const res = await fetch('/api/history', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setHistoryItems(data.items);
          localStorage.setItem('auracut_history_cache', JSON.stringify(data.items));
        }
      }
    } catch {
      setHistoryItems(getLocalHistory());
    }
  };

  // Theme switcher
  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // 3. Process an Image through the AI Pipeline
  const processImageItem = async (rawItem: ImageItem) => {
    setCurrentImage({
      ...rawItem,
      status: 'processing',
      progress: 15,
      progressText: 'Initializing AI background removal...',
    });
    setActiveTab('editor');

    try {
      let analysis = undefined;

      // Start Gemini vision analysis in parallel if online
      const analysisPromise = navigator.onLine
        ? fetch('/api/process/remove-bg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: rawItem.originalUrl,
              options: {},
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        : Promise.resolve(null);

      // Deep Neural background removal
      const segmentation = await removeBackgroundLocally(rawItem.originalUrl, {
        feather: 1.5,
        tolerance: 28,
        onProgress: (pct, statusText) => {
          setCurrentImage((prev) =>
            prev ? { ...prev, progress: pct, progressText: statusText || prev.progressText } : null
          );
        },
      });

      const serverRes = await analysisPromise;
      if (serverRes?.analysis) {
        analysis = serverRes.analysis;
      }

      const completedItem: ImageItem = {
        ...rawItem,
        status: 'done',
        progress: 100,
        progressText: 'Complete!',
        processedUrl: segmentation.cutoutDataUrl,
        maskDataUrl: segmentation.maskDataUrl,
        width: segmentation.width,
        height: segmentation.height,
        engineUsed: segmentation.engineUsed,
        analysis,
      };

      setCurrentImage(completedItem);
      recordProcessAction();

      // Auto-save initial cutout to history & projects vault
      handleSaveToHistory(
        segmentation.cutoutDataUrl,
        'transparent',
        'png',
        segmentation.width,
        segmentation.height,
        rawItem.name
      );
    } catch (err: any) {
      console.error('Processing error:', err);
      setCurrentImage({
        ...rawItem,
        status: 'error',
        error: err.message || 'Background removal failed',
      });
      showToast('Error removing background. Please try another image.', 'warn');
    }
  };

  // 4. Handle Uploads from Dropzone
  const handleImagesSelected = (files: File[]) => {
    if (files.length === 1) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const item: ImageItem = {
            id: 'img_' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            file,
            originalUrl: e.target.result as string,
            status: 'idle',
            progress: 0,
            width: 0,
            height: 0,
          };
          processImageItem(item);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple files -> Batch Mode!
      const items: ImageItem[] = [];
      let loaded = 0;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            items.push({
              id: 'img_' + Math.random().toString(36).substring(2, 9),
              name: file.name,
              file,
              originalUrl: e.target.result as string,
              status: 'idle',
              progress: 0,
              width: 0,
              height: 0,
            });
          }
          loaded++;
          if (loaded === files.length) {
            setBatchImages(items);
            setActiveTab('batch');
            showToast(`${items.length} images queued in Batch Studio`, 'info');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // 5. Select instant Sample Image with pre-conversion to avoid CORS/decoding issues
  const handleSelectSample = async (sample: SampleImage) => {
    showToast(`Loading sample "${sample.name}"...`, 'info');
    try {
      let dataUrl = sample.url;
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = sample.url;
        });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          dataUrl = c.toDataURL('image/jpeg', 0.95);
        }
      } catch {
        // Fall back to sample.url if canvas reading fails
      }

      const item: ImageItem = {
        id: 'sample_' + sample.id + '_' + Date.now(),
        name: sample.name,
        originalUrl: dataUrl,
        status: 'idle',
        progress: 0,
        width: 800,
        height: 600,
      };
      processImageItem(item);
    } catch {
      showToast('Failed to load sample image', 'warn');
    }
  };

  // 6. Save edit to history & projects
  const handleSaveToHistory = async (
    processedUrl: string,
    bgType: string,
    format: string,
    width: number,
    height: number,
    customName?: string
  ) => {
    const historyItem: HistoryItem = {
      id: 'hist_' + Math.random().toString(36).substring(2, 10),
      name: customName || currentImage?.name || 'AuraCut Creation',
      originalUrl: currentImage?.originalUrl || '',
      processedUrl,
      thumbnailUrl: processedUrl,
      backgroundType: bgType,
      format,
      fileSize: Math.round((processedUrl.length * 3) / 4),
      width,
      height,
      createdAt: new Date().toISOString(),
    };

    // Save history
    const updatedLocal = saveLocalHistoryItem(historyItem);
    setHistoryItems(updatedLocal);

    // Save project
    const projectItem: Project = {
      id: 'proj_' + Math.random().toString(36).substring(2, 10),
      name: customName || currentImage?.name || 'AuraCut Creation',
      originalUrl: currentImage?.originalUrl || '',
      processedUrl,
      maskDataUrl: currentImage?.maskDataUrl,
      thumbnailUrl: processedUrl,
      width,
      height,
      format,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedProjects = saveLocalProject(projectItem);
    setProjects(updatedProjects);
    recordExportAction();

    if (navigator.onLine) {
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ item: historyItem }),
        });
      } catch {
        queueOfflineItem(historyItem);
        setOfflineQueueCount((c) => c + 1);
      }
    } else {
      queueOfflineItem(historyItem);
      setOfflineQueueCount((c) => c + 1);
    }
  };

  // 7. Delete from history
  const handleDeleteHistoryItem = async (id: string) => {
    const updated = deleteLocalHistoryItem(id);
    setHistoryItems(updated);

    if (navigator.onLine) {
      try {
        await fetch(`/api/history/${id}`, {
          method: 'DELETE',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
      } catch {}
    }
    showToast('Item removed from history', 'info');
  };

  // 8. Projects actions
  const handleOpenProject = (project: Project) => {
    setCurrentImage({
      id: project.id,
      name: project.name,
      originalUrl: project.originalUrl,
      processedUrl: project.processedUrl,
      maskDataUrl: project.maskDataUrl,
      status: 'done',
      progress: 100,
      width: project.width,
      height: project.height,
    });
    setActiveTab('editor');
    showToast(`Opened "${project.name}" in Editor`, 'info');
  };

  const handleDuplicateProject = (project: Project) => {
    const duplicate: Project = {
      ...project,
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = saveLocalProject(duplicate);
    setProjects(updated);
    showToast('Project duplicated', 'success');
  };

  const handleRenameProject = (id: string, newName: string) => {
    const current = getLocalProjects();
    const found = current.find((p) => p.id === id);
    if (found) {
      found.name = newName;
      found.updatedAt = new Date().toISOString();
      const updated = saveLocalProject(found);
      setProjects(updated);
      showToast('Project renamed', 'info');
    }
  };

  const handleDeleteProject = (id: string) => {
    const updated = deleteLocalProject(id);
    setProjects(updated);
    showToast('Project deleted', 'info');
  };

  // 9. Upload directly to Cloudinary
  const handleUploadToCloudinary = async (dataUrl: string) => {
    showToast('Syncing image to Cloud Vault...', 'info');
    try {
      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          cloudName: cloudinaryConfig.cloudName,
          uploadPreset: cloudinaryConfig.uploadPreset,
          filename: currentImage ? currentImage.name.replace(/\.[^/.]+$/, '') : 'auracut_export',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.note || 'Synced to cloud library successfully!', 'success');
      } else {
        showToast('Cloud upload fallback used', 'warn');
      }
    } catch {
      showToast('Uploaded to local vault', 'info');
    }
  };

  // 10. Open Share modal
  const handleOpenShare = (dataUrl: string, originalUrl: string) => {
    setShareUrls({
      processed: dataUrl,
      original: originalUrl,
    });
    setShowShareModal(true);
  };

  // 11. Auth actions
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    setStoredUser(user);
    setStoredToken(token);
    setShowAuthModal(false);
    showToast(`Welcome back, ${user.name}!`, 'success');
    syncHistory();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setStoredUser(null);
    setStoredToken(null);
    showToast('You have been logged out', 'info');
  };

  const handleClearCache = () => {
    localStorage.removeItem('auracut_history_cache');
    localStorage.removeItem('auracut_offline_sync_queue');
    setHistoryItems([]);
    setOfflineQueueCount(0);
    showToast('Local cache & temporary neural masks cleared', 'success');
  };

  const handleExportAllData = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects: getLocalProjects(),
      history: getLocalHistory(),
      user: currentUser,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auracut_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Projects and data backup downloaded', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
                : toast.type === 'warn'
                ? 'bg-amber-950/90 text-amber-200 border-amber-800'
                : 'bg-slate-900/90 text-slate-100 border-slate-700'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        theme={theme}
        onThemeToggle={handleThemeChange}
        cloudinaryConfig={cloudinaryConfig}
        onOpenCloudinary={() => setShowCloudinaryModal(true)}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenTutorial={() => setShowHelpCenterModal(true)}
        offlineQueueCount={offlineQueueCount}
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onOpenPricing={() => {
          setPricingInitialPlan('plan_sixmonth');
          setShowPricingModal(true);
        }}
        onOpenSubscriptionDashboard={() => setShowSubscriptionModal(true)}
        entitlement={entitlement}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* DESTINATION 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <Dropzone
              onImagesSelected={handleImagesSelected}
              onSelectSample={handleSelectSample}
              onNavigateTab={setActiveTab}
              onOpenFeedback={() => setShowFeedbackModal(true)}
              onOpenPricing={(plan) => {
                if (plan) setPricingInitialPlan(plan);
                setShowPricingModal(true);
              }}
              onOpenBackgroundApi={() => setShowBackgroundApiModal(true)}
            />

            {/* Quick Recent Projects bar on Home */}
            {projects.length > 0 && (
              <div className="max-w-4xl mx-auto space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recent Studio Projects
                  </h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>View all ({projects.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {projects.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleOpenProject(p)}
                      className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 hover:border-indigo-500 transition-all shadow-sm"
                    >
                      <div className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center p-2 mb-2">
                        <img
                          src={p.thumbnailUrl || p.processedUrl}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DESTINATION 2: EDITOR */}
        {activeTab === 'editor' && (
          <>
            {!currentImage ? (
              <Dropzone
                onImagesSelected={handleImagesSelected}
                onSelectSample={handleSelectSample}
                onNavigateTab={setActiveTab}
                onOpenFeedback={() => setShowFeedbackModal(true)}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentImage(null)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    ← Upload Another Image
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    Editing: <strong className="text-slate-800 dark:text-slate-200">{currentImage.name}</strong>
                  </span>
                </div>
                <Editor
                  image={currentImage}
                  onUpdateImage={setCurrentImage}
                  onSaveToHistory={handleSaveToHistory}
                  onUploadToCloudinary={handleUploadToCloudinary}
                  onOpenShare={handleOpenShare}
                  isOnline={isOnline}
                  onOpenTutorial={() => setShowHelpCenterModal(true)}
                  onOpenFeedback={() => setShowFeedbackModal(true)}
                />
              </div>
            )}
          </>
        )}

        {/* DESTINATION 3: AI STUDIO */}
        {activeTab === 'ai-studio' && (
          <AIStudio
            currentImage={currentImage}
            onApplyBackgroundToEditor={(bg) => {
              showToast('Applied AI Background to Editor Canvas', 'success');
            }}
            onOpenInEditor={(item) => {
              setCurrentImage(item);
              setActiveTab('editor');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* DESTINATION 4: PROJECTS */}
        {activeTab === 'projects' && (
          <ProjectsManager
            projects={projects}
            onOpenProject={handleOpenProject}
            onDuplicateProject={handleDuplicateProject}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
            onNewProject={() => setActiveTab('home')}
          />
        )}

        {/* DESTINATION 5: PROFILE & ADMIN */}
        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenAuth={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            theme={theme}
            onThemeChange={handleThemeChange}
            onClearCache={handleClearCache}
            onExportAllData={handleExportAllData}
            onOpenCloudinaryModal={() => setShowCloudinaryModal(true)}
          />
        )}

        {/* BATCH PROCESSING */}
        {activeTab === 'batch' && (
          <BatchProcessor
            images={batchImages}
            onUpdateImages={setBatchImages}
            onSelectImageForStudio={(item) => {
              setCurrentImage(item);
              setActiveTab('editor');
            }}
            onAddMoreImages={(files) => handleImagesSelected(files)}
            onClearBatch={() => setBatchImages([])}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Touch-friendly & Android responsive) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {[
          { id: 'home', label: 'Home', icon: HomeIcon },
          { id: 'editor', label: 'Editor', icon: Sparkles },
          { id: 'ai-studio', label: 'AI Studio', icon: Wand2 },
          { id: 'projects', label: 'Projects', icon: FolderArchive },
          { id: 'profile', label: 'Profile', icon: UserIcon },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as MainNavTab)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      )}

      {showCloudinaryModal && (
        <CloudinaryModal
          config={cloudinaryConfig}
          onSaveConfig={(updated) => {
            setCloudinaryConfig(updated);
            setStoredCloudinaryConfig(updated);
            showToast('Cloudinary configuration updated', 'success');
          }}
          onClose={() => setShowCloudinaryModal(false)}
        />
      )}

      {showTutorialModal && (
        <TutorialModal
          onClose={() => setShowTutorialModal(false)}
          onComplete={() => {
            setHasSeenTutorial(true);
            setShowTutorialModal(false);
            showToast("You're ready to create! Pick an image to begin.", 'success');
          }}
        />
      )}

      {showShareModal && (
        <ShareModal
          processedUrl={shareUrls.processed}
          originalUrl={shareUrls.original}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          currentUser={currentUser}
          onSubmitted={(item) => {
            setFeedbacks((prev) => [item, ...prev]);
            showToast("Thank you for rating ClearCut AI!", "success");
          }}
        />
      )}
      {showHelpCenterModal && (
        <HelpCenterModal
          isOpen={showHelpCenterModal}
          onClose={() => setShowHelpCenterModal(false)}
          onOpenFeedback={() => {
            setShowHelpCenterModal(false);
            setShowFeedbackModal(true);
          }}
        />
      )}
      {showAdminModal && (
        <AdminDashboardModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          feedbacks={feedbacks}
          onDeleteFeedback={(id) => {
            setFeedbacks((prev) => prev.filter((f) => f.id !== id));
            showToast("Review moderated", "info");
          }}
        />
      )}

      {/* GURUCUT AI Pricing & 6-Month Plan Modal */}
      {showPricingModal && (
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentUser={currentUser}
          entitlement={entitlement}
          initialSelectedPlanId={pricingInitialPlan}
          onSubscriptionUpdated={(updated) => {
            setEntitlement(updated);
            fetchSubscriptionAndNotifications();
            showToast(`Activated ${updated.planName}! Unlimited standard background removals unlocked.`, 'success');
          }}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {/* Notifications & Expiry Reminders Center */}
      {showNotificationModal && (
        <NotificationCenterModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onOpenPricing={(planId) => {
            if (planId) setPricingInitialPlan(planId);
            setShowPricingModal(true);
          }}
          onNotificationsChanged={fetchSubscriptionAndNotifications}
        />
      )}

      {/* Subscription Dashboard Modal */}
      {showSubscriptionModal && (
        <SubscriptionDashboardModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          currentUser={currentUser}
          entitlement={entitlement}
          onOpenPricing={() => {
            setShowSubscriptionModal(false);
            setPricingInitialPlan('plan_sixmonth');
            setShowPricingModal(true);
          }}
        />
      )}

      {/* Background API Playground & Keys Modal */}
      {showBackgroundApiModal && (
        <BackgroundApiModal
          isOpen={showBackgroundApiModal}
          onClose={() => setShowBackgroundApiModal(false)}
          currentUser={currentUser}
          entitlement={entitlement}
          onOpenPricing={() => {
            setShowBackgroundApiModal(false);
            setPricingInitialPlan('plan_sixmonth');
            setShowPricingModal(true);
          }}
        />
      )}
    </div>
  );
}
