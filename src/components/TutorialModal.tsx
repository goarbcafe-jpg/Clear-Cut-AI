import React, { useState } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  Palette,
  Sliders,
  Download,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Layers,
  Laptop,
} from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: '1. Select or Drop Your Images',
    subtitle: 'Upload any photo or try instant sample images in 1 click',
    icon: <UploadCloud className="w-8 h-8 text-indigo-500" />,
    description:
      'Drag and drop any JPG, PNG, or WebP photo into the studio. Need to process an entire collection? Switch to Batch Mode to process multiple photos simultaneously.',
    tip: 'Tip: Click any of the 4 preloaded sample photos on the home screen to test immediately!',
  },
  {
    title: '2. Automatic AI Cutout Engine',
    subtitle: 'Preserves fine hair, e-commerce contours, and tricky glass edges',
    icon: <Sparkles className="w-8 h-8 text-purple-500" />,
    description:
      'The engine automatically detects the subject and computes an ultra-clean alpha mask. Works 100% offline in your browser, or with Gemini AI when online for semantic analysis.',
    tip: 'Use the Split Comparison Slider to inspect before-and-after edges with pixel precision.',
  },
  {
    title: '3. Background Styling Studio',
    subtitle: 'Transparent, Studio Scenes, Solid E-commerce White, or Gradients',
    icon: <Palette className="w-8 h-8 text-pink-500" />,
    description:
      'Choose from transparent alpha, solid colors (pure white for Amazon/eBay e-commerce), studio backdrops (desk, loft, botanical), or blur the original background for depth-of-field DSLR portraits.',
    tip: 'You can also upload your own custom background photo from your device!',
  },
  {
    title: '4. Sticker Outlines & Drop Shadows',
    subtitle: 'Create YouTube thumbnails, stickers, and 3D product pop',
    icon: <Sliders className="w-8 h-8 text-amber-500" />,
    description:
      'Add a smooth white or colored sticker outline border with adjustable stroke width. Add realistic drop shadows with blur, offset, and opacity controls.',
    tip: 'Activate "Refine Brush" to manually erase or restore any tricky edge hairs or details.',
  },
  {
    title: '5. Multi-Format Export & Cloud Sync',
    subtitle: 'Export in PNG, WebP, JPEG, SVG or sync to Cloudinary',
    icon: <Download className="w-8 h-8 text-emerald-500" />,
    description:
      'Export in your favorite format with social dimensions (Instagram 1:1, Story 9:16, YouTube 16:9). Save your work to the Cloud Vault or share directly to social media.',
    tip: 'Login with Google or Email to store your past edits and access them anytime, anywhere.',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const step = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Progress Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {TUTORIAL_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-indigo-600'
                  : idx < currentStep
                  ? 'w-3 bg-indigo-300 dark:bg-indigo-900'
                  : 'w-3 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Visual & Card */}
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto shadow-inner">
            {step.icon}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {step.title}
            </h3>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {step.subtitle}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
            {step.description}
          </p>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 text-left flex items-start gap-2">
            <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>{step.tip}</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-0 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <>
                <span>Get Started</span>
                <Check className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
