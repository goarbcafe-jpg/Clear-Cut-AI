import React, { useState } from 'react';
import {
  X,
  Code2,
  Terminal,
  Zap,
  Sparkles,
  Download,
  Copy,
  Check,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ImageItem, User, UserSubscription } from '../types';

interface BackgroundApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  entitlement: UserSubscription | null;
  onOpenPricing: () => void;
  onOpenInEditor?: (item: ImageItem) => void;
  onSubscriptionUpdated?: (updated: UserSubscription) => void;
}

export const BackgroundApiModal: React.FC<BackgroundApiModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  entitlement,
  onOpenPricing,
  onOpenInEditor,
  onSubscriptionUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'playground' | 'docs' | 'curl'>('playground');
  const [testImageBase64, setTestImageBase64] = useState<string | null>(null);
  const [testResultBase64, setTestResultBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUnlimited = entitlement?.isPremium && entitlement?.unlimitedStandardRemovals;
  const trialLeft = entitlement?.trialRemaining ?? 3;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTestImageBase64(reader.result as string);
        setTestResultBase64(null);
        setErrorText(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunBackgroundApi = async () => {
    if (!testImageBase64) return;
    setIsProcessing(true);
    setErrorText(null);
    setStatusText('Sending request to /api/background-api/remove...');

    try {
      const token = localStorage.getItem('auracut_auth_token');
      const res = await fetch('/api/background-api/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: testImageBase64,
          options: {
            format: 'png',
            edgeChoke: 1.0,
            feather: 1.5,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        if (res.status === 403 && errJson.code === 'UPGRADE_REQUIRED') {
          throw new Error('Trial limit reached (3/3 used). Please upgrade to Monthly (₹121) or Two-Month (₹198) plan for unlimited background removals.');
        }
        throw new Error(errJson.error || 'Background API request failed');
      }

      const data = await res.json();
      setStatusText('Refining edges and synthesizing transparent alpha channel...');
      setTestResultBase64(data.processedUrl || testImageBase64);

      if (data.entitlement && onSubscriptionUpdated) {
        onSubscriptionUpdated(data.entitlement);
      }
    } catch (err: any) {
      setErrorText(err.message || 'API request error');
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const curlSnippet = `curl -X POST https://your-domain.com/api/background-api/remove \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -d '{
    "imageBase64": "data:image/jpeg;base64,...",
    "options": { "format": "png", "edgeChoke": 1.0 }
  }'`;

  const jsFetchSnippet = `const response = await fetch('/api/background-api/remove', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + authToken
  },
  body: JSON.stringify({
    imageBase64: base64DataUrl,
    options: { format: 'png' }
  })
});
const data = await response.json();
console.log('Transparent PNG Result:', data.processedUrl);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-y-auto max-h-[92vh] flex flex-col space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  GURUCUT AI — Background API
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  v1.2 REST
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                High-performance server-side segmentation API with transparent PNG output
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Allowance:</span>
            <span className={`px-2.5 py-1 rounded-xl font-bold ${
              isUnlimited
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}>
              {isUnlimited ? 'Unlimited Active' : `${trialLeft} / 3 Free Trial`}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'playground'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            API Live Playground
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'docs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            JavaScript SDK / Fetch
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'curl'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            cURL Example
          </button>
        </div>

        {/* Tab 1: Live Playground */}
        {activeTab === 'playground' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Input side */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Input Image Source
                </span>
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/60 dark:bg-slate-800/40 text-center transition-all aspect-[4/3]">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {testImageBase64 ? (
                    <img
                      src={testImageBase64}
                      alt="Test input"
                      className="max-h-full max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Upload Image to Test
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        JPEG, PNG, WEBP up to 25MB
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Output side */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  API Response Result (Transparent PNG)
                </span>
                <div className="relative flex items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] bg-slate-100 dark:bg-slate-900/80 aspect-[4/3] overflow-hidden">
                  {testResultBase64 ? (
                    <img
                      src={testResultBase64}
                      alt="API Output"
                      className="max-h-full max-w-full object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="text-center text-xs text-slate-400">
                      {isProcessing ? (
                        <div className="space-y-2 flex flex-col items-center">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="text-indigo-600 font-semibold">{statusText}</span>
                        </div>
                      ) : (
                        <span>Output will appear here after API call</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errorText && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{errorText}</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs shrink-0 hover:bg-amber-700"
                >
                  View Plans
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunBackgroundApi}
                  disabled={!testImageBase64 || isProcessing}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Execute Background API Call</span>
                    </>
                  )}
                </button>

                {testResultBase64 && onOpenInEditor && (
                  <button
                    onClick={() => {
                      onOpenInEditor({
                        id: 'api_' + Date.now(),
                        name: 'API_Cutout.png',
                        originalUrl: testImageBase64 || '',
                        processedUrl: testResultBase64,
                        status: 'done',
                        progress: 100,
                        width: 800,
                        height: 600,
                      });
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                  >
                    <span>Open in Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isUnlimited && trialLeft <= 1 && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Upgrade to Unlimited Standard Removals (₹121 / mo)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: JavaScript SDK */}
        {activeTab === 'docs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Frontend / Node.js integration</span>
              <button
                onClick={() => handleCopy(jsFetchSnippet, 'js')}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold"
              >
                {copiedCode === 'js' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'js' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {jsFetchSnippet}
            </pre>
          </div>
        )}

        {/* Tab 3: cURL */}
        {activeTab === 'curl' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>CLI & Backend Server Request</span>
              <button
                onClick={() => handleCopy(curlSnippet, 'curl')}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold"
              >
                {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'curl' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {curlSnippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
