import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import {
  X,
  Palette,
  Sparkles,
  Upload,
  ArrowRight,
  Shield,
  Layers,
  Eye,
  Calendar,
} from 'lucide-react';
import type { Exam, PopularExamCard } from '@/types';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export const PRESET_GRADIENTS = [
  {
    name: 'WBP Royal Blue',
    start: '#0084FF',
    end: '#0048C6',
    arrow: '#026BFC',
    badge: 'from-[#0084FF] to-[#0048C6]',
  },
  {
    name: 'KP Vibrant Violet',
    start: '#9B27F4',
    end: '#5E09BD',
    arrow: '#8B5CF6',
    badge: 'from-[#9B27F4] to-[#5E09BD]',
  },
  {
    name: 'SSC Sunset Amber',
    start: '#F97316',
    end: '#C22B00',
    arrow: '#EA580C',
    badge: 'from-[#F97316] to-[#C22B00]',
  },
  {
    name: 'Railways Emerald',
    start: '#10B981',
    end: '#047857',
    arrow: '#059669',
    badge: 'from-[#10B981] to-[#047857]',
  },
  {
    name: 'WBPSC Ruby Crimson',
    start: '#E11D48',
    end: '#9F1239',
    arrow: '#BE123C',
    badge: 'from-[#E11D48] to-[#9F1239]',
  },
  {
    name: 'Midnight Navy',
    start: '#2563EB',
    end: '#1E3A8A',
    arrow: '#1D4ED8',
    badge: 'from-[#2563EB] to-[#1E3A8A]',
  },
];

interface PopularExamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: PopularExamCard | null;
  onSave: (card: PopularExamCard) => Promise<void>;
  existingExams: Exam[];
}

