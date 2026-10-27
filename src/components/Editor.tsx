import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Share2,
  Cloud,
  Sparkles,
  Star,
  Sliders,
  Paintbrush,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Check,
  SplitSquareVertical,
  Image as ImageIcon,
  Eraser,
  Undo2,
  Redo2,
  BookmarkCheck,
  Palette,
  Layers,
  Wand2,
  HelpCircle,
  RefreshCw,
  SunMedium,
  Contrast,
  Crop,
  Lightbulb,
  Box,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Scissors,
  CheckCheck,
  Lock,
  Unlock,
  Keyboard,
  X,
  Trash2,
} from 'lucide-react';
import { BackgroundConfig, EffectsConfig, ExportConfig, ImageItem } from '../types';
import {
  GRADIENT_PRESETS,
  SOLID_COLOR_PRESETS,
  STUDIO_BACKDROPS,
  PRO_PRESETS,
  ProPreset,
  renderCompositedCanvas,
  exportCanvasImage,
  triggerDownload,
  detectSubjectBounds,
  cropImage,
} from '../utils/canvasEffects';
import { loadImage, removeBackgroundLocally } from '../utils/aiSegmentation';
import { useKeyboardShortcuts } from '../utils/useKeyboardShortcuts';

interface EditorProps {
  image: ImageItem;
  onUpdateImage: (updated: ImageItem) => void;
  onSaveToHistory: (
    processedUrl: string,
    bgType: string,
    format: string,
    width: number,
    height: number
  ) => void;
  onUploadToCloudinary: (dataUrl: string) => void;
  onOpenShare: (dataUrl: string, originalUrl: string) => void;
  isOnline: boolean;
  onOpenTutorial: () => void;
  onOpenFeedback?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  image,
  onUpdateImage,
  onSaveToHistory,
  onUploadToCloudinary,
  onOpenShare,
  isOnline,
  onOpenTutorial,
  onOpenFeedback,
}) => {
  // View Modes: 'slider' | 'cutout' | 'original' | 'mask'
  const [viewMode, setViewMode] = useState<'slider' | 'cutout' | 'original' | 'mask'>('slider');
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 %
  const [zoomLevel, setZoomLevel] = useState(1);

  // Background state
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    type: 'transparent',
    color: '#ffffff',
    gradient: GRADIENT_PRESETS[0].value,
    blurAmount: 16,
  });

  // Effects state - Notice: outline is strictly disabled by default (enabled: false, width: 0)
  // and edgeChoke is 1.0px by default to automatically eliminate any leftover background halo/outline!
  const [effects, setEffects] = useState<EffectsConfig>({
    shadow: {
      enabled: false,
      type: 'drop',
      blur: 20,
      offsetX: 0,
      offsetY: 14,
      opacity: 0.4,
      color: '#000000',
    },
    outline: {
      enabled: false,
      width: 0,
      color: '#ffffff',
    },
    reflection: {
      enabled: false,
      opacity: 0.25,
      distance: 0,
    },
    colorAdjustments: {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      colorHarmonize: false,
    },
    edgeChoke: 1.0, // Defringe: eats into alpha by 1px to strip off any residual background outline!
    autoCropPadding: 0,
    feather: 1.5,
    decontaminate: 50,
    invert: false,
  });

  // Export configuration
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'png',
    quality: 0.95,
    scale: 1,
    dimensionPreset: 'original',
  });

  // Refinement Eraser & Fine-tuning touchup brush state with dual Undo/Redo stack
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [brushAction, setBrushAction] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState(28);
  const [brushHardness, setBrushHardness] = useState(85); // 0 = soft/feathered, 100 = crisp edge
  const [brushOpacity, setBrushOpacity] = useState(100); // 10% to 100%
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushUndoStack, setBrushUndoStack] = useState<string[]>([]);
  const [brushRedoStack, setBrushRedoStack] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // Engine & Reprocessing
  const [activeEngine, setActiveEngine] = useState<'neural' | 'fast'>(
    image.engineUsed === 'smart_contour_matte' ? 'fast' : 'neural'
  );
  const [tolerance, setTolerance] = useState<number>(28);
  const [reprocessStatusText, setReprocessStatusText] = useState<string>('');
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Composited preview
  const [compositedPreviewUrl, setCompositedPreviewUrl] = useState<string>(
    image.processedUrl || image.originalUrl
  );
  const [isRenderingComposite, setIsRenderingComposite] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('clean-transparent');

  type CropRatio = 'free' | 'original' | '1:1' | '4:5' | '16:9' | '9:16' | '3:2' | '2:3';
  // Lightweight Cropping Tool state - defaults to original aspect ratio to preserve image proportions
  const [isCropMode, setIsCropMode] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  });
  const [cropAspectRatio, setCropAspectRatio] = useState<CropRatio>('original');
  const [isAutoTrimming, setIsAutoTrimming] = useState<boolean>(false);
  const [cropHistory, setCropHistory] = useState<ImageItem[]>([]);
  const [cropDragMode, setCropDragMode] = useState<string | null>(null);

  // Keyboard shortcut notice and cheat-sheet modal
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  const showShortcutNotice = (msg: string) => {
    setShortcutFeedback(msg);
    setTimeout(() => {
      setShortcutFeedback((curr) => (curr === msg ? null : curr));
    }, 2000);
  };

  // Instant in-editor Star Rating & quick tags
  const [quickRatedStar, setQuickRatedStar] = useState<number | null>(null);

  const handleQuickStarRate = (stars: number) => {
    setQuickRatedStar(stars);
    showShortcutNotice(`★ Rated ${stars}/5 Stars! Thank you.`);

    const newFeedback = {
      id: 'fb_quick_' + Date.now().toString(36),
      userName: 'Creator',
      userRole: 'Editor User',
      rating: stars,
      qualityRating: stars,
      edgeRating: stars,
      speedRating: 5,
      category: 'AI accuracy & cutout quality',
      tags: stars >= 4 ? ['Crisp edges', 'Zero halo'] : ['Needs refinement'],
      message: `Quick in-editor ${stars}-star rating on image: ${image.name}`,
      helpfulCount: 0,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem('auracut_user_feedbacks');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('auracut_user_feedbacks', JSON.stringify([newFeedback, ...existing]));
    } catch {}

    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeedback),
    }).catch(() => {});
  };

  const handleQuickFeedbackTag = (tag: string) => {
    showShortcutNotice(`Feedback tag recorded: ${tag}`);
    const newFeedback = {
      id: 'fb_tag_' + Date.now().toString(36),
      userName: 'Creator',
      userRole: 'Editor User',
      rating: 5,
      qualityRating: 5,
      edgeRating: 5,
      speedRating: 5,
      category: 'AI accuracy & cutout quality',
      tags: [tag],
      message: `User tagged image cutout as: ${tag}`,
      helpfulCount: 0,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    try {
      const stored = localStorage.getItem('auracut_user_feedbacks');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('auracut_user_feedbacks', JSON.stringify([newFeedback, ...existing]));
    } catch {}
  };

  // Exact natural image aspect ratio
  const imgAspect = image.width && image.height && image.height > 0 ? image.width / image.height : 1;

  const getTargetAspect = (ratio: CropRatio): number | null => {
    if (ratio === 'free') return null;
    if (ratio === 'original') return imgAspect;
    if (ratio === '1:1') return 1.0;
    if (ratio === '4:5') return 4 / 5;
    if (ratio === '16:9') return 16 / 9;
    if (ratio === '9:16') return 9 / 16;
    if (ratio === '3:2') return 3 / 2;
    if (ratio === '2:3') return 2 / 3;
    return null;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const cropDragStart = useRef<{
    clientX: number;
    clientY: number;
    box: { x: number; y: number; width: number; height: number };
    containerRect: DOMRect | null;
  }>({
    clientX: 0,
    clientY: 0,
    box: { x: 5, y: 5, width: 90, height: 90 },
    containerRect: null,
  });

  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const initialCutoutUrlRef = useRef<string>(image.processedUrl || '');
  const lastStrokePosRef = useRef<{ x: number; y: number } | null>(null);

  // Preload original image for instantaneous pixel restoration
  useEffect(() => {
    if (image.originalUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = image.originalUrl;
      originalImageRef.current = img;
    }
    if (image.processedUrl && !initialCutoutUrlRef.current) {
      initialCutoutUrlRef.current = image.processedUrl;
    }
  }, [image.originalUrl, image.processedUrl]);

  // Synchronize brush canvas when entering brush mode
  useEffect(() => {
    if (!isBrushMode || !brushCanvasRef.current || !image.processedUrl) return;
    const canvas = brushCanvasRef.current;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth || image.width || 800;
      canvas.height = img.naturalHeight || image.height || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = image.processedUrl;
  }, [isBrushMode]);

  // Global Keyboard Shortcuts for Brush Undo / Redo (Ctrl+Z / Cmd+Z and Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    if (!isBrushMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoBrush();
      } else if (
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (isCtrlOrCmd && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedoBrush();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBrushMode, brushUndoStack, brushRedoStack]);

  // Re-composite canvas whenever background or effects change
  useEffect(() => {
    let isCancelled = false;
    async function updateComposite() {
      if (!image.processedUrl) return;
      setIsRenderingComposite(true);
      try {
        const canvas = await renderCompositedCanvas(
          image.processedUrl,
          image.originalUrl,
          bgConfig,
          effects,
          exportConfig
        );
        if (!isCancelled) {
          setCompositedPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Composite error:', err);
      } finally {
        if (!isCancelled) setIsRenderingComposite(false);
      }
    }

    const timer = setTimeout(updateComposite, 70);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    image.processedUrl,
    bgConfig,
    effects,
    exportConfig.dimensionPreset,
    exportConfig.scale,
  ]);

  // Apply a Pro Preset in 1-Click
  const applyProPreset = (preset: ProPreset) => {
    setActivePresetId(preset.id);
    if (preset.bgConfig) {
      setBgConfig((prev) => ({ ...prev, ...preset.bgConfig }));
    }
    if (preset.effects) {
      setEffects((prev) => ({
        ...prev,
        ...preset.effects,
        shadow: { ...prev.shadow, ...(preset.effects.shadow || {}) },
        outline: { ...prev.outline, ...(preset.effects.outline || {}) },
      }));
    }
  };

  // Handle Before/After split slider drag
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handleMouseDown = () => {
    isDraggingSlider.current = true;
  };

  // Dragging crop handles handler with exact aspect ratio preservation
  const handleCropMove = (clientX: number, clientY: number) => {
    if (!cropDragMode || !cropDragStart.current.containerRect) return;
    const rect = cropDragStart.current.containerRect;
    if (rect.width === 0 || rect.height === 0) return;

    const dx = ((clientX - cropDragStart.current.clientX) / rect.width) * 100;
    const dy = ((clientY - cropDragStart.current.clientY) / rect.height) * 100;
    const startBox = cropDragStart.current.box;
    const targetRatio = getTargetAspect(cropAspectRatio);

    const minSizePct = 5;

    // Mode 1: Moving whole crop box without resizing
    if (cropDragMode === 'move') {
      const newX = Math.max(0, Math.min(100 - startBox.width, startBox.x + dx));
      const newY = Math.max(0, Math.min(100 - startBox.height, startBox.y + dy));
      setCropBox({
        x: Number(newX.toFixed(2)),
        y: Number(newY.toFixed(2)),
        width: startBox.width,
        height: startBox.height,
      });
      return;
    }

    let newX = startBox.x;
    let newY = startBox.y;
    let newW = startBox.width;
    let newH = startBox.height;

    // Mode 2: Locked Aspect Ratio Dragging (Original, 1:1, 4:5, 16:9, etc.)
    if (targetRatio) {
      if (cropDragMode === 'se') {
        let candidateW = Math.max(minSizePct, Math.min(100 - startBox.x, startBox.width + dx));
        let candidateH = (candidateW * imgAspect) / targetRatio;
        if (startBox.y + candidateH > 100) {
          candidateH = 100 - startBox.y;
          candidateW = (candidateH * targetRatio) / imgAspect;
        }
        newW = candidateW;
        newH = candidateH;
      } else if (cropDragMode === 'sw') {
        let candidateW = Math.max(minSizePct, Math.min(startBox.x + startBox.width, startBox.width - dx));
        let candidateH = (candidateW * imgAspect) / targetRatio;
        if (startBox.y + candidateH > 100) {
          candidateH = 100 - startBox.y;
          candidateW = (candidateH * targetRatio) / imgAspect;
        }
        newX = startBox.x + (startBox.width - candidateW);
        newW = candidateW;
        newH = candidateH;
      } else if (cropDragMode === 'ne') {
        let candidateW = Math.max(minSizePct, Math.min(100 - startBox.x, startBox.width + dx));
        let candidateH = (candidateW * imgAspect) / targetRatio;
        if (startBox.y + startBox.height - candidateH < 0) {
          candidateH = startBox.y + startBox.height;
          candidateW = (candidateH * targetRatio) / imgAspect;
        }
        newY = startBox.y + (startBox.height - candidateH);
        newW = candidateW;
        newH = candidateH;
      } else if (cropDragMode === 'nw') {
        let candidateW = Math.max(minSizePct, Math.min(startBox.x + startBox.width, startBox.width - dx));
        let candidateH = (candidateW * imgAspect) / targetRatio;
        if (startBox.y + startBox.height - candidateH < 0) {
          candidateH = startBox.y + startBox.height;
          candidateW = (candidateH * targetRatio) / imgAspect;
        }
        newX = startBox.x + (startBox.width - candidateW);
        newY = startBox.y + (startBox.height - candidateH);
        newW = candidateW;
        newH = candidateH;
      } else if (cropDragMode === 'e' || cropDragMode === 'w') {
        let candidateW = cropDragMode === 'e'
          ? Math.max(minSizePct, Math.min(100 - startBox.x, startBox.width + dx))
          : Math.max(minSizePct, Math.min(startBox.x + startBox.width, startBox.width - dx));
        let candidateH = (candidateW * imgAspect) / targetRatio;
        if (candidateH <= 100) {
          newW = candidateW;
          newH = candidateH;
          if (cropDragMode === 'w') newX = startBox.x + (startBox.width - candidateW);
          newY = Math.max(0, Math.min(100 - newH, startBox.y + (startBox.height - newH) / 2));
        }
      } else if (cropDragMode === 's' || cropDragMode === 'n') {
        let candidateH = cropDragMode === 's'
          ? Math.max(minSizePct, Math.min(100 - startBox.y, startBox.height + dy))
          : Math.max(minSizePct, Math.min(startBox.y + startBox.height, startBox.height - dy));
        let candidateW = (candidateH * targetRatio) / imgAspect;
        if (candidateW <= 100) {
          newH = candidateH;
          newW = candidateW;
          if (cropDragMode === 'n') newY = startBox.y + (startBox.height - candidateH);
          newX = Math.max(0, Math.min(100 - newW, startBox.x + (startBox.width - newW) / 2));
        }
      }
    } else {
      // Mode 3: Free Aspect Ratio Dragging
      if (cropDragMode.includes('w')) {
        const potentialW = startBox.width - dx;
        if (potentialW >= minSizePct && startBox.x + dx >= 0) {
          newX = startBox.x + dx;
          newW = potentialW;
        }
      }
      if (cropDragMode.includes('e')) {
        newW = Math.max(minSizePct, Math.min(100 - startBox.x, startBox.width + dx));
      }
      if (cropDragMode.includes('n')) {
        const potentialH = startBox.height - dy;
        if (potentialH >= minSizePct && startBox.y + dy >= 0) {
          newY = startBox.y + dy;
          newH = potentialH;
        }
      }
      if (cropDragMode.includes('s')) {
        newH = Math.max(minSizePct, Math.min(100 - startBox.y, startBox.height + dy));
      }
    }

    setCropBox({
      x: Number(Math.max(0, Math.min(100 - newW, newX)).toFixed(2)),
      y: Number(Math.max(0, Math.min(100 - newH, newY)).toFixed(2)),
      width: Number(newW.toFixed(2)),
      height: Number(newH.toFixed(2)),
    });
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingSlider.current = false;
      setCropDragMode(null);
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider.current) {
        handleSliderMove(e.clientX);
      }
      if (cropDragMode) {
        handleCropMove(e.clientX, e.clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider.current && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
      if (cropDragMode && e.touches[0]) {
        handleCropMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [cropDragMode]);

  // Start Crop drag
  const startCropDrag = (e: React.MouseEvent, mode: string) => {
    e.preventDefault();
    if (!cropContainerRef.current) return;
    setCropDragMode(mode);
    cropDragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox },
      containerRect: cropContainerRef.current.getBoundingClientRect(),
    };
  };

  const startCropDragTouch = (e: React.TouchEvent, mode: string) => {
    if (!e.touches[0] || !cropContainerRef.current) return;
    setCropDragMode(mode);
    cropDragStart.current = {
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
      box: { ...cropBox },
      containerRect: cropContainerRef.current.getBoundingClientRect(),
    };
  };

  // Start Crop Mode
  const handleStartCrop = async () => {
    setIsCropMode(true);
    setIsBrushMode(false);
    setViewMode('cutout');
    // Pre-calculate tight bounds with aspect ratio lock
    if (image.processedUrl) {
      setIsAutoTrimming(true);
      try {
        const targetRatio = getTargetAspect(cropAspectRatio);
        const bounds = await detectSubjectBounds(image.processedUrl, 5, targetRatio || undefined);
        setCropBox(bounds);
      } catch {
        const targetRatio = getTargetAspect(cropAspectRatio) || imgAspect;
        let w = 85;
        let h = (w * imgAspect) / targetRatio;
        if (h > 90) {
          h = 85;
          w = (h * targetRatio) / imgAspect;
        }
        setCropBox({
          x: Number(((100 - w) / 2).toFixed(2)),
          y: Number(((100 - h) / 2).toFixed(2)),
          width: Number(w.toFixed(2)),
          height: Number(h.toFixed(2)),
        });
      } finally {
        setIsAutoTrimming(false);
      }
    }
  };

  // Auto-Trim Transparent Space with exact aspect ratio preservation
  const handleAutoTrim = async (paddingPct: number = 5) => {
    if (!image.processedUrl) return;
    setIsAutoTrimming(true);
    try {
      const targetRatio = getTargetAspect(cropAspectRatio);
      const bounds = await detectSubjectBounds(image.processedUrl, paddingPct, targetRatio || undefined);
      setCropBox(bounds);
    } catch (e) {
      console.error('Auto-trim failed:', e);
    } finally {
      setIsAutoTrimming(false);
    }
  };

  // Apply Crop
  const handleApplyCrop = async () => {
    if (!image.processedUrl) return;
    try {
      // Save undo point
      setCropHistory((prev) => [...prev, { ...image }]);

      const croppedCutout = await cropImage(image.processedUrl, cropBox);
      let croppedOriginal = image.originalUrl;
      let croppedMask = image.maskDataUrl;

      try {
        const origRes = await cropImage(image.originalUrl, cropBox);
        croppedOriginal = origRes.dataUrl;
      } catch {}

      if (image.maskDataUrl) {
        try {
          const maskRes = await cropImage(image.maskDataUrl, cropBox);
          croppedMask = maskRes.dataUrl;
        } catch {}
      }

      onUpdateImage({
        ...image,
        processedUrl: croppedCutout.dataUrl,
        originalUrl: croppedOriginal,
        maskDataUrl: croppedMask,
        width: croppedCutout.width,
        height: croppedCutout.height,
      });

      setIsCropMode(false);
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
    } catch (e) {
      console.error('Crop failed:', e);
    }
  };

  const handleCancelCrop = () => {
    setIsCropMode(false);
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
  };

  const handleUndoCrop = () => {
    if (cropHistory.length === 0) return;
    const last = cropHistory[cropHistory.length - 1];
    setCropHistory((prev) => prev.slice(0, -1));
    onUpdateImage(last);
  };

  // Set Crop aspect ratio (Original, 1:1, 4:5, 16:9, 9:16, 3:2, 2:3, Free)
  const handleSetCropRatio = (ratio: CropRatio) => {
    setCropAspectRatio(ratio);
    const targetRatio = getTargetAspect(ratio);
    if (!targetRatio) return;

    // Calculate width & height in percentage space that yields exact targetRatio in pixels
    let newW = cropBox.width;
    let newH = (newW * imgAspect) / targetRatio;

    if (newH > 92) {
      newH = 88;
      newW = (newH * targetRatio) / imgAspect;
    }
    if (newW > 92) {
      newW = 88;
      newH = (newW * imgAspect) / targetRatio;
    }

    const newX = Math.max(0, Math.min(100 - newW, (100 - newW) / 2));
    const newY = Math.max(0, Math.min(100 - newH, (100 - newH) / 2));

    setCropBox({
      x: Number(newX.toFixed(2)),
      y: Number(newY.toFixed(2)),
      width: Number(newW.toFixed(2)),
      height: Number(newH.toFixed(2)),
    });
  };

  // Coordinate translation accounting for CSS scaling, zoom, and viewport
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = brushCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // Render a single brush footprint with hardness gradient and opacity
  const paintPoint = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.save();
    ctx.globalAlpha = brushOpacity / 100;
    if (brushAction === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      if (brushHardness < 90) {
        const innerRadius = radius * (brushHardness / 100);
        const grad = ctx.createRadialGradient(x, y, innerRadius, x, y, radius);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = 'rgba(0,0,0,1)';
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Restore original pixels
      ctx.globalCompositeOperation = 'source-over';
      const orig = originalImageRef.current;
      if (orig && orig.complete && orig.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(orig, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // Continuous stroke interpolation to eliminate gaps during rapid movements
  const paintLine = (x0: number, y0: number, x1: number, y1: number) => {
    const canvas = brushCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const radius = brushSize / 2;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = Math.max(1, radius / 3);
    const numSteps = Math.ceil(dist / step);
    for (let i = 0; i <= numSteps; i++) {
      const t = numSteps === 0 ? 0 : i / numSteps;
      const x = x0 + dx * t;
      const y = y0 + dy * t;
      paintPoint(ctx, x, y, radius);
    }
  };

  // Brush Interaction Handlers
  const handleBrushStart = (clientX: number, clientY: number) => {
    if (!isBrushMode || !brushCanvasRef.current) return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    // Snapshot current state to Undo Stack
    const currentData = brushCanvasRef.current.toDataURL('image/png');
    setBrushUndoStack((prev) => [...prev.slice(-24), currentData]);
    setBrushRedoStack([]); // Clear Redo history on new stroke

    setIsDrawing(true);
    lastStrokePosRef.current = coords;

    const ctx = brushCanvasRef.current.getContext('2d');
    if (ctx) {
      paintPoint(ctx, coords.x, coords.y, brushSize / 2);
    }
  };

  const handleBrushMove = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);
    if (coords) {
      setCursorPos({ x: clientX, y: clientY, visible: true });
    }
    if (!isDrawing || !isBrushMode || !lastStrokePosRef.current || !coords) return;
    paintLine(lastStrokePosRef.current.x, lastStrokePosRef.current.y, coords.x, coords.y);
    lastStrokePosRef.current = coords;
  };

  const handleBrushEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastStrokePosRef.current = null;
    if (brushCanvasRef.current) {
      const updatedUrl = brushCanvasRef.current.toDataURL('image/png');
      onUpdateImage({
        ...image,
        processedUrl: updatedUrl,
      });
    }
  };

  // Undo Stroke from History
  const handleUndoBrush = () => {
    if (brushUndoStack.length === 0 || !brushCanvasRef.current) return;
    const canvas = brushCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = canvas.toDataURL('image/png');
    const previousState = brushUndoStack[brushUndoStack.length - 1];

    setBrushRedoStack((prev) => [...prev.slice(-24), currentState]);
    setBrushUndoStack((prev) => prev.slice(0, -1));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      onUpdateImage({
        ...image,
        processedUrl: previousState,
      });
    };
    img.src = previousState;
  };

  // Redo Stroke from History
  const handleRedoBrush = () => {
    if (brushRedoStack.length === 0 || !brushCanvasRef.current) return;
    const canvas = brushCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = canvas.toDataURL('image/png');
    const nextState = brushRedoStack[brushRedoStack.length - 1];

    setBrushUndoStack((prev) => [...prev.slice(-24), currentState]);
    setBrushRedoStack((prev) => prev.slice(0, -1));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      onUpdateImage({
        ...image,
        processedUrl: nextState,
      });
    };
    img.src = nextState;
  };

  // Reset to initial AI Cutout
  const handleResetToAICutout = () => {
    if (!brushCanvasRef.current || !initialCutoutUrlRef.current) return;
    const canvas = brushCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = canvas.toDataURL('image/png');
    setBrushUndoStack((prev) => [...prev.slice(-24), currentState]);
    setBrushRedoStack([]);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      onUpdateImage({
        ...image,
        processedUrl: initialCutoutUrlRef.current,
      });
    };
    img.src = initialCutoutUrlRef.current;
  };

  // Clear workspace canvas modifications (triggered by Delete / Backspace or clear button)
  const handleClearWorkspaceOrObject = () => {
    if (isCropMode) {
      setIsCropMode(false);
      showShortcutNotice('Cancelled Crop Mode (Del / Esc)');
      return;
    }
    if (brushUndoStack.length > 0) {
      handleResetToAICutout();
      showShortcutNotice('Reverted brush edits to initial AI cutout (Del)');
      return;
    }
    // Reset background and effects to pristine transparent cutout
    setBgConfig({
      type: 'transparent',
      color: '#ffffff',
      gradient: GRADIENT_PRESETS[0].value,
      blurAmount: 16,
    });
    setEffects((prev) => ({
      ...prev,
      shadow: { ...prev.shadow, enabled: false },
      outline: { ...prev.outline, enabled: false, width: 0 },
      reflection: { ...prev.reflection, enabled: false },
      colorAdjustments: {
        brightness: 1,
        contrast: 1,
        saturation: 1,
        colorHarmonize: false,
      },
      invert: false,
    }));
    showShortcutNotice('Reset workspace canvas to transparent cutout (Del)');
  };

  // Register Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onUndo: () => {
      if (isBrushMode && brushUndoStack.length > 0) {
        handleUndoBrush();
        showShortcutNotice('Undo: Reverted brush stroke (Ctrl+Z)');
      } else if (cropHistory.length > 0) {
        handleUndoCrop();
        showShortcutNotice('Undo: Reverted crop (Ctrl+Z)');
      } else if (brushUndoStack.length > 0) {
        handleUndoBrush();
        showShortcutNotice('Undo: Reverted stroke (Ctrl+Z)');
      } else {
        showShortcutNotice('Nothing to undo (Ctrl+Z)');
      }
    },
    onRedo: () => {
      if (brushRedoStack.length > 0) {
        handleRedoBrush();
        showShortcutNotice('Redo: Restored stroke (Ctrl+Y)');
      } else {
        showShortcutNotice('Nothing to redo (Ctrl+Y)');
      }
    },
    onDelete: handleClearWorkspaceOrObject,
    onClear: handleClearWorkspaceOrObject,
    onIncreaseBrushSize: () => {
      setBrushSize((s) => {
        const next = Math.min(140, s + 6);
        showShortcutNotice(`Brush Size: ${next}px (])`);
        return next;
      });
    },
    onDecreaseBrushSize: () => {
      setBrushSize((s) => {
        const next = Math.max(4, s - 6);
        showShortcutNotice(`Brush Size: ${next}px ([)`);
        return next;
      });
    },
    onToggleBrushMode: () => {
      setIsBrushMode((prev) => {
        const next = !prev;
        if (next) {
          setViewMode('cutout');
          setIsCropMode(false);
          showShortcutNotice('Refinement Eraser Brush Enabled (B)');
        } else {
          showShortcutNotice('Refinement Brush Closed (B)');
        }
        return next;
      });
    },
    onToggleCropMode: () => {
      if (isCropMode) {
        setIsCropMode(false);
        showShortcutNotice('Exited Crop Mode (C)');
      } else {
        handleStartCrop();
        showShortcutNotice('Crop & Trim Tool (C)');
      }
    },
    onZoomIn: () => {
      setZoomLevel((z) => {
        const next = Math.min(3, +(z + 0.25).toFixed(2));
        showShortcutNotice(`Zoom: ${Math.round(next * 100)}% (Ctrl+)`);
        return next;
      });
    },
    onZoomOut: () => {
      setZoomLevel((z) => {
        const next = Math.max(0.5, +(z - 0.25).toFixed(2));
        showShortcutNotice(`Zoom: ${Math.round(next * 100)}% (Ctrl-)`);
        return next;
      });
    },
    onResetZoom: () => {
      setZoomLevel(1);
      showShortcutNotice('Zoom Reset: 100% (Ctrl+0)');
    },
    onEscape: () => {
      if (showShortcutsModal) {
        setShowShortcutsModal(false);
      } else if (isCropMode) {
        setIsCropMode(false);
        showShortcutNotice('Exited Crop Mode (Esc)');
      } else if (isBrushMode) {
        setIsBrushMode(false);
        showShortcutNotice('Exited Brush Mode (Esc)');
      }
    },
  });

  // 1-Click Boundary Choke to instantly eliminate halo outline
  const handleChokeBoundary = (pixels: number = 1) => {
    const canvas = brushCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = canvas.toDataURL('image/png');
    setBrushUndoStack((prev) => [...prev.slice(-24), currentState]);
    setBrushRedoStack([]);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;
    const alphaCopy = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      alphaCopy[i] = data[i * 4 + 3];
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (alphaCopy[idx] > 0) {
          let hasTransparentNeighbor = false;
          for (let dy = -pixels; dy <= pixels && !hasTransparentNeighbor; dy++) {
            for (let dx = -pixels; dx <= pixels; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h || alphaCopy[ny * w + nx] < 40) {
                hasTransparentNeighbor = true;
                break;
              }
            }
          }
          if (hasTransparentNeighbor) {
            data[idx * 4 + 3] = 0;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const updated = canvas.toDataURL('image/png');
    onUpdateImage({
      ...image,
      processedUrl: updated,
    });
  };

  // Reprocess with custom tolerance or algorithm
  const reprocessImage = async (
    engine: 'neural' | 'fast' = activeEngine,
    customTol: number = tolerance,
    customFeather: number = effects.feather
  ) => {
    setIsReprocessing(true);
    setReprocessStatusText(
      'Processing with ' + (engine === 'neural' ? 'RMBG Neural AI' : 'Fast Contour') + '...'
    );
    try {
      const result = await removeBackgroundLocally(image.originalUrl, {
        preferEngine: engine,
        tolerance: customTol,
        feather: customFeather,
        decontaminate: true,
        boundingBox: image.analysis?.boundingBox,
        onProgress: (_pct, text) => {
          if (text) setReprocessStatusText(text);
        },
      });
      onUpdateImage({
        ...image,
        processedUrl: result.cutoutDataUrl,
        maskDataUrl: result.maskDataUrl,
        engineUsed: result.engineUsed,
      });
    } catch (err) {
      console.error('Reprocess error:', err);
    } finally {
      setIsReprocessing(false);
      setReprocessStatusText('');
    }
  };

  // Execute Download
  const handleExport = async () => {
    if (!image.processedUrl) return;
    try {
      const canvas = await renderCompositedCanvas(
        image.processedUrl,
        image.originalUrl,
        bgConfig,
        effects,
        exportConfig
      );
      const ext = exportConfig.format === 'jpeg' ? 'jpg' : exportConfig.format;
      const filename = `${image.name.replace(/\.[^/.]+$/, '')}_auracut.${ext}`;
      const { dataUrl } = await exportCanvasImage(canvas, filename, exportConfig);

      triggerDownload(dataUrl, filename);

      onSaveToHistory(dataUrl, bgConfig.type, exportConfig.format, canvas.width, canvas.height);
      setHasSaved(true);
      setTimeout(() => setHasSaved(false), 3000);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  // Upload Custom Background Image
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgConfig({
            ...bgConfig,
            type: 'custom',
            backdropUrl: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      {/* LEFT/CENTER: Canvas & Interactive Preview Area (cols 12 -> 8) */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        {/* ONE-CLICK PRO PRESETS BAR */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              1-Click Pro Studio Presets
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hidden sm:inline">
              Instant styling, zero halo
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {PRO_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyProPreset(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  activePresetId === p.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
                title={p.description}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Preview Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => {
                setViewMode('slider');
                setIsBrushMode(false);
                setIsCropMode(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'slider' && !isBrushMode && !isCropMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split Slider</span>
            </button>
            <button
              onClick={() => {
                setViewMode('cutout');
                setIsBrushMode(false);
                setIsCropMode(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'cutout' && !isBrushMode && !isCropMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Result Only</span>
            </button>
            <button
              onClick={() => {
                setViewMode('original');
                setIsBrushMode(false);
                setIsCropMode(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'original' && !isBrushMode && !isCropMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>
            {image.maskDataUrl && (
              <button
                onClick={() => {
                  setViewMode('mask');
                  setIsBrushMode(false);
                  setIsCropMode(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'mask' && !isBrushMode && !isCropMode
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mask</span>
              </button>
            )}
          </div>

          {/* Tools: Refine Brush, Crop Tool & Zoom */}
          <div className="flex items-center gap-2">
            {/* Cropping Tool Button */}
            <button
              onClick={() => {
                if (isCropMode) {
                  setIsCropMode(false);
                } else {
                  handleStartCrop();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                isCropMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
              title="Trim excess transparent space around subject"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Trim / Crop</span>
            </button>

            {/* Undo Crop Button if available */}
            {cropHistory.length > 0 && !isCropMode && (
              <button
                onClick={handleUndoCrop}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                title="Undo last crop"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo Crop</span>
              </button>
            )}

            {/* Touch-Up Brush Button */}
            <button
              onClick={() => {
                setIsBrushMode(!isBrushMode);
                if (!isBrushMode) {
                  setViewMode('cutout');
                  setIsCropMode(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                isBrushMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Refine Brush</span>
            </button>

            {/* Undo / Redo & Clear Workspace Buttons */}
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-1.5">
              <button
                onClick={() => {
                  if (isBrushMode && brushUndoStack.length > 0) handleUndoBrush();
                  else if (cropHistory.length > 0) handleUndoCrop();
                  else if (brushUndoStack.length > 0) handleUndoBrush();
                  else showShortcutNotice('Nothing to undo (Ctrl+Z)');
                }}
                disabled={brushUndoStack.length === 0 && cropHistory.length === 0}
                className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1"
                title="Undo last stroke or crop (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-mono text-slate-400">⌘Z</span>
              </button>
              <button
                onClick={() => {
                  if (brushRedoStack.length > 0) handleRedoBrush();
                  else showShortcutNotice('Nothing to redo (Ctrl+Y)');
                }}
                disabled={brushRedoStack.length === 0}
                className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1"
                title="Redo stroke (Ctrl+Y or ⇧⌘Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-mono text-slate-400">⌘Y</span>
              </button>
              <button
                onClick={handleClearWorkspaceOrObject}
                className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:border-red-300 transition-all flex items-center gap-1"
                title="Clear workspace modifications (Delete / Backspace)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-mono text-slate-400">Del</span>
              </button>
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                title="View Keyboard Shortcuts Cheatsheet"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                title="Zoom Out (Ctrl-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 min-w-[36px] text-center text-slate-600 dark:text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                title="Zoom In (Ctrl+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Reset Zoom (Ctrl+0)"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Keyboard Shortcut Notice Toast */}
        {shortcutFeedback && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs font-bold shadow-xl border border-slate-700/80 dark:border-slate-300 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
              <span>{shortcutFeedback}</span>
            </div>
          </div>
        )}

        {/* IN-EDITOR INSTANT STAR RATING & QUICK FEEDBACK STRIP */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-50/80 via-slate-50 to-indigo-50/60 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/40 rounded-2xl border border-amber-200/60 dark:border-slate-800 shadow-xs text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Rate this AI Cutout:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleQuickStarRate(star)}
                  className="p-0.5 focus:outline-none transition-transform hover:scale-125"
                  title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      (quickRatedStar || 0) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            {quickRatedStar && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                ★ {quickRatedStar}/5 Saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              <button
                onClick={() => handleQuickFeedbackTag('Crisp edges')}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-colors"
              >
                ✨ Crisp edges
              </button>
              <button
                onClick={() => handleQuickFeedbackTag('Hair preserved')}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-colors"
              >
                💇 Hair preserved
              </button>
              <button
                onClick={() => handleQuickFeedbackTag('Zero halo')}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-colors"
              >
                🚫 Zero halo
              </button>
            </div>

            {onOpenFeedback && (
              <button
                onClick={onOpenFeedback}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Detailed Review</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* CROPPING CONTROLS BAR (Shown when Crop Tool is Active) */}
        {isCropMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/90 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200/90 dark:border-indigo-900/80 animate-in slide-in-from-top-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Trim Transparent Space:
              </span>

              {/* One-Click Auto-Trim Buttons */}
              <button
                onClick={() => handleAutoTrim(0)}
                disabled={isAutoTrimming}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                title="Snap tightly to subject boundaries (0% extra transparent space)"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Trim Tight (0%)</span>
              </button>

              <button
                onClick={() => handleAutoTrim(5)}
                disabled={isAutoTrimming}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 shadow-sm transition-all"
                title="Trim with 5% padding (recommended for e-commerce and catalog photos)"
              >
                <span>E-comm (5%)</span>
              </button>

              <button
                onClick={() => handleAutoTrim(12)}
                disabled={isAutoTrimming}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 shadow-sm transition-all"
                title="Trim with 12% margin"
              >
                <span>Comfortable (12%)</span>
              </button>

              {/* Aspect Ratio Selector with Exact Proportion Locking */}
              <div className="flex flex-wrap items-center gap-1 pl-2 border-l border-indigo-200 dark:border-indigo-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  Aspect:
                </span>
                {(['original', '1:1', '4:5', '16:9', '9:16', '3:2', 'free'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleSetCropRatio(r)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded capitalize transition-all ${
                      cropAspectRatio === r
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={
                      r === 'original'
                        ? `Lock exact original photo aspect ratio (${imgAspect.toFixed(2)}:1)`
                        : r === 'free'
                        ? 'Freeform unconstrained crop'
                        : `${r} aspect ratio`
                    }
                  >
                    {r === 'original' ? 'Original' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancel & Apply Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelCrop}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              >
                <span>Cancel</span>
              </button>

              <button
                onClick={handleApplyCrop}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all hover:scale-105"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        )}

        {/* Refinement Eraser Controls Bar with History & Sliders */}
        {isBrushMode && (
          <div className="flex flex-col gap-2.5 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-500/40 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tool Mode Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setBrushAction('erase')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    brushAction === 'erase'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-red-500'
                  }`}
                  title="Erase unwanted background artifacts, halos or edge spill"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Refinement Eraser</span>
                </button>
                <button
                  onClick={() => setBrushAction('restore')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    brushAction === 'restore'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-emerald-500'
                  }`}
                  title="Restore original photo pixels back into the foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Details</span>
                </button>
              </div>

              {/* Sliders: Size, Hardness, Opacity */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Brush Size */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Size:</span>
                  <input
                    type="range"
                    min="4"
                    max="140"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 sm:w-24 accent-indigo-600"
                    title={`Brush diameter: ${brushSize}px`}
                  />
                  <span className="text-xs font-mono font-bold min-w-[34px] text-indigo-600 dark:text-indigo-400">
                    {brushSize}px
                  </span>
                </div>

                {/* Hardness */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Hardness:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brushHardness}
                    onChange={(e) => setBrushHardness(Number(e.target.value))}
                    className="w-16 sm:w-20 accent-indigo-600"
                    title={`Edge hardness: ${brushHardness}%`}
                  />
                  <span className="text-xs font-mono font-bold min-w-[28px] text-slate-600 dark:text-slate-300">
                    {brushHardness}%
                  </span>
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Opacity:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brushOpacity}
                    onChange={(e) => setBrushOpacity(Number(e.target.value))}
                    className="w-16 sm:w-20 accent-indigo-600"
                    title={`Stroke opacity: ${brushOpacity}%`}
                  />
                  <span className="text-xs font-mono font-bold min-w-[28px] text-slate-600 dark:text-slate-300">
                    {brushOpacity}%
                  </span>
                </div>
              </div>

              {/* Undo / Redo & Quick Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndoBrush}
                  disabled={brushUndoStack.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  title="Undo last stroke (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                  {brushUndoStack.length > 0 && (
                    <span className="text-[10px] text-indigo-500 font-mono">({brushUndoStack.length})</span>
                  )}
                </button>

                <button
                  onClick={handleRedoBrush}
                  disabled={brushRedoStack.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  title="Redo stroke (Ctrl+Y or Ctrl+Shift+Z)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Redo</span>
                  {brushRedoStack.length > 0 && (
                    <span className="text-[10px] text-indigo-500 font-mono">({brushRedoStack.length})</span>
                  )}
                </button>

                <button
                  onClick={handleResetToAICutout}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                  title="Revert all brush modifications to initial AI cutout"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Cutout</span>
                </button>

                <button
                  onClick={() => setIsBrushMode(false)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                  title="Finish touching up"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Edge Refinements */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500">1-Click Edge Refinements:</span>
              <button
                onClick={() => handleChokeBoundary(1)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 font-medium transition-colors"
                title="Erase 1px boundary halo all around the subject"
              >
                Trim Fringe (-1px)
              </button>
              <button
                onClick={() => handleChokeBoundary(2)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 font-medium transition-colors"
                title="Erase 2px boundary halo for stubborn background outlines"
              >
                Trim Fringe (-2px)
              </button>
              <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                Hover over cutout to see brush cursor • One-finger touch supported on mobile
              </span>
            </div>
          </div>
        )}

        {/* Main Canvas Container with Checkerboard Background */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 select-none shadow-inner flex items-center justify-center bg-slate-100 dark:bg-slate-950"
          style={{
            backgroundImage:
              bgConfig.type === 'transparent'
                ? `repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 20px 20px`
                : undefined,
          }}
        >
          <div
            className="relative max-w-full max-h-full transition-transform duration-75 flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* View Mode 1: Split Slider */}
            {viewMode === 'slider' && !isBrushMode && !isCropMode && (
              <div className="relative overflow-hidden rounded-xl shadow-lg">
                <img
                  src={compositedPreviewUrl}
                  alt="Processed cutout"
                  className="block max-h-[60vh] object-contain pointer-events-none"
                />

                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={image.originalUrl}
                    alt="Original"
                    className="block max-h-[60vh] object-contain pointer-events-none max-w-none"
                    style={{
                      width: containerRef.current
                        ? containerRef.current.querySelector('img')?.clientWidth
                        : 'auto',
                    }}
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-sm text-white">
                    Original
                  </span>
                </div>

                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-600/80 backdrop-blur-sm text-white">
                  AuraCut
                </span>

                <div
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="w-8 h-8 -ml-3.5 rounded-full bg-white text-indigo-600 shadow-md border border-slate-200 flex items-center justify-center">
                    <SplitSquareVertical className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 2: Cutout / Result Only (when not in crop mode) */}
            {viewMode === 'cutout' && !isBrushMode && !isCropMode && (
              <img
                src={compositedPreviewUrl}
                alt="Processed Result"
                className="max-h-[60vh] object-contain rounded-xl shadow-lg"
              />
            )}

            {/* View Mode 3: Original Only */}
            {viewMode === 'original' && !isBrushMode && !isCropMode && (
              <img
                src={image.originalUrl}
                alt="Original source"
                className="max-h-[60vh] object-contain rounded-xl shadow-lg"
              />
            )}

            {/* View Mode 4: Mask View */}
            {viewMode === 'mask' && !isBrushMode && !isCropMode && image.maskDataUrl && (
              <img
                src={image.maskDataUrl}
                alt="Alpha Mask"
                className="max-h-[60vh] object-contain rounded-xl shadow-lg invert"
              />
            )}

            {/* INTERACTIVE CROP BOX OVERLAY */}
            {isCropMode && (
              <div
                ref={cropContainerRef}
                className="relative max-h-[60vh] select-none inline-block overflow-hidden shadow-2xl rounded-xl"
              >
                <img
                  src={image.processedUrl || image.originalUrl}
                  alt="Crop preview"
                  className="block max-h-[60vh] object-contain pointer-events-none"
                />

                {/* Darkened overlay outside the crop box */}
                {/* Top shaded band */}
                <div
                  className="absolute top-0 left-0 right-0 bg-black/60 pointer-events-none"
                  style={{ height: `${cropBox.y}%` }}
                />
                {/* Bottom shaded band */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-black/60 pointer-events-none"
                  style={{ height: `${Math.max(0, 100 - cropBox.y - cropBox.height)}%` }}
                />
                {/* Left shaded band */}
                <div
                  className="absolute bg-black/60 pointer-events-none"
                  style={{
                    top: `${cropBox.y}%`,
                    height: `${cropBox.height}%`,
                    left: 0,
                    width: `${cropBox.x}%`,
                  }}
                />
                {/* Right shaded band */}
                <div
                  className="absolute bg-black/60 pointer-events-none"
                  style={{
                    top: `${cropBox.y}%`,
                    height: `${cropBox.height}%`,
                    right: 0,
                    width: `${Math.max(0, 100 - cropBox.x - cropBox.width)}%`,
                  }}
                />

                {/* Active Resizable Crop Box */}
                <div
                  onMouseDown={(e) => startCropDrag(e, 'move')}
                  onTouchStart={(e) => startCropDragTouch(e, 'move')}
                  className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move select-none"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`,
                  }}
                >
                  {/* Live Exact Dimension & Aspect Ratio Lock Badge */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/95 text-white text-[10px] font-mono font-bold tracking-wide shadow-md whitespace-nowrap flex items-center gap-1.5 pointer-events-none select-none border border-white/20">
                    {cropAspectRatio !== 'free' ? (
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Unlock className="w-2.5 h-2.5 text-amber-400" />
                    )}
                    <span>
                      {Math.round((cropBox.width / 100) * image.width)} × {Math.round((cropBox.height / 100) * image.height)} px
                    </span>
                    <span className="text-indigo-300 font-semibold uppercase">
                      ({cropAspectRatio === 'original' ? 'Original Ratio' : cropAspectRatio})
                    </span>
                  </div>

                  {/* Rule of Thirds Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div />
                  </div>

                  {/* 4 Corner Handles */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 'nw');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 'nw');
                    }}
                    className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 'ne');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 'ne');
                    }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 'sw');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 'sw');
                    }}
                    className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 'se');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 'se');
                    }}
                    className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />

                  {/* 4 Edge Midpoint Handles */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 'n');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 'n');
                    }}
                    className="absolute -top-2 left-1/2 -ml-3.5 w-7 h-3 bg-white border border-indigo-600 rounded-full cursor-ns-resize shadow"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 's');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 's');
                    }}
                    className="absolute -bottom-2 left-1/2 -ml-3.5 w-7 h-3 bg-white border border-indigo-600 rounded-full cursor-ns-resize shadow"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 'w');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 'w');
                    }}
                    className="absolute -left-2 top-1/2 -mt-3.5 h-7 w-3 bg-white border border-indigo-600 rounded-full cursor-ew-resize shadow"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startCropDrag(e, 'e');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startCropDragTouch(e, 'e');
                    }}
                    className="absolute -right-2 top-1/2 -mt-3.5 h-7 w-3 bg-white border border-indigo-600 rounded-full cursor-ew-resize shadow"
                  />
                </div>
              </div>
            )}

            {/* Fine-Tuning Interactive Refinement Eraser Canvas */}
            {isBrushMode && image.processedUrl && (
              <div
                className="relative inline-block select-none touch-none"
                onMouseLeave={() => {
                  setCursorPos((prev) => ({ ...prev, visible: false }));
                  handleBrushEnd();
                }}
              >
                <canvas
                  ref={brushCanvasRef}
                  width={image.width || 800}
                  height={image.height || 600}
                  onMouseDown={(e) => handleBrushStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleBrushMove(e.clientX, e.clientY)}
                  onMouseUp={handleBrushEnd}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      e.preventDefault();
                      handleBrushStart(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 1) {
                      e.preventDefault();
                      handleBrushMove(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleBrushEnd();
                  }}
                  className="max-h-[60vh] object-contain cursor-none rounded-xl shadow-2xl border-2 border-indigo-500/80 bg-transparent"
                />

                {/* Live Brush Cursor Overlay Indicator */}
                {cursorPos.visible && brushCanvasRef.current && (() => {
                  const rect = brushCanvasRef.current.getBoundingClientRect();
                  const scaleRatio = rect.width / (brushCanvasRef.current.width || 1);
                  const displayRadius = Math.max(3, (brushSize / 2) * scaleRatio);
                  const x = cursorPos.x - rect.left;
                  const y = cursorPos.y - rect.top;

                  return (
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div
                        className={`rounded-full border-2 transition-transform duration-75 flex items-center justify-center ${
                          brushAction === 'erase'
                            ? 'border-red-500 bg-red-500/15 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                            : 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        }`}
                        style={{
                          width: `${displayRadius * 2}px`,
                          height: `${displayRadius * 2}px`,
                        }}
                      >
                        <div
                          className={`w-1 h-1 rounded-full ${
                            brushAction === 'erase' ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        brushAction === 'erase' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                    Mode: <strong className="text-slate-800 dark:text-slate-200">{brushAction === 'erase' ? 'Erase Artifacts & Halos' : 'Restore Photo Details'}</strong>
                  </span>
                  <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Ctrl+Z</kbd> Undo • <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Ctrl+Y</kbd> Redo</span>
                </div>
              </div>
            )}
          </div>

          {/* Main Processing Overlay */}
          {(image.status === 'processing' || isReprocessing) && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-white">
                  {isReprocessing ? 'Re-Cutting Subject with AI...' : 'Cutting Out Background with Deep Neural AI'}
                </h4>
                <p className="text-xs text-indigo-300 font-medium">
                  {reprocessStatusText || image.progressText || 'Detecting subject contours & preserving fine hair...'}
                </p>
              </div>
              <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${image.progress || 60}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {image.progress || 60}%
              </span>
            </div>
          )}

          {/* Quick composite rendering indicator */}
          {isRenderingComposite && !isReprocessing && image.status !== 'processing' && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-xs font-medium z-10">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Updating render...</span>
            </div>
          )}
        </div>

        {/* Gemini AI Semantic Analysis & Pro Tips */}
        {image.analysis && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {image.analysis.subject}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {Math.round(image.analysis.confidence * 100)}% accuracy
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Category: {image.analysis.category} • Contours defringed & preserved
                </p>
              </div>
            </div>

            {image.analysis.dominantColors && image.analysis.dominantColors.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  AI Palette:
                </span>
                {image.analysis.dominantColors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setBgConfig({ ...bgConfig, type: 'solid', color })}
                    className="w-5 h-5 rounded-full border border-white dark:border-slate-800 shadow-sm hover:scale-125 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Apply ${color}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Studio Customization & Export Panel (cols 12 -> 4) */}
      <div className="lg:col-span-4 space-y-5 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Section 0: AI Cutout Precision & Defringe / Edge Choke */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/30 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                AI Cutout Precision
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
              {image.engineUsed === 'neural_deep_learning' ? '🧠 Neural Model' : '⚡ Contour Matte'}
            </span>
          </div>

          {/* Engine Selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-bold">
            <button
              onClick={() => {
                setActiveEngine('neural');
                reprocessImage('neural', tolerance);
              }}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeEngine === 'neural'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <span>🧠 RMBG Neural</span>
            </button>
            <button
              onClick={() => {
                setActiveEngine('fast');
                reprocessImage('fast', tolerance);
              }}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeEngine === 'fast'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <span>⚡ Fast Matte</span>
            </button>
          </div>

          {/* Edge Defringe (Halo & Outline Remover) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <span>Edge Defringe (Halo Remover):</span>
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {effects.edgeChoke}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="0.5"
              value={effects.edgeChoke}
              onChange={(e) => setEffects({ ...effects, edgeChoke: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
            <p className="text-[10px] text-slate-500">
              Eats away any faint background outline or colored edge residue.
            </p>
          </div>

          {/* Sensitivity */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <span>Cutout Sensitivity:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{tolerance}</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              onMouseUp={() => reprocessImage(activeEngine, tolerance)}
              onTouchEnd={() => reprocessImage(activeEngine, tolerance)}
              className="w-full accent-indigo-600"
            />
          </div>

          <button
            onClick={() => reprocessImage(activeEngine, tolerance)}
            disabled={isReprocessing}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'Re-Cutting Subject...' : 'Re-Cut Image with AI'}</span>
          </button>
        </div>

        {/* Section 1: Background Studio */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              Background Styling
            </h3>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              {bgConfig.type}
            </span>
          </div>

          {/* Background Type Selector Pills */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setBgConfig({ ...bgConfig, type: 'transparent' })}
              className={`py-1.5 rounded-lg transition-all ${
                bgConfig.type === 'transparent'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Transparent
            </button>
            <button
              onClick={() => setBgConfig({ ...bgConfig, type: 'solid' })}
              className={`py-1.5 rounded-lg transition-all ${
                bgConfig.type === 'solid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Color
            </button>
            <button
              onClick={() => setBgConfig({ ...bgConfig, type: 'gradient' })}
              className={`py-1.5 rounded-lg transition-all ${
                bgConfig.type === 'gradient'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Gradient
            </button>
            <button
              onClick={() =>
                setBgConfig({
                  ...bgConfig,
                  type: 'studio',
                  backdropUrl: STUDIO_BACKDROPS[0].fullUrl,
                })
              }
              className={`py-1.5 rounded-lg transition-all ${
                bgConfig.type === 'studio'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => setBgConfig({ ...bgConfig, type: 'blur' })}
              className={`py-1.5 rounded-lg transition-all ${
                bgConfig.type === 'blur'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Blur Original
            </button>
            <button
              onClick={() => customBgInputRef.current?.click()}
              className={`py-1.5 rounded-lg transition-all ${
                bgConfig.type === 'custom'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Custom Image
            </button>
          </div>

          <input
            ref={customBgInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomBgUpload}
            className="hidden"
          />

          {bgConfig.type === 'solid' && (
            <div className="space-y-2 pt-1 animate-in fade-in">
              <div className="flex flex-wrap gap-2">
                {SOLID_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setBgConfig({ ...bgConfig, color: hex })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      bgConfig.color === hex
                        ? 'border-indigo-600 scale-110 shadow-sm'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={bgConfig.color}
                  onChange={(e) => setBgConfig({ ...bgConfig, color: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5"
                />
                <input
                  type="text"
                  value={bgConfig.color}
                  onChange={(e) => setBgConfig({ ...bgConfig, color: e.target.value })}
                  className="w-24 text-xs font-mono uppercase px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
                />
                <span className="text-[11px] text-slate-500">Pick any HEX</span>
              </div>
            </div>
          )}

          {bgConfig.type === 'gradient' && (
            <div className="grid grid-cols-3 gap-2 pt-1 animate-in fade-in">
              {GRADIENT_PRESETS.map((grad, i) => (
                <button
                  key={i}
                  onClick={() => setBgConfig({ ...bgConfig, gradient: grad.value })}
                  className={`h-10 rounded-xl border-2 transition-transform hover:scale-105 relative overflow-hidden ${
                    bgConfig.gradient === grad.value
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                      : 'border-transparent'
                  }`}
                  style={{ background: grad.value }}
                  title={grad.name}
                >
                  {bgConfig.gradient === grad.value && (
                    <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          )}

          {bgConfig.type === 'studio' && (
            <div className="grid grid-cols-3 gap-2 pt-1 animate-in fade-in">
              {STUDIO_BACKDROPS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setBgConfig({ ...bgConfig, backdropUrl: st.fullUrl })}
                  className={`h-12 rounded-xl border-2 overflow-hidden relative group transition-transform hover:scale-105 ${
                    bgConfig.backdropUrl === st.fullUrl
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                      : 'border-transparent'
                  }`}
                  title={st.name}
                >
                  <img src={st.thumbnail} alt={st.name} className="w-full h-full object-cover" />
                  {bgConfig.backdropUrl === st.fullUrl && (
                    <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {bgConfig.type === 'blur' && (
            <div className="space-y-1 pt-1 animate-in fade-in">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Blur Strength:</span>
                <span className="font-mono text-indigo-600">{bgConfig.blurAmount}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                value={bgConfig.blurAmount}
                onChange={(e) => setBgConfig({ ...bgConfig, blurAmount: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>
          )}
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Section 2: Pro Studio Shadows & Reflections */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-purple-500" />
            Studio Shadows & Reflections
          </h3>

          {/* Shadow Selector Tabs */}
          <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Pro Shadow Type
              </span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase">
                {effects.shadow.enabled ? effects.shadow.type : 'None'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl text-[11px] font-bold">
              <button
                onClick={() =>
                  setEffects({ ...effects, shadow: { ...effects.shadow, enabled: false } })
                }
                className={`py-1 rounded-lg ${
                  !effects.shadow.enabled ? 'bg-indigo-600 text-white' : 'text-slate-500'
                }`}
              >
                None
              </button>
              <button
                onClick={() =>
                  setEffects({
                    ...effects,
                    shadow: { ...effects.shadow, enabled: true, type: 'drop', blur: 20, offsetY: 14 },
                  })
                }
                className={`py-1 rounded-lg ${
                  effects.shadow.enabled && effects.shadow.type === 'drop'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500'
                }`}
              >
                Floating
              </button>
              <button
                onClick={() =>
                  setEffects({
                    ...effects,
                    shadow: {
                      ...effects.shadow,
                      enabled: true,
                      type: 'contact',
                      blur: 16,
                      offsetY: 8,
                    },
                  })
                }
                className={`py-1 rounded-lg ${
                  effects.shadow.enabled && effects.shadow.type === 'contact'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500'
                }`}
              >
                Contact
              </button>
              <button
                onClick={() =>
                  setEffects({
                    ...effects,
                    shadow: { ...effects.shadow, enabled: true, type: 'cast', blur: 20 },
                  })
                }
                className={`py-1 rounded-lg ${
                  effects.shadow.enabled && effects.shadow.type === 'cast'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500'
                }`}
              >
                3D Cast
              </button>
            </div>

            {effects.shadow.enabled && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Shadow Opacity:</span>
                  <span className="font-mono">{Math.round(effects.shadow.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={effects.shadow.opacity}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      shadow: { ...effects.shadow, opacity: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600"
                />

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Shadow Softness (Blur):</span>
                  <span className="font-mono">{effects.shadow.blur}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="45"
                  value={effects.shadow.blur}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      shadow: { ...effects.shadow, blur: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Floor Reflection Toggle */}
          <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Floor Mirror Reflection (Luxury)
              </span>
              <input
                type="checkbox"
                checked={effects.reflection.enabled}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    reflection: { ...effects.reflection, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
            {effects.reflection.enabled && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Reflection Opacity:</span>
                  <span className="font-mono">
                    {Math.round(effects.reflection.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.6"
                  step="0.05"
                  value={effects.reflection.opacity}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      reflection: { ...effects.reflection, opacity: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Sticker Outline (Off by default - only if user specifically wants a sticker) */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Sticker Outline (YouTube Style)
              </span>
              <input
                type="checkbox"
                checked={effects.outline.enabled}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    outline: {
                      ...effects.outline,
                      enabled: e.target.checked,
                      width: e.target.checked ? Math.max(6, effects.outline.width) : 0,
                    },
                  })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
            {effects.outline.enabled && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Border Thickness:</span>
                  <span className="font-mono">{effects.outline.width}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  value={effects.outline.width}
                  onChange={(e) =>
                    setEffects({
                      ...effects,
                      outline: { ...effects.outline, width: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Section 3: Subject Lighting & Color Adjustments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5 text-amber-500" />
              Subject Color & Lighting
            </h3>
            <button
              onClick={() =>
                setEffects({
                  ...effects,
                  colorAdjustments: { brightness: 1, contrast: 1, saturation: 1, colorHarmonize: false },
                })
              }
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Brightness:</span>
                <span className="font-mono">{Math.round(effects.colorAdjustments.brightness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={effects.colorAdjustments.brightness}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    colorAdjustments: {
                      ...effects.colorAdjustments,
                      brightness: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Contrast:</span>
                <span className="font-mono">{Math.round(effects.colorAdjustments.contrast * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={effects.colorAdjustments.contrast}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    colorAdjustments: {
                      ...effects.colorAdjustments,
                      contrast: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Vibrance / Saturation:</span>
                <span className="font-mono">{Math.round(effects.colorAdjustments.saturation * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.6"
                step="0.05"
                value={effects.colorAdjustments.saturation}
                onChange={(e) =>
                  setEffects({
                    ...effects,
                    colorAdjustments: {
                      ...effects.colorAdjustments,
                      saturation: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Section 4: Export & Output Options */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            Export Settings
          </h3>

          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            {(['png', 'webp', 'jpeg', 'svg'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportConfig({ ...exportConfig, format: fmt })}
                className={`py-1.5 rounded-lg uppercase transition-all ${
                  exportConfig.format === fmt
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Exact Aspect Ratio & Dimensions Info Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                Exact Output Resolution:
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {exportConfig.dimensionPreset === 'instagram-post'
                  ? '1080 × 1080 px (1:1)'
                  : exportConfig.dimensionPreset === 'instagram-story'
                  ? '1080 × 1920 px (9:16)'
                  : exportConfig.dimensionPreset === 'youtube-thumb'
                  ? '1280 × 720 px (16:9)'
                  : exportConfig.dimensionPreset === 'passport'
                  ? '600 × 750 px'
                  : `${Math.round(image.width * (exportConfig.scale || 1))} × ${Math.round(
                      image.height * (exportConfig.scale || 1)
                    )} px (${imgAspect.toFixed(2)}:1)`}
              </span>
            </div>

            {/* Resolution Scaling */}
            {exportConfig.dimensionPreset === 'original' && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                <span className="text-slate-500 font-medium">Quality Scale:</span>
                <div className="flex items-center gap-1 font-bold">
                  {[
                    { label: '0.5x Web', scale: 0.5 },
                    { label: '1x Exact Original', scale: 1 },
                    { label: '2x Ultra-HD', scale: 2 },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      onClick={() => setExportConfig({ ...exportConfig, scale: s.scale })}
                      className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                        (exportConfig.scale || 1) === s.scale
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Preset Dimension:</span>
            <select
              value={exportConfig.dimensionPreset}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  dimensionPreset: e.target.value as ExportConfig['dimensionPreset'],
                })
              }
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="original">Original Aspect (High-Res Exact)</option>
              <option value="instagram-post">Instagram Post (1:1 - 1080x1080)</option>
              <option value="instagram-story">Story / TikTok (9:16 - 1080x1920)</option>
              <option value="youtube-thumb">YouTube Thumbnail (16:9 - 1280x720)</option>
              <option value="passport">Passport / ID Photo (600x750)</option>
              <option value="square">Square Frame</option>
            </select>
          </div>

          {(exportConfig.format === 'webp' || exportConfig.format === 'jpeg') && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Compression Quality:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {Math.round((exportConfig.quality || 0.95) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.0"
                step="0.05"
                value={exportConfig.quality || 0.95}
                onChange={(e) =>
                  setExportConfig({ ...exportConfig, quality: Number(e.target.value) })
                }
                className="w-full accent-emerald-600"
              />
            </div>
          )}

          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Download {exportConfig.format.toUpperCase()}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUploadToCloudinary(compositedPreviewUrl)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Save to Cloud</span>
            </button>
            <button
              onClick={() => onOpenShare(compositedPreviewUrl, image.originalUrl)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Work</span>
            </button>
          </div>

          {hasSaved && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
              <BookmarkCheck className="w-4 h-4" />
              <span>Saved to History!</span>
            </div>
          )}
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Keyboard Shortcuts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Speed up background editing with standard keys
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 py-2 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Undo last stroke / crop
                </span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                  Ctrl + Z / ⌘Z
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Redo stroke</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                  Ctrl + Y / ⇧⌘Z
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Clear / Reset workspace edits
                </span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                  Delete / Backspace
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Toggle Refinement Eraser
                </span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                  B
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Toggle Crop & Trim Tool
                </span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                  C
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Decrease / Increase Brush Size
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                    [
                  </kbd>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                    ]
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Zoom In / Zoom Out
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                    Ctrl +
                  </kbd>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                    Ctrl -
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Reset Zoom (100%)
                </span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                  Ctrl + 0
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Cancel / Close Active Tool
                </span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-[11px] shadow-xs">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
