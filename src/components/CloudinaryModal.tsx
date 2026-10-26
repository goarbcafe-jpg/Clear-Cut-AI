import React, { useState } from 'react';
import { X, Cloud, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck, ExternalLink } from 'lucide-react';
import { CloudinaryConfig } from '../types';

interface CloudinaryModalProps {
  config: CloudinaryConfig;
  onSaveConfig: (updated: CloudinaryConfig) => void;
  onClose: () => void;
}

export const CloudinaryModal: React.FC<CloudinaryModalProps> = ({
  config,
  onSaveConfig,
  onClose,
}) => {
  const [cloudName, setCloudName] = useState(config.cloudName);
  const [uploadPreset, setUploadPreset] = useState(config.uploadPreset);
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      if (cloudName.trim() && uploadPreset.trim()) {
        // Test connectivity with a 1x1 test pixel
        const testPixel =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        const res = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: testPixel,
            cloudName: cloudName.trim(),
            uploadPreset: uploadPreset.trim(),
            filename: 'test_connection',
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const updated: CloudinaryConfig = {
            cloudName: cloudName.trim(),
            uploadPreset: uploadPreset.trim(),
            apiKey: apiKey.trim(),
            isConnected: true,
          };
          onSaveConfig(updated);
          setStatusMessage('Successfully connected to Cloudinary!');
          setTimeout(() => onClose(), 1200);
        } else {
          throw new Error(data.error || 'Could not verify preset');
        }
      } else {
        // Use built-in managed Cloudinary proxy
        const updated: CloudinaryConfig = {
          cloudName: '',
          uploadPreset: '',
          apiKey: '',
          isConnected: false,
        };
        onSaveConfig(updated);
        setStatusMessage('Using AuraCut High-Speed Cloud Vault (Built-in)');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err?.message || 'Connection failed. Please check Cloud Name and Preset.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cloudinary Integration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seamless media storage, transformations & CDN delivery
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-3 text-xs rounded-xl border ${
              isError
                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200'
            }`}
          >
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero-Setup Default Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            AuraCut includes a built-in server-side media cloud vault out-of-the-box. To upload directly into your personal Cloudinary dashboard and CDN, provide your credentials below.
          </p>
        </div>

        <form onSubmit={handleTestAndSave} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cloudinary Cloud Name
            </label>
            <input
              type="text"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="e.g. my-app-cloud"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Upload Preset (Unsigned)
            </label>
            <input
              type="text"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="e.g. ml_default or auracut_preset"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              API Key (Optional)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. 123456789012345"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isTesting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Connection...</span>
              </>
            ) : (
              <span>Save & Connect</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
