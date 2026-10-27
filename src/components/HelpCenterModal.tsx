import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  Sparkles,
  Scissors,
  Layers,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'cutout' | 'brush' | 'export' | 'troubleshooting';
}

const FAQS: FAQItem[] = [
  {
    category: 'cutout',
    question: 'How does the AI background removal engine work?',
    answer:
      'ClearCut AI uses a dual-engine architecture. For everyday photos, the Deep Neural RMBG edge engine performs human and object segmentation with alpha contour analysis. For complex backgrounds, our contour matte engine isolates subject boundaries with zero halo outlines.',
  },
  {
    category: 'brush',
    question: 'How do I use the Refinement Eraser tool?',
    answer:
      'Click "Refine Brush" in the Editor toolbar. Switch between "Refinement Eraser" (to clean away halo fringing or unwanted background artifacts) and "Restore Details" (to paint back original photo details like hair flyaways or subtle clothing textures). Adjust brush size, hardness (soft airbrush vs. crisp cut), and opacity. Use Ctrl+Z to undo and Ctrl+Y to redo any stroke.',
  },
  {
    category: 'cutout',
    question: 'How do I trim excess transparent space around my cutout?',
    answer:
      'Click the "Trim / Crop" button in the Editor. You can use 1-Click Auto-Trim Tight (0% padding) to automatically snap the bounding box to the subject, or lock standard aspect ratios like Original (exact photo ratio), 1:1 Square (e-commerce), or 4:5 (Instagram portrait).',
  },
  {
    category: 'export',
    question: 'Why does my exported JPG have a background instead of transparency?',
    answer:
      'The JPG format does not support alpha transparency channels by design. When saving with transparent backgrounds, choose PNG or WebP format. If exporting as JPG, our studio automatically flattens against your selected background color or studio preset.',
  },
  {
    category: 'troubleshooting',
    question: 'Can I edit images when offline without an Internet connection?',
    answer:
      'Yes! ClearCut AI is fully PWA-enabled with client-side AI processing. You can cut out backgrounds, refine with brushes, adjust shadows, and export images completely offline. Changes automatically sync when your connection returns.',
  },
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenFeedback,
}) => {
  const [activeTab, setActiveTab] = useState<'guides' | 'faqs' | 'support'>('guides');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  if (!isOpen) return null;

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSent(true);
    setTimeout(() => {
      setSupportSent(false);
      setSupportMessage('');
      setSupportEmail('');
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Help & Knowledge Center</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              User manuals, edge refinement tutorials, and quick troubleshooting
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3">
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'guides'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Studio Guides
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'faqs'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Frequently Asked Questions
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'support'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Contact Support
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1 scrollbar-thin">
          {activeTab === 'guides' && (
            <div className="space-y-3">
              {/* Guide 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>1. Automatic Cutout & Precision Outline Removal</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Upload any JPG, PNG, or WebP photo. The AI automatically isolates people, cars, clothes, and products. If a thin outline from the old background remains, select <strong>"Pure Cutout (No Outline)"</strong> or adjust Edge Choke in effects to tuck the alpha boundary in by 1-2 pixels.
                </p>
              </div>

              {/* Guide 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                  <Scissors className="w-4 h-4" />
                  <span>2. Manual Refinement Eraser & Detail Restoration</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enter <strong>Refine Brush</strong> mode. Switch to <strong>Refinement Eraser</strong> to scrub away stray background artifacts, or <strong>Restore Details</strong> to bring back fine flyaway hair. Multi-level Undo/Redo preserves every stroke, accessible via keyboard shortcuts (<kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Ctrl+Z</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Ctrl+Y</kbd>).
                </p>
              </div>

              {/* Guide 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>3. Studio Lighting, Backdrops & Contact Shadows</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Add professional studio realism in seconds. Choose from Amazon/Shopify Pure White, Oak Desk, Neon Cyberpunk, or custom uploaded backdrops. Turn on <strong>Contact Shadows</strong> to give your products weight and ground them naturally.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'faqs' && (
            <div className="space-y-2">
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-indigo-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'support' && (
            <div>
              {supportSent ? (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Message Received!</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Our technical support team has logged your inquiry and will respond to your provided email address shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendSupport} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Email (for response)
                    </label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Describe the Problem or Question
                    </label>
                    <textarea
                      required
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={4}
                      placeholder="Describe what image or tool you were using, what happened, and any error message..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFeedback();
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Give star rating instead →
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Ticket</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
