import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Sliders,
  Eraser,
  CreditCard,
  Wand2,
  Download,
  Check,
  RotateCcw,
  SunMedium,
  Palette,
  Layers,
  ArrowRight,
  Maximize2,
  ShieldCheck,
  Eye,
  Camera,
  Box,
} from 'lucide-react';
import { AIStudioTab, BackgroundConfig, ImageItem } from '../types';
import { triggerDownload } from '../utils/canvasEffects';

interface AIStudioProps {
  currentImage: ImageItem | null;
  onApplyBackgroundToEditor: (bg: BackgroundConfig) => void;
  onOpenInEditor: (item: ImageItem) => void;
  onNavigateTab: (tab: 'editor' | 'home' | 'projects') => void;
}

export const AIStudio: React.FC<AIStudioProps> = ({
  currentImage,
  onApplyBackgroundToEditor,
  onOpenInEditor,
  onNavigateTab,
}) => {
  const [activeTool, setActiveTool] = useState<AIStudioTab>('bg-generator');

  // AI Background Generator State
  const [bgPrompt, setBgPrompt] = useState('Luxury white marble pedestal with warm soft morning shadows and golden sunlight');
  const [bgCategory, setBgCategory] = useState('studio');
  const [bgMood, setBgMood] = useState<'warm' | 'cool' | 'neutral' | 'dramatic'>('warm');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [generatedBackdrop, setGeneratedBackdrop] = useState<{
    title: string;
    gradient: string;
    dominantColors: string[];
    shadowColor: string;
    advice: string;
    preset?: string;
  } | null>({
    title: 'Luxury Marble Studio',
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    dominantColors: ['#f8fafc', '#e2e8f0', '#0f172a'],
    shadowColor: 'rgba(15, 23, 42, 0.4)',
    advice: 'Position the foreground subject centered with a soft contact shadow under the base.',
  });

  // Product Studio State
  const [productRatio, setProductRatio] = useState<'1:1' | '4:5' | '3:4' | '16:9'>('1:1');
  const [pedestalType, setPedestalType] = useState<'marble' | 'wood' | 'dark' | 'floating'>('marble');
  const [productShadowStrength, setProductShadowStrength] = useState(65);

  // Enhancement State
  const [sharpness, setSharpness] = useState(40);
  const [portraitGlow, setPortraitGlow] = useState(30);
  const [relightingColor, setRelightingColor] = useState<'none' | 'warm' | 'cool' | 'cyber'>('warm');

  // Passport Photo State
  const [passportStandard, setPassportStandard] = useState<'us' | 'schengen' | 'id'>('us');
  const [passportBgColor, setPassportBgColor] = useState('#ffffff');
  const [showGuideOverlay, setShowGuideOverlay] = useState(true);

  // Inpainting / Object Removal
  const [magicEraseDone, setMagicEraseDone] = useState(false);

  // Handle AI Background Generation
  const handleGenerateBackground = async () => {
    if (!bgPrompt.trim()) return;
    setIsGeneratingBg(true);
    try {
      const res = await fetch('/api/ai/generate-backdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: bgPrompt,
          category: bgCategory,
          mood: bgMood,
          subjectCategory: currentImage?.analysis?.category || 'general',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.backdrop) {
          setGeneratedBackdrop(data.backdrop);
        }
      }
    } catch (e) {
      console.warn('Generate backdrop error:', e);
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const handleApplyToCanvas = () => {
    if (!generatedBackdrop) return;
    onApplyBackgroundToEditor({
      type: 'gradient',
      color: generatedBackdrop.dominantColors[0] || '#ffffff',
      gradient: generatedBackdrop.gradient,
      blurAmount: 0,
    });
    onNavigateTab('editor');
  };

  const PROMPT_SUGGESTIONS = [
    'Minimalist oak wood table with soft window sunlight',
    'Neon cyberpunk city street with blue and magenta rim reflections',
    'Clean e-commerce white showroom with floating soft ambient shadow',
    'Luxury velvet cosmetic podium with pastel rose tones',
    'Lush tropical green monstera leaves backdrop with dappled light',
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Studio Header & Navigation Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AuraCut AI Creative Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Professional AI Photo Tools
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Smart background generation, e-commerce product layouts, portrait enhancement, and passport formatting.
          </p>
        </div>

        {currentImage?.processedUrl ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">
                {currentImage.name}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('editor')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              Open in Editor
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigateTab('home')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Upload Image to Start
          </button>
        )}
      </div>

      {/* Main Studio Tools Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'bg-generator', label: 'AI Background Generator', icon: Wand2 },
          { id: 'product', label: 'Product Photo Studio', icon: ShoppingBag },
          { id: 'enhancement', label: 'Photo & Face Enhancement', icon: SunMedium },
          { id: 'object-removal', label: 'Object Remover (Inpainting)', icon: Eraser },
          { id: 'passport', label: 'Passport & ID Creator', icon: CreditCard },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as AIStudioTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* TOOL 1: AI BACKGROUND GENERATOR */}
      {activeTool === 'bg-generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Describe Your Scene or Backdrop
                </label>
                <textarea
                  value={bgPrompt}
                  onChange={(e) => setBgPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g., Luxury minimalist marble pedestal with soft sunlight and palm leaf shadow..."
                  className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Prompt Ideas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Try these popular styles:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBgPrompt(item)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      {item.split(' ')[0]} {item.split(' ')[1]}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Mood */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category</label>
                  <select
                    value={bgCategory}
                    onChange={(e) => setBgCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="studio">Studio Minimal</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="nature">Nature & Botanical</option>
                    <option value="luxury">Luxury & Gold</option>
                    <option value="cyber">Cyber Neon</option>
                    <option value="office">Modern Office</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Lighting Mood</label>
                  <select
                    value={bgMood}
                    onChange={(e) => setBgMood(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="warm">Warm Sunlight</option>
                    <option value="cool">Cool Daylight</option>
                    <option value="neutral">Studio Neutral</option>
                    <option value="dramatic">Dramatic Contrast</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateBackground}
                disabled={isGeneratingBg}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingBg ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Generating Lighting & Backdrop...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Backdrop</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Backdrop & Lighting Preview
                </span>
                <span className="text-xs font-semibold text-indigo-500">
                  {generatedBackdrop?.title || 'Backdrop'}
                </span>
              </div>

              {/* Visual Preview Box */}
              <div
                className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-6 transition-all"
                style={{
                  background: generatedBackdrop?.gradient || '#ffffff',
                }}
              >
                {/* Subject on backdrop if available */}
                {currentImage?.processedUrl ? (
                  <div className="relative max-h-full max-w-full flex items-center justify-center">
                    <img
                      src={currentImage.processedUrl}
                      alt="Subject"
                      className="max-h-56 object-contain z-10 transition-transform"
                      style={{
                        filter: `drop-shadow(0px 16px 20px ${generatedBackdrop?.shadowColor || 'rgba(0,0,0,0.4)'})`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-4 rounded-xl bg-black/40 backdrop-blur-md text-white text-xs max-w-sm">
                    <Box className="w-6 h-6 mx-auto mb-1 text-indigo-300" />
                    Upload an image or select a sample on Home to see your subject live on this backdrop!
                  </div>
                )}
              </div>

              {/* Lighting Palette Badges & Placement Advice */}
              {generatedBackdrop && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Color Palette Harmony:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {generatedBackdrop.dominantColors?.map((c, i) => (
                        <span
                          key={i}
                          className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    💡 <span className="font-medium text-slate-700 dark:text-slate-300">Director Tip:</span> {generatedBackdrop.advice}
                  </p>
                </div>
              )}

              {/* Apply Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleApplyToCanvas}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Behind Subject in Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: PRODUCT PHOTOGRAPHY STUDIO (E-COMMERCE) */}
      {activeTool === 'product' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Marketplace Aspect Ratio
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '1:1', label: '1:1 Square', sub: 'Amazon / Instagram' },
                  { id: '4:5', label: '4:5 Portrait', sub: 'Shopify / Etsy' },
                  { id: '3:4', label: '3:4 Catalog', sub: 'Lookbook / Fashion' },
                  { id: '16:9', label: '16:9 Banner', sub: 'Web Hero Store' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setProductRatio(r.id as any)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      productRatio === r.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-400">{r.sub}</div>
                  </button>
                ))}
              </div>

              {/* Pedestal & Surface Type */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Pedestal & Surface Studio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'marble', label: 'Marble Stone' },
                    { id: 'wood', label: 'Warm Wood' },
                    { id: 'dark', label: 'Titanium Dark' },
                    { id: 'floating', label: 'Floating Soft Shadow' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPedestalType(p.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        pedestalType === p.id
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Shadow Intensity */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Contact Shadow Weight
                  </span>
                  <span className="font-mono text-indigo-500">{productShadowStrength}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={productShadowStrength}
                  onChange={(e) => setProductShadowStrength(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <button
                onClick={() => {
                  onApplyBackgroundToEditor({
                    type: 'solid',
                    color: pedestalType === 'dark' ? '#0f172a' : '#ffffff',
                    gradient: '',
                    blurAmount: 0,
                  });
                  onNavigateTab('editor');
                }}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                Transfer to Editor Canvas
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div
              className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-8 transition-all ${
                productRatio === '1:1'
                  ? 'aspect-square max-w-sm'
                  : productRatio === '4:5'
                  ? 'aspect-[4/5] max-w-xs'
                  : productRatio === '3:4'
                  ? 'aspect-[3/4] max-w-xs'
                  : 'aspect-video max-w-md'
              } w-full`}
              style={{
                backgroundColor: pedestalType === 'dark' ? '#090d16' : '#f8fafc',
              }}
            >
              {currentImage?.processedUrl ? (
                <div className="relative flex flex-col items-center justify-center">
                  <img
                    src={currentImage.processedUrl}
                    alt="Product"
                    className="max-h-64 object-contain z-10"
                    style={{
                      filter: `drop-shadow(0px ${Math.round(
                        productShadowStrength / 5
                      )}px ${Math.round(productShadowStrength / 3)}px rgba(0, 0, 0, ${
                        productShadowStrength / 100
                      }))`,
                    }}
                  />
                  {/* Surface Podium Base */}
                  <div
                    className="w-48 h-6 rounded-full mt-[-8px] blur-[3px] transition-all"
                    style={{
                      backgroundColor:
                        pedestalType === 'wood'
                          ? 'rgba(180, 83, 9, 0.4)'
                          : pedestalType === 'dark'
                          ? 'rgba(0, 0, 0, 0.8)'
                          : 'rgba(15, 23, 42, 0.35)',
                    }}
                  />
                </div>
              ) : (
                <div className="text-center p-4 text-xs text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                  Product Cutout Preview
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-3">
              Standard {productRatio} Commercial Format ({productRatio === '1:1' ? '2000 × 2000' : '2000 × 2500'} px)
            </div>
          </div>
        </div>
      )}

      {/* TOOL 3: PHOTO & FACE ENHANCEMENT */}
      {activeTool === 'enhancement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                AI Clarity & Edge Polish
              </h3>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Micro-Contrast & Sharpening
                  </span>
                  <span className="font-mono text-indigo-500">+{sharpness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sharpness}
                  onChange={(e) => setSharpness(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Portrait Soft Glow & Skin Polish
                  </span>
                  <span className="font-mono text-indigo-500">+{portraitGlow}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={portraitGlow}
                  onChange={(e) => setPortraitGlow(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Studio Relighting Color Tone */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Studio Edge Relighting
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Neutral (None)' },
                    { id: 'warm', label: 'Golden Hour Rim' },
                    { id: 'cool', label: 'Cool Daylight Edge' },
                    { id: 'cyber', label: 'Cyber Violet Neon' },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setRelightingColor(tone.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        relightingColor === tone.id
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('editor')}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                Apply Adjustments to Editor
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative aspect-square max-w-sm w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
              {currentImage?.processedUrl ? (
                <img
                  src={currentImage.processedUrl}
                  alt="Enhanced subject"
                  className="max-h-64 object-contain transition-all"
                  style={{
                    filter: `contrast(${1 + sharpness / 200}) brightness(${
                      1 + portraitGlow / 300
                    }) ${
                      relightingColor === 'warm'
                        ? 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.45))'
                        : relightingColor === 'cool'
                        ? 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.45))'
                        : relightingColor === 'cyber'
                        ? 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.55))'
                        : 'none'
                    }`,
                  }}
                />
              ) : (
                <div className="text-center text-xs text-slate-400">
                  <SunMedium className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                  Select an image to preview enhancement
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 4: OBJECT REMOVER (INPAINTING) */}
      {activeTool === 'object-removal' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Eraser className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Magic Object & Blemish Eraser
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Easily erase unwanted photobombers, cables, blemishes, or objects from your cutouts using our dual-mode restore & erase brush inside the Editor.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('editor')}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all inline-flex items-center gap-2"
            >
              <span>Open Precision Touch Brush in Editor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOOL 5: PASSPORT & ID MAKER */}
      {activeTool === 'passport' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Biometric Passport Dimensions
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'us', label: 'US Passport / Visa', size: '2 × 2 inches (600 × 600 px)' },
                  { id: 'schengen', label: 'Schengen / UK / India', size: '35 × 45 mm (413 × 531 px)' },
                  { id: 'id', label: 'Standard Photo ID', size: '30 × 40 mm (354 × 472 px)' },
                ].map((std) => (
                  <button
                    key={std.id}
                    onClick={() => setPassportStandard(std.id as any)}
                    className={`w-full p-3 rounded-2xl text-left border transition-all ${
                      passportStandard === std.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{std.label}</div>
                    <div className="text-[10px] text-slate-400">{std.size}</div>
                  </button>
                ))}
              </div>

              {/* Background Color */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Government Required Background
                </label>
                <div className="flex gap-2">
                  {[
                    { color: '#ffffff', label: 'Official White' },
                    { color: '#e0f2fe', label: 'Light Blue' },
                    { color: '#f1f5f9', label: 'Light Gray' },
                  ].map((bg) => (
                    <button
                      key={bg.color}
                      onClick={() => setPassportBgColor(bg.color)}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                        passportBgColor === bg.color
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-inner"
                        style={{ backgroundColor: bg.color }}
                      />
                      <span>{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Show Biometric Face Crosshair Guide
                </span>
                <input
                  type="checkbox"
                  checked={showGuideOverlay}
                  onChange={(e) => setShowGuideOverlay(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => {
                  onApplyBackgroundToEditor({
                    type: 'solid',
                    color: passportBgColor,
                    gradient: '',
                    blurAmount: 0,
                  });
                  onNavigateTab('editor');
                }}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                Set Passport Frame in Editor
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-400 flex items-center justify-center transition-all ${
                passportStandard === 'us' ? 'aspect-square max-w-xs' : 'aspect-[35/45] max-w-xs'
              } w-full`}
              style={{ backgroundColor: passportBgColor }}
            >
              {currentImage?.processedUrl ? (
                <img
                  src={currentImage.processedUrl}
                  alt="Passport cutout"
                  className="max-h-60 object-contain z-10"
                />
              ) : (
                <div className="text-center text-xs text-slate-400">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                  Passport Photo Preview
                </div>
              )}

              {/* Biometric Guideline Oval Overlay */}
              {showGuideOverlay && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-36 h-48 rounded-[50%] border border-indigo-400/70 border-dashed relative">
                    {/* Eye line */}
                    <div className="absolute top-16 left-0 right-0 border-b border-indigo-400/50"></div>
                  </div>
                  <span className="absolute bottom-2 text-[10px] text-indigo-500/80 font-mono font-semibold">
                    Align Eyes & Crown inside Guide
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-3">
              Standard Biometric Compliance Verified
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
