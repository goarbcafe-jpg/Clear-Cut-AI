import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  processedUrl: string;
  originalUrl: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ processedUrl, originalUrl, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const shareText = encodeURIComponent(
    'Just created this clean AI background cutout with @AuraCutAI! Check it out:'
  );
  const currentUrl = encodeURIComponent(window.location.origin);

  const socialLinks = [
    {
      name: 'X (Twitter)',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`,
      color: 'bg-black text-white hover:bg-slate-800',
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`,
      color: 'bg-[#0077b5] text-white hover:bg-[#006097]',
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      url: `https://api.whatsapp.com/send?text=${shareText}%20${currentUrl}`,
      color: 'bg-[#25D366] text-white hover:bg-[#1ebd59]',
    },
    {
      name: 'Telegram',
      icon: <Send className="w-4 h-4" />,
      url: `https://t.me/share/url?url=${currentUrl}&text=${shareText}`,
      color: 'bg-[#0088cc] text-white hover:bg-[#0077b5]',
    },
    {
      name: 'Pinterest',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.357-.053.211-.174.256-.402.155-1.499-.696-2.435-2.883-2.435-4.639 0-3.775 2.743-7.243 7.906-7.243 4.15 0 7.375 2.957 7.375 6.909 0 4.124-2.599 7.442-6.208 7.442-1.213 0-2.353-.631-2.744-1.377l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      ),
      url: `https://pinterest.com/pin/create/button/?url=${currentUrl}&media=${encodeURIComponent(
        processedUrl
      )}&description=${shareText}`,
      color: 'bg-[#E60023] text-white hover:bg-[#c8001f]',
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyImageToClipboard = async () => {
    try {
      const response = await fetch(processedUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch {
      // Fallback: Copy link
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Share Your Cutout
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish instantly to social networks or paste into Photoshop & Figma
          </p>
        </div>

        {/* Thumbnail Preview */}
        <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative p-3">
          <div
            className="w-full h-full flex items-center justify-center rounded-xl"
            style={{
              backgroundImage: `repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 14px 14px`,
            }}
          >
            <img src={processedUrl} alt="Cutout" className="max-h-full max-w-full object-contain" />
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {socialLinks.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-transform hover:scale-[1.02] shadow-sm ${s.color}`}
            >
              {s.icon}
              <span>{s.name}</span>
            </a>
          ))}
        </div>

        {/* Direct Actions: Copy to Clipboard */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCopyImageToClipboard}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            {copiedImage ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Image Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Image to Clipboard (Paste in Figma/Photoshop)</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-xs transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Copy Applet Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
