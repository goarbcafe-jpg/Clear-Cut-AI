import React from 'react';
import { History, Download, Trash2, ExternalLink, Calendar, CloudCheck, HardDrive, Sparkles } from 'lucide-react';
import { HistoryItem } from '../types';
import { triggerDownload } from '../utils/canvasEffects';

interface HistoryModalProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClose: () => void;
  isOnline: boolean;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  items,
  onSelectItem,
  onDeleteItem,
  onClose,
  isOnline,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Saved Edits & Vault
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your background removal projects, synced in real-time and available offline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <span>{items.length} projects stored</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No saved edits yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Process an image in the Studio or Batch tool and download or save it to store your work here.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all"
          >
            Start Editing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between"
            >
              <div
                className="aspect-square w-full relative flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950 cursor-pointer"
                onClick={() => onSelectItem(it)}
                style={{
                  backgroundImage: `repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 16px 16px`,
                }}
              >
                <img
                  src={it.thumbnailUrl || it.processedUrl}
                  alt={it.name}
                  className="max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                />

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-white backdrop-blur-sm">
                    {it.format}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-600 text-white">
                    {it.backgroundType}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                    {it.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(it.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onSelectItem(it)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in Studio</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        triggerDownload(it.processedUrl, `${it.name}_auracut.${it.format}`)
                      }
                      title="Download image"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(it.id)}
                      title="Delete edit"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
