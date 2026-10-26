import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  RefreshCw,
  FolderArchive,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';
import { BackgroundConfig, ExportConfig, ImageItem } from '../types';
import { removeBackgroundLocally } from '../utils/aiSegmentation';
import {
  GRADIENT_PRESETS,
  SOLID_COLOR_PRESETS,
  exportCanvasImage,
  renderCompositedCanvas,
  triggerDownload,
} from '../utils/canvasEffects';

interface BatchProcessorProps {
  images: ImageItem[];
  onUpdateImages: (updated: ImageItem[]) => void;
  onSelectImageForStudio: (item: ImageItem) => void;
  onAddMoreImages: (files: File[]) => void;
  onClearBatch: () => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  images,
  onUpdateImages,
  onSelectImageForStudio,
  onAddMoreImages,
  onClearBatch,
}) => {
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [isZipping, setIsZipping] = useState(false);

  // Global batch background styling
  const [globalBg, setGlobalBg] = useState<BackgroundConfig>({
    type: 'transparent',
    color: '#ffffff',
    gradient: GRADIENT_PRESETS[0].value,
    blurAmount: 16,
  });

  const [batchFormat, setBatchFormat] = useState<'png' | 'webp' | 'jpeg'>('png');

  // Process a single item
  const processSingle = async (index: number, queue: ImageItem[]): Promise<ImageItem> => {
    const item = queue[index];
    if (item.status === 'done' && item.processedUrl) return item;

    try {
      const result = await removeBackgroundLocally(item.originalUrl, {
        feather: 1.5,
        tolerance: 28,
      });
      return {
        ...item,
        status: 'done',
        progress: 100,
        processedUrl: result.cutoutDataUrl,
        maskDataUrl: result.maskDataUrl,
        width: result.width,
        height: result.height,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        error: err?.message || 'Processing failed',
      };
    }
  };

  // Start processing all queued images sequentially
  const handleProcessAll = async () => {
    setIsProcessingAll(true);
    let updatedQueue = [...images];

    for (let i = 0; i < updatedQueue.length; i++) {
      if (updatedQueue[i].status !== 'done') {
        setCurrentProcessingIndex(i);
        updatedQueue[i] = { ...updatedQueue[i], status: 'processing', progress: 50 };
        onUpdateImages([...updatedQueue]);

        const processed = await processSingle(i, updatedQueue);
        updatedQueue[i] = processed;
        onUpdateImages([...updatedQueue]);
      }
    }

    setCurrentProcessingIndex(-1);
    setIsProcessingAll(false);
  };

  // Download all processed images bundled in a ZIP archive
  const handleDownloadAllZip = async () => {
    const readyItems = images.filter((img) => img.status === 'done' && img.processedUrl);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const exportConf: ExportConfig = {
        format: batchFormat,
        quality: 0.95,
        scale: 1,
        dimensionPreset: 'original',
      };

      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        const canvas = await renderCompositedCanvas(
          item.processedUrl!,
          item.originalUrl,
          globalBg,
          {
            shadow: { enabled: false, type: 'drop', blur: 0, offsetX: 0, offsetY: 0, opacity: 0, color: '' },
            outline: { enabled: false, width: 0, color: '' },
            reflection: { enabled: false, opacity: 0, distance: 0 },
            colorAdjustments: { brightness: 1, contrast: 1, saturation: 1, colorHarmonize: false },
            edgeChoke: 1.0,
            autoCropPadding: 0,
            feather: 1.5,
            decontaminate: 50,
            invert: false,
          },
          exportConf
        );

        const { blob } = await exportCanvasImage(canvas, item.name, exportConf);
        const ext = batchFormat === 'jpeg' ? 'jpg' : batchFormat;
        const filename = `${item.name.replace(/\.[^/.]+$/, '')}_auracut.${ext}`;
        zip.file(filename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      triggerDownload(zipUrl, `auracut_batch_${readyItems.length}_images.zip`);
    } catch (e) {
      console.error('ZIP generation error:', e);
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = images.filter((i) => i.status === 'done').length;
  const progressPct = images.length > 0 ? Math.round((completedCount / images.length) * 100) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Batch Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Batch Cutout Studio
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {images.length} images queued
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Process multiple e-commerce, portrait, or product images simultaneously.
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global Background Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
            <span className="text-slate-500 font-medium">Batch BG:</span>
            <select
              value={globalBg.type}
              onChange={(e) => setGlobalBg({ ...globalBg, type: e.target.value as any })}
              className="font-bold bg-transparent text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="transparent">Transparent PNG</option>
              <option value="solid">Pure White (E-commerce)</option>
              <option value="gradient">Cosmic Gradient</option>
            </select>
          </div>

          {/* Batch Format */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            {(['png', 'webp', 'jpeg'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setBatchFormat(fmt)}
                className={`px-2 py-1 rounded-lg uppercase ${
                  batchFormat === fmt
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Process All Button */}
          <button
            onClick={handleProcessAll}
            disabled={isProcessingAll || images.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 disabled:opacity-50 transition-all"
          >
            {isProcessingAll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing {completedCount + 1}/{images.length}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Process All</span>
              </>
            )}
          </button>

          {/* Download All as ZIP */}
          <button
            onClick={handleDownloadAllZip}
            disabled={completedCount === 0 || isZipping}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 disabled:opacity-50 transition-all"
          >
            {isZipping ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating ZIP...</span>
              </>
            ) : (
              <>
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Download All (ZIP)</span>
              </>
            )}
          </button>

          <button
            onClick={onClearBatch}
            title="Clear all"
            className="p-2 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {images.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Overall Batch Progress</span>
            <span>
              {completedCount} of {images.length} ready ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid of Images in Batch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((item, idx) => (
          <div
            key={item.id}
            className={`group relative rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 transition-all shadow-sm ${
              currentProcessingIndex === idx
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
            }`}
          >
            {/* Preview image */}
            <div
              className="aspect-square w-full relative flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950"
              style={{
                backgroundImage:
                  item.status === 'done' && globalBg.type === 'transparent'
                    ? `repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 16px 16px`
                    : undefined,
                background:
                  item.status === 'done' && globalBg.type === 'gradient'
                    ? globalBg.gradient
                    : item.status === 'done' && globalBg.type === 'solid'
                    ? '#ffffff'
                    : undefined,
              }}
            >
              <img
                src={item.processedUrl || item.originalUrl}
                alt={item.name}
                className="max-h-full max-w-full object-contain p-2"
              />

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                {item.status === 'done' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </span>
                )}
                {item.status === 'processing' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Cutting out...
                  </span>
                )}
                {item.status === 'idle' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/70 text-slate-200 backdrop-blur-sm">
                    Queued
                  </span>
                )}
              </div>

              {/* Quick actions on hover */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <button
                  onClick={() => onSelectImageForStudio(item)}
                  className="p-2 rounded-xl bg-white text-indigo-600 font-bold text-xs flex items-center gap-1 shadow-lg hover:bg-slate-100"
                  title="Open in Studio for detailed editing"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Edit in Studio</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                {item.name}
              </span>

              {item.status === 'done' && item.processedUrl && (
                <button
                  onClick={() => {
                    const ext = batchFormat === 'jpeg' ? 'jpg' : batchFormat;
                    triggerDownload(
                      item.processedUrl!,
                      `${item.name.replace(/\.[^/.]+$/, '')}_auracut.${ext}`
                    );
                  }}
                  className="p-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  title="Download single file"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add More Card */}
        <label className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white/40 dark:bg-slate-900/40">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold">Add more images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                onAddMoreImages(Array.from(e.target.files));
              }
            }}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
