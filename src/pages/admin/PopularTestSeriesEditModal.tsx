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
  FileText,
} from 'lucide-react';
import type { TestSeries, PopularTestSeriesCard } from '@/types';
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

export const PRESET_SERIES_LOGOS = [
  { name: 'WBP Police', path: '/images/exams/emblem_series_wbp.png' },
  { name: 'Kolkata Police', path: '/images/exams/emblem_series_kp.png' },
  { name: 'SSC Crest', path: '/images/exams/emblem_series_ssc.png' },
  { name: 'Railways Seal', path: '/images/exams/emblem_railway.png' },
  { name: 'Primary TET', path: '/images/exams/emblem_wbtet_seal.png' },
  { name: 'WBPSC Emblem', path: '/images/exams/emblem_wbpsc.png' },
];

export const PRESET_SERIES_BACKGROUNDS = [
  { name: 'WBP Officers', path: '/images/series_wbp_bg.png' },
  { name: 'Kolkata Lalbazar', path: '/images/series_kp_bg.png' },
  { name: 'SSC Soldiers', path: '/images/series_ssc_bg.png' },
  { name: 'Railway Tracks', path: '/images/popular_exams/bg_railway.png' },
  { name: 'Teaching Desk', path: '/images/popular_exams/bg_wbtet.png' },
  { name: 'Government Office', path: '/images/popular_exams/bg_wbpsc.png' },
];

interface PopularTestSeriesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: PopularTestSeriesCard | null;
  onSave: (card: PopularTestSeriesCard) => Promise<void>;
  existingSeries: TestSeries[];
}

