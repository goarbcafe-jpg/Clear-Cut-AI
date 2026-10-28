import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Zap,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Camera,
  ShoppingBag,
  Wand2,
  CreditCard,
  Layers,
  Clipboard,
  Star,
} from 'lucide-react';
import { MainNavTab } from '../types';
import { SAMPLE_IMAGES, SampleImage } from '../utils/storage';

interface DropzoneProps {
  onImagesSelected: (files: File[]) => void;
  onSelectSample: (sample: SampleImage) => void;
  onNavigateTab?: (tab: MainNavTab) => void;
  onOpenFeedback?: () => void;
  onOpenPricing?: (planId?: 'plan_monthly' | 'plan_twomonth' | 'plan_sixmonth') => void;
  onOpenBackgroundApi?: () => void;
  isProcessing?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onImagesSelected,
  onSelectSample,
  onNavigateTab,
  onOpenFeedback,
  onOpenPricing,
  onOpenBackgroundApi,
  isProcessing = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Global & local clipboard paste (Ctrl+V / Cmd+V) support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const validFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        e.preventDefault();
        onImagesSelected(validFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImagesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onImagesSelected(validFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onImagesSelected(validFiles);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Headline */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80">
          <Sparkles className="w-3.5 h-3.5" />
          <span>GURUCUT AI — Studio Background Remover</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Remove Image Backgrounds{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Instantly & Accurately
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Edge-preserving cutout for portraits, e-commerce, hair, and complex objects.
          Runs locally offline or with Gemini AI neural intelligence.
        </p>

        {/* 6-Month Plan & Free Trial Highlight Bar */}
        {onOpenPricing && (
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/30 border border-indigo-200/80 dark:border-indigo-800/80 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
              BEST VALUE
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              6-Month Plan: <strong>₹299 for 180 days</strong> (Only ₹49.83/mo • Unlimited removals)
            </span>
            <button
              onClick={() => onOpenPricing('plan_sixmonth')}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 ml-1"
            >
              <span>View Plans</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            {onOpenBackgroundApi && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  onClick={onOpenBackgroundApi}
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Background API
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-900'
        } shadow-sm backdrop-blur-sm`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Dedicated camera capture for mobile/touch devices */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform cursor-pointer"
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Drag and drop your images here
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-700"
              >
                browse files
              </button>{' '}
              from your device
            </p>
          </div>

          {/* Action Buttons: Browse & Camera Capture */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Choose Photo</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-indigo-500" />
              <span>Camera Capture</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clipboard className="w-3.5 h-3.5 text-indigo-500" />
              Paste (Ctrl+V / ⌘V)
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Batch uploads supported
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              PNG, JPG, WebP up to 30MB
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Works 100% offline
            </span>
          </div>
        </div>
      </div>

      {/* Feature Discovery Quick Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            title: 'AI Backgrounds',
            desc: 'Generate studio scenes with lighting',
            icon: Wand2,
            tab: 'ai-studio',
          },
          {
            title: 'Product Studio',
            desc: 'E-commerce 1:1, 4:5 & pedestal shadows',
            icon: ShoppingBag,
            tab: 'ai-studio',
          },
          {
            title: 'Batch Cutouts',
            desc: 'Process dozens of images in bulk',
            icon: Layers,
            tab: 'batch',
          },
          {
            title: 'Passport & ID',
            desc: 'Official biometric 2x2 & ID sizes',
            icon: CreditCard,
            tab: 'ai-studio',
          },
        ].map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab?.(feat.tab as any)}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {feat.title}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Community Star Rating & Creator Trust Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-200/70 dark:border-amber-800/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex flex-col items-center justify-center font-black shadow-md shadow-amber-400/20 shrink-0">
            <span className="text-base leading-none">4.9</span>
            <div className="flex -space-x-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-2 h-2 fill-slate-950 text-slate-950" />
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Loved by Creators, Photographers & Brands
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hidden md:inline">
                99.4% Edge Accuracy
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Rated 4.9/5 based on 1,280+ photo cutouts. Hair-edge refinement, zero halos, and instant ZIP archival.
            </p>
          </div>
        </div>

        {onOpenFeedback && (
          <button
            type="button"
            onClick={onOpenFeedback}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs hover:border-amber-400 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Read Reviews & Rate</span>
          </button>
        )}
      </div>

      {/* No photo right now? Try Instant Sample Images */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
            No image handy? Try these high-res sample presets:
          </span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hidden sm:inline">
            1-Click Instant Test
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-400 transition-all"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">
                  {sample.category}
                </span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {sample.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {sample.description}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
