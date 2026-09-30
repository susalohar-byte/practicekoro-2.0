import React, { useState, useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon, Sparkles, RefreshCw, Link2 } from 'lucide-react';
import type { TestSeries } from '@/types';

export interface PresetIcon {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const PRESET_SERIES_ICONS: PresetIcon[] = [
  { id: 'wbp', name: 'West Bengal Police (WBP)', category: 'Police', url: '/images/exams/emblem_wbp.png' },
  { id: 'kp', name: 'Kolkata Police (KP)', category: 'Police', url: '/images/exams/icon_kolkata_police.png' },
  { id: 'wbpsc', name: 'WBPSC (Clerkship / Misc)', category: 'WBPSC', url: '/images/exams/emblem_wbpsc.png' },
  { id: 'wbcs', name: 'WBCS Executive', category: 'WBPSC', url: '/images/exams/wbcs_emblem.png' },
  { id: 'wbssc', name: 'WBSSC Group C & D / SLST', category: 'Teaching', url: '/images/exams/emblem_wbssc.png' },
  { id: 'tet', name: 'Primary TET / Teaching', category: 'Teaching', url: '/images/exams/emblem_tet.png' },
  { id: 'railway', name: 'Indian Railways (RRB)', category: 'Central', url: '/images/exams/emblem_railway.png' },
  { id: 'ssc', name: 'SSC (CGL, GD, MTS)', category: 'Central', url: '/images/exams/emblem_ssc.png' },
  { id: 'practicekoro', name: 'PracticeKoro Official', category: 'General', url: '/logo-icon-circle.png' },
];

interface UploadSeriesIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: TestSeries;
  currentIconUrl?: string;
  onSaveIcon: (seriesId: string, iconUrl: string | undefined) => Promise<void>;
}

export const UploadSeriesIconModal: React.FC<UploadSeriesIconModalProps> = ({
  isOpen,
  onClose,
  series,
  currentIconUrl,
  onSaveIcon,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedIcon, setSelectedIcon] = useState<string>(currentIconUrl || '');
  const [customUrl, setCustomUrl] = useState<string>(currentIconUrl?.startsWith('http') ? currentIconUrl : '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process file upload and compress to lightweight 192x192 dataUrl
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be below 5MB.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 192;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setSelectedIcon(event.target?.result as string);
          setIsProcessing(false);
          return;
        }

        // Draw image centered in square canvas with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        const compressedDataUrl = canvas.toDataURL('image/webp', 0.92);
        setSelectedIcon(compressedDataUrl);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setErrorMsg('Failed to process image file.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMsg('');
      const finalUrl = activeTab === 'url' ? customUrl.trim() : selectedIcon;
      await onSaveIcon(series.id, finalUrl || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save icon. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      setIsSaving(true);
      setErrorMsg('');
      await onSaveIcon(series.id, undefined);
      setSelectedIcon('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset icon.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewDisplayUrl = activeTab === 'url' ? (customUrl.trim() || '/images/exams/emblem_wbp.png') : (selectedIcon || '/images/exams/emblem_wbp.png');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0158FC] flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Upload Series Icon
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                {series.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-[#FFF4F0] dark:bg-slate-800 border border-[#FDE2D7] dark:border-slate-700/60 p-2.5 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src={previewDisplayUrl}
              alt="Icon Preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-icon-circle.png';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#0158FC] dark:text-blue-400">
              Live Card Preview
            </p>
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
              {series.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedIcon ? 'Custom icon selected' : 'Using default exam emblem'}
            </p>
          </div>
          {currentIconUrl && (
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isSaving}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 transition-all shrink-0"
            >
              Reset Default
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-600 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Tab Controls */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`py-2 px-3 rounded-xl transition-all ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Exam Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-3 rounded-xl transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-2 px-3 rounded-xl transition-all ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Image URL
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Choose from official West Bengal & Central exam emblems:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_SERIES_ICONS.map((preset) => {
                  const isChosen = selectedIcon === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedIcon(preset.url)}
                      className={`relative flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                        isChosen
                          ? 'border-[#0158FC] bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#FFF4F0] dark:bg-slate-800 border border-[#FDE2D7] dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {preset.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {preset.category}
                        </p>
                      </div>
                      {isChosen && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#0158FC] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileProcess(file);
                }}
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-[#0158FC] bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 text-[#0158FC] shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  {isProcessing ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isProcessing ? 'Processing image...' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PNG, JPG, SVG, WebP (Max 5MB)
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  Browse Image
                </button>
              </div>

              {selectedIcon && selectedIcon.startsWith('data:image') && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Custom file loaded & ready to save!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedIcon('')}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Direct Image Link
              </label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0158FC]"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Paste any publicly accessible image URL.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isProcessing}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0158FC] hover:bg-[#0047D4] active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save Icon</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