export const PopularExamEditModal: React.FC<PopularExamEditModalProps> = ({
  isOpen,
  onClose,
  card,
  onSave,
  existingExams,
}) => {
  const [title, setTitle] = useState(card?.title || '');
  const [testsCount, setTestsCount] = useState(card?.testsCount || '100+ Tests');
  const [cardBadge, setCardBadge] = useState(card?.cardBadge || card?.testsCount || '100+ Tests');
  const [cardGradientStart, setCardGradientStart] = useState(card?.cardGradientStart || '#0084FF');
  const [cardGradientEnd, setCardGradientEnd] = useState(card?.cardGradientEnd || '#0048C6');
  const [cardArrowColor, setCardArrowColor] = useState(card?.cardArrowColor || '#026BFC');
  const [cardBgImage, setCardBgImage] = useState(card?.cardBgImage || '');
  const [cardEmblemUrl, setCardEmblemUrl] = useState(card?.cardEmblemUrl || '');
  const [route, setRoute] = useState(card?.route || '/test-series');
  const [isActive, setIsActive] = useState(card?.isActive !== false);
  const [examId, setExamId] = useState(card?.examId || '');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setTestsCount(card.testsCount || '100+ Tests');
      setCardBadge(card.cardBadge || card.testsCount || '100+ Tests');
      setCardGradientStart(card.cardGradientStart || '#0084FF');
      setCardGradientEnd(card.cardGradientEnd || '#0048C6');
      setCardArrowColor(card.cardArrowColor || '#026BFC');
      setCardBgImage(card.cardBgImage || '');
      setCardEmblemUrl(card.cardEmblemUrl || '');
      setRoute(card.route || '/test-series');
      setIsActive(card.isActive !== false);
      setExamId(card.examId || '');
      setBackgroundFile(null);
      setLogoFile(null);
      setError('');
    }
  }, [card]);

  if (!isOpen) return null;

  const handleSelectExistingExam = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const examId = e.target.value;
    if (!examId) return;
    const found = existingExams.find((ex) => ex.id === examId);
    if (found) {
      setExamId(found.id);
      setTitle(found.title);
      setRoute(`/exams/${found.slug || found.id}`);
      try {
        const count = await api.getPublishedExamTestCount(found.id);
        const label = count > 0 ? `${count}+ Tests` : '0 Tests';
        setTestsCount(label);
        setCardBadge(label);
      } catch (countError) {
        setError(countError instanceof Error ? countError.message : 'Could not calculate available tests.');
      }
    }
  };

  const handleSelectGradientPreset = (preset: typeof PRESET_GRADIENTS[0]) => {
    setCardGradientStart(preset.start);
    setCardGradientEnd(preset.end);
    setCardArrowColor(preset.arrow);
  };

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      setCardBgImage(URL.createObjectURL(file));
    }
  };

  const handleEmblemFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setCardEmblemUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Exam title is required.');
      return;
    }
    try {
      setIsSaving(true);
      setError('');
      const id = card?.id || `popular-${Date.now()}`;
      const [uploadedBackground, uploadedLogo] = await Promise.all([
        backgroundFile ? api.uploadPopularExamImage(backgroundFile, id, 'background') : cardBgImage,
        logoFile ? api.uploadPopularExamImage(logoFile, id, 'logo') : cardEmblemUrl,
      ]);
      await onSave({
        id,
        examId: examId || undefined,
        title: title.trim(),
        testsCount: testsCount.trim() || '100+ Tests',
        cardBadge: (cardBadge.trim() || testsCount.trim()) || '100+ Tests',
        cardGradientStart,
        cardGradientEnd,
        cardArrowColor,
        cardBgImage: uploadedBackground,
        cardEmblemUrl: uploadedLogo,
        orderIndex: card?.orderIndex || 1,
        route: route.trim() || '/test-series',
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save popular exam card');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Edit Popular Exam Card
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% vector-sharp, customizable styling and content
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Live Preview Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              Live Homepage Preview
            </span>
            <span className="text-[11px] text-slate-400">Updates live as you type or pick colors</span>
          </div>

          <div className="max-w-[320px] sm:max-w-[340px] mx-auto py-2">
            <div
              className="relative aspect-[1.55] w-full rounded-[24px] overflow-hidden group block select-none"
              style={{
                background: `linear-gradient(135deg, ${cardGradientStart || '#0084FF'}, ${cardGradientEnd || '#0048C6'})`,
                boxShadow: `0 16px 32px -4px ${cardGradientStart || '#0084FF'}66, 0 6px 16px -2px ${cardGradientEnd || '#0048C6'}44`,
              }}
            >
              {cardBgImage && (
                <img
                  src={cardBgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {/* Saturated fade gradient from transparent top to rich bottom color */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, transparent 28%, ${cardGradientStart || '#0084FF'}99 62%, ${cardGradientEnd || '#0048C6'}fa 100%)`,
                }}
              />

              {/* Upper-Center Glowing Circular Emblem Badge */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                <div className="relative w-13 h-13 rounded-full flex items-center justify-center p-1.5 backdrop-blur-xs border-2 border-white/50 bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.45)] group-hover:scale-105 transition-transform duration-300">
                  {cardEmblemUrl ? (
                    <img
                      src={cardEmblemUrl}
                      alt={title}
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: cardGradientStart || '#026BFC' }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Title (Left-aligned above bottom row) */}
              <div className="absolute left-5 right-5 bottom-12 pointer-events-none">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  {title || 'Exam Title'}
                </h3>
              </div>

              {/* Card Bottom Row: Outline Calendar + Test Count on Left, Circular White Arrow on Right */}
              <div className="absolute left-5 right-5 bottom-3.5 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 text-white">
                  <Calendar className="w-4 h-4 text-white/95 shrink-0 stroke-[2.2]" />
                  <span className="text-xs font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {cardBadge || testsCount || '100+ Tests'}
                  </span>
                </div>
                <div
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/25 group-hover:scale-110 active:scale-95 transition-all duration-200 shrink-0 pointer-events-auto"
                  style={{ color: cardArrowColor || cardGradientStart || '#026BFC' }}
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick autofill from existing target exams */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Quick Autofill From Target Exams (Optional)
            </label>
            <select
              onChange={handleSelectExistingExam}
              defaultValue=""
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose an exam to auto-fill title & route --</option>
              {existingExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.category || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Exam Title & Tests Count Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Exam Title (HTML Text) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. WBP Constable"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Available Tests (calculated)
              </label>
              <input
                type="text"
                value={cardBadge}
                readOnly
                placeholder="Calculated from published tests"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-[10px] text-slate-400">Automatically counts active, published tests linked to the selected exam.</p>
            </div>
          </div>

          {/* Card Gradient & Arrow Color */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>Card Gradient & Button Colors</span>
              </label>
              <span className="text-[11px] text-slate-400">Customize the card colors</span>
            </div>

            {/* 1-Click Gradient Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectGradientPreset(preset)}
                  className={cn(
                    'p-2 rounded-xl border text-left flex items-center gap-2 transition-all text-xs font-medium',
                    cardGradientStart === preset.start && cardGradientEnd === preset.end
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                  )}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{
                      background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                    }}
                  />
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Inputs */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Gradient Start</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={cardGradientStart}
                    onChange={(e) => setCardGradientStart(e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={cardGradientStart}
                    onChange={(e) => setCardGradientStart(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Gradient End</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={cardGradientEnd}
                    onChange={(e) => setCardGradientEnd(e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={cardGradientEnd}
                    onChange={(e) => setCardGradientEnd(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Arrow Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={cardArrowColor}
                    onChange={(e) => setCardArrowColor(e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={cardArrowColor}
                    onChange={(e) => setCardArrowColor(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Background Artwork */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Background Backdrop Image</span>
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                <Upload className="w-3 h-3" />
                <span>Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-[11px] text-slate-400">
              Uploaded image is stored in shared storage and used by both student apps.
            </p>
          </div>

          {/* Center Emblem / Crest */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Exam Logo</span>
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                <Upload className="w-3 h-3" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEmblemFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-[11px] text-slate-400">
              The logo is a separate upload from the background image and preserves its aspect ratio.
            </p>
          </div>

          {/* Route & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Route URL *
              </label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="/exams/wbp-constable"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Active on Homepage</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              {isSaving ? 'Saving Card...' : 'Save & Publish Card'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