export const PopularTestSeriesEditModal: React.FC<PopularTestSeriesEditModalProps> = ({
  isOpen,
  onClose,
  card,
  onSave,
  existingSeries,
}) => {
  const [title, setTitle] = useState(card?.title || '');
  const [subtitle, setSubtitle] = useState(card?.subtitle || 'Complete Test Series');
  const [cardGradientStart, setCardGradientStart] = useState(card?.cardGradientStart || '#0084FF');
  const [cardGradientEnd, setCardGradientEnd] = useState(card?.cardGradientEnd || '#0048C6');
  const [cardArrowColor, setCardArrowColor] = useState(card?.cardArrowColor || '#026BFC');
  const [cardBgImage, setCardBgImage] = useState(card?.cardBgImage || '/images/series_wbp_bg.png');
  const [cardLogoUrl, setCardLogoUrl] = useState(card?.cardLogoUrl || '/images/exams/emblem_series_wbp.png');
  const [route, setRoute] = useState(card?.route || '/test-series');
  const [isActive, setIsActive] = useState(card?.isActive !== false);
  const [testSeriesId, setTestSeriesId] = useState(card?.testSeriesId || '');
  const [fullMockCount, setFullMockCount] = useState<number>(card?.fullMockCount ?? 40);
  const [topicTestCount, setTopicTestCount] = useState<number>(card?.topicTestCount ?? 120);
  const [pyqTestCount, setPyqTestCount] = useState<number>(card?.pyqTestCount ?? 25);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setSubtitle(card.subtitle || 'Complete Test Series');
      setCardGradientStart(card.cardGradientStart || '#0084FF');
      setCardGradientEnd(card.cardGradientEnd || '#0048C6');
      setCardArrowColor(card.cardArrowColor || '#026BFC');
      setCardBgImage(card.cardBgImage || '/images/series_wbp_bg.png');
      setCardLogoUrl(card.cardLogoUrl || '/images/exams/emblem_series_wbp.png');
      setRoute(card.route || '/test-series');
      setIsActive(card.isActive !== false);
      setTestSeriesId(card.testSeriesId || '');
      setFullMockCount(card.fullMockCount ?? 40);
      setTopicTestCount(card.topicTestCount ?? 120);
      setPyqTestCount(card.pyqTestCount ?? 25);
      setBackgroundFile(null);
      setLogoFile(null);
      setError('');
    }
  }, [card]);

  if (!isOpen) return null;

  const handleSelectExistingSeries = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    if (!sId) return;
    const found = existingSeries.find((s) => s.id === sId);
    if (found) {
      setTestSeriesId(found.id);
      setTitle(found.title);
      setRoute(`/test-series/${found.id}`);
      if (found.iconUrl) {
        setCardLogoUrl(found.iconUrl);
      }
      setFullMockCount(found.fullMockCount ?? 40);
      setTopicTestCount(found.topicTestCount ?? 120);
      setPyqTestCount(found.pyqTestCount ?? 25);
    }
  };

  const handleSelectGradientPreset = (preset: typeof PRESET_GRADIENTS[0]) => {
    setCardGradientStart(preset.start);
    setCardGradientEnd(preset.end);
    setCardArrowColor(preset.arrow);
  };

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setBackgroundFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCardBgImage(previewUrl);
    setError('');
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, SVG).');
      return;
    }
    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCardLogoUrl(previewUrl);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Test Series title is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const id = card?.id || `popular-series-${Date.now()}`;

      let finalBgUrl = cardBgImage;
      let finalLogoUrl = cardLogoUrl;

      if (backgroundFile) {
        try {
          finalBgUrl = await api.uploadPopularTestSeriesImage(backgroundFile, id, 'background');
        } catch (uploadErr) {
          console.warn('Background upload failed, keeping current:', uploadErr);
        }
      }

      if (logoFile) {
        try {
          finalLogoUrl = await api.uploadPopularTestSeriesImage(logoFile, id, 'logo');
        } catch (uploadErr) {
          console.warn('Logo upload failed, keeping current:', uploadErr);
        }
      }

      const updatedCard: PopularTestSeriesCard = {
        id,
        testSeriesId: testSeriesId || undefined,
        title: title.trim(),
        subtitle: subtitle.trim() || 'Complete Test Series',
        cardGradientStart,
        cardGradientEnd,
        cardArrowColor,
        cardBgImage: finalBgUrl,
        cardLogoUrl: finalLogoUrl,
        orderIndex: card?.orderIndex || 1,
        route: route || (testSeriesId ? `/test-series/${testSeriesId}` : '/test-series'),
        isActive,
        fullMockCount,
        topicTestCount,
        pyqTestCount,
      };

      await onSave(updatedCard);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save Popular Test Series card.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {card ? 'Edit Popular Test Series Card' : 'New Popular Test Series Card'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1:1 reference styling with background art, circular emblem, and full/topic/pyq test breakdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
              {error}
            </div>
          )}

          {/* 1:1 Live Reference Preview */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>Exact 1:1 Student Homepage Card Preview</span>
            </label>

            <div
              className="relative w-full rounded-[18px] sm:rounded-[20px] overflow-hidden group select-none shadow-md border border-white/10 px-4 py-3 flex items-center justify-between h-[86px]"
              style={{
                background: `linear-gradient(135deg, ${cardGradientStart}, ${cardGradientEnd})`,
              }}
            >
              {/* Background Artwork */}
              {cardBgImage && (
                <img
                  src={cardBgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}
              {/* Gradient Overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, ${cardGradientStart}f0 0%, ${cardGradientStart}99 45%, ${cardGradientEnd}e0 100%)`,
                }}
              />

              {/* Left & Middle: Circular Logo + Title/Subtitle */}
              <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                {/* Large Circular White Logo Container */}
                <div className="w-[48px] h-[48px] rounded-full bg-white p-1.5 shadow-sm flex items-center justify-center border border-white/80 shrink-0">
                  {cardLogoUrl ? (
                    <img
                      src={cardLogoUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                  )}
                </div>

                {/* Title & Subtitle */}
                <div className="min-w-0 pr-1 flex-1">
                  <h4 className="text-base font-black text-white leading-tight truncate drop-shadow-sm">
                    {title || 'Test Series Title'}
                  </h4>
                  <p className="text-xs text-white/90 font-medium mt-0.5 drop-shadow-xs">
                    {subtitle || 'Complete Test Series'}
                  </p>
                </div>
              </div>

              {/* Circular Arrow Button */}
              <div
                className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ml-2"
                style={{ backgroundColor: cardArrowColor }}
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Quick Connect to Existing Test Series */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Link to Existing Test Series (Auto-fills ID & counts)
            </label>
            <select
              value={testSeriesId}
              onChange={handleSelectExistingSeries}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">-- Choose Test Series to connect --</option>
              {existingSeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.testCount || 0} Tests: {s.fullMockCount || 0} Full Mock, {s.topicTestCount || 0} Topic, {s.pyqTestCount || 0} PYQ)
                </option>
              ))}
            </select>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Card Title (Exam / Test Series Name)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. WBP Constable"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Complete Test Series"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Statistics Override / Defaults */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">
              📊 Test Breakdown Counts (Automatically calculated from tests in database, or override here)
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Full Mock
                </label>
                <input
                  type="number"
                  min="0"
                  value={fullMockCount}
                  onChange={(e) => setFullMockCount(parseInt(e.target.value) || 0)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Topic Test
                </label>
                <input
                  type="number"
                  min="0"
                  value={topicTestCount}
                  onChange={(e) => setTopicTestCount(parseInt(e.target.value) || 0)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  PYQ Test
                </label>
                <input
                  type="number"
                  min="0"
                  value={pyqTestCount}
                  onChange={(e) => setPyqTestCount(parseInt(e.target.value) || 0)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span>Theme Color Presets</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectGradientPreset(p)}
                  className={cn(
                    'h-10 px-2.5 rounded-xl border flex items-center justify-between transition-all text-xs font-bold text-left',
                    cardGradientStart === p.start
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <span className="truncate">{p.name}</span>
                  <div
                    className={cn('w-4 h-4 rounded-full bg-gradient-to-br shrink-0 shadow-2xs', p.badge)}
                  />
                </button>
              ))}
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Gradient Start
                </label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="color"
                    value={cardGradientStart}
                    onChange={(e) => setCardGradientStart(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cardGradientStart}
                    onChange={(e) => setCardGradientStart(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Gradient End
                </label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="color"
                    value={cardGradientEnd}
                    onChange={(e) => setCardGradientEnd(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cardGradientEnd}
                    onChange={(e) => setCardGradientEnd(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Arrow Color
                </label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="color"
                    value={cardArrowColor}
                    onChange={(e) => setCardArrowColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cardArrowColor}
                    onChange={(e) => setCardArrowColor(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Selection & Upload */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Exam / Series Logo</span>
              </span>
              <label className="cursor-pointer text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <Upload className="w-3 h-3" /> Upload Logo File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
              </label>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_SERIES_LOGOS.map((l, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCardLogoUrl(l.path);
                    setLogoFile(null);
                  }}
                  className={cn(
                    'p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all',
                    cardLogoUrl === l.path
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-white p-1 shadow-xs flex items-center justify-center">
                    <img src={l.path} alt="" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full">
                    {l.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Artwork Selection & Upload */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Background Image Artwork</span>
              </span>
              <label className="cursor-pointer text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <Upload className="w-3 h-3" /> Upload Background
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgFileUpload}
                  className="hidden"
                />
              </label>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_SERIES_BACKGROUNDS.map((bg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCardBgImage(bg.path);
                    setBackgroundFile(null);
                  }}
                  className={cn(
                    'h-14 rounded-xl border overflow-hidden relative group text-left transition-all',
                    cardBgImage === bg.path
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  )}
                >
                  <img
                    src={bg.path}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 flex items-end p-1.5">
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">
                      {bg.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Active & Live on Student Dashboard
              </span>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleSubmit}
            isLoading={isSaving}
          >
            Save Showcase Card
          </Button>
        </div>
      </div>
    </div>
  );
};
