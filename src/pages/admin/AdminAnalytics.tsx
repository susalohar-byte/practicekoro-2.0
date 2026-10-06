import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  FileText,
  BookOpen,
  Target,
  Calendar,
  Download,
  ArrowUpRight,
  ChevronDown,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper component for SVG Sparklines
const Sparkline: React.FC<{ points: number[]; color: string }> = ({ points, color }) => {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const height = 18;
  const width = 48;

  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const AdminAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('01 Sep 2026 → 30 Sep 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Demographics tab state (State / District / City)
  const [demographicTab, setDemographicTab] = useState<'State' | 'District' | 'City'>('State');

  // Subscription plan filter state
  const [planFilter, setPlanFilter] = useState<'By Subscriptions' | 'By Revenue'>('By Subscriptions');
  const [revenuePeriod, setRevenuePeriod] = useState('This Month');

  // Selected subject for "View" modal
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<{
    subject: string;
    weakCount: string;
    accuracy: string;
  } | null>(null);

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Export report action
  const handleExportReport = () => {
    const csvContent =
      'Category,Metric,Value,Period\n' +
      'Students,Total Students,12486,Sep 2026\n' +
      'Students,Active Students,7842,Sep 2026\n' +
      'Students,New Students,1892,Sep 2026\n' +
      'Tests,Tests Attempted,48320,Sep 2026\n' +
      'Tests,Questions Answered,124850,Sep 2026\n' +
      'Performance,Overall Accuracy,68%,Sep 2026\n' +
      'Revenue,Total Revenue,₹48350,Sep 2026\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PracticeKoro_Analytics_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Analytics summary report downloaded successfully!');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* HEADER SECTION                                                       */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Understand your students, content performance, subscriptions and growth.
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Date Range Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-2xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{dateRange}</span>
            </button>

            {/* Date Range Dropdown */}
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-40 space-y-1 animate-in fade-in">
                {[
                  '01 Sep 2026 → 30 Sep 2026',
                  'Last 7 Days',
                  'Last 30 Days',
                  'This Month (Sep 2026)',
                  'Previous Month (Aug 2026)',
                  'All Time',
                ].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setDateRange(range);
                      setShowDatePicker(false);
                      showToast(`Date range set to: ${range}`);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                      dateRange === range
                        ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B132B] border border-blue-200 dark:border-blue-900/60 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: TOP METRICS (6 KPI CARDS)                                 */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              18%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Total Students
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
            12,486
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            +1,892 this month
          </p>
        </div>

        {/* Card 2: Active Students */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              24%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Active Students
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
            7,842
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            63% of total
          </p>
        </div>

        {/* Card 3: New Students */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              12%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            New Students
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
            1,892
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            this month
          </p>
        </div>

        {/* Card 4: Tests Attempted */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100/70 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              32%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Tests Attempted
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
            48,320
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            +11,764 this month
          </p>
        </div>

        {/* Card 5: Questions Answered */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              28%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Questions Answered
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
            1,24,850
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            +27,412 this month
          </p>
        </div>

        {/* Card 6: Overall Accuracy */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Target className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              5%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Overall Accuracy
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
            68%
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            +3% from last month
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: MIDDLE CHARTS (3 CARDS)                                   */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card 1: Student Gender Distribution (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Student Gender Distribution
            </h3>
          </div>

          <div className="flex items-center justify-between gap-3 my-4">
            {/* SVG Donut Chart with Center Number */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="14"
                  className="dark:stroke-slate-800"
                />
                {/* Male Segment: 65% (Circumference = 2 * PI * 38 ≈ 238.76) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="14"
                  strokeDasharray="155.2 238.76"
                  strokeDashoffset="0"
                />
                {/* Female Segment: 33% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="14"
                  strokeDasharray="78.8 238.76"
                  strokeDashoffset="-155.2"
                />
                {/* Other Segment: 2% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="14"
                  strokeDasharray="4.8 238.76"
                  strokeDashoffset="-234"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                  12,486
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Students</span>
              </div>
            </div>

            {/* Legend on right */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0" />
                <span className="font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                  Male
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-[11px] ml-auto">
                  8,102 (65%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] shrink-0" />
                <span className="font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                  Female
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-[11px] ml-auto">
                  4,184 (33%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] shrink-0" />
                <span className="font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                  Other
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-[11px] ml-auto">
                  200 (2%)
                </span>
              </div>
            </div>
          </div>
          <div />
        </div>

        {/* Card 2: Student Growth Line Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Student Growth</h3>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">New Students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Active Students
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Line Chart (SVG) */}
          <div className="relative pt-2">
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-2 left-0 right-0 pointer-events-none">
              <span>2,000</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-8 left-0 right-0 pointer-events-none">
              <span>1,500</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-14 left-0 right-0 pointer-events-none">
              <span>1,000</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-20 left-0 right-0 pointer-events-none">
              <span>500</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>

            {/* SVG Lines */}
            <svg viewBox="0 0 350 110" className="w-full h-28 pt-2 overflow-visible">
              {/* Active Students Line (Green) */}
              <path
                d="M 20 85 Q 50 82 75 75 T 130 65 T 185 45 T 240 50 T 295 32 T 340 18"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Dots on Green Line */}
              {[
                { cx: 20, cy: 85 },
                { cx: 75, cy: 75 },
                { cx: 130, cy: 65 },
                { cx: 185, cy: 45 },
                { cx: 240, cy: 50 },
                { cx: 295, cy: 32 },
                { cx: 340, cy: 18 },
              ].map((dot, i) => (
                <circle
                  key={`g-${i}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r="3"
                  fill="#FFFFFF"
                  stroke="#10B981"
                  strokeWidth="2"
                />
              ))}

              {/* New Students Line (Blue) */}
              <path
                d="M 20 98 Q 50 94 75 88 T 130 80 T 185 60 T 240 68 T 295 48 T 340 30"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Dots on Blue Line */}
              {[
                { cx: 20, cy: 98 },
                { cx: 75, cy: 88 },
                { cx: 130, cy: 80 },
                { cx: 185, cy: 60 },
                { cx: 240, cy: 68 },
                { cx: 295, cy: 48 },
                { cx: 340, cy: 30 },
              ].map((dot, i) => (
                <circle
                  key={`b-${i}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r="3"
                  fill="#FFFFFF"
                  stroke="#2563EB"
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* X Axis Dates */}
            <div className="flex justify-between text-[10px] text-slate-400 font-medium px-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>1 Sep</span>
              <span>5 Sep</span>
              <span>10 Sep</span>
              <span>15 Sep</span>
              <span>20 Sep</span>
              <span>25 Sep</span>
              <span>30 Sep</span>
            </div>
          </div>
        </div>

        {/* Card 3: Student Demographics Location (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Student Demographics (Location)
            </h3>
            {/* Toggle Pills */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
              {(['State', 'District', 'City'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDemographicTab(tab)}
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer',
                    demographicTab === tab
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center pt-2">
            {/* Vector Map outline of West Bengal (5 cols) */}
            <div className="col-span-4 flex items-center justify-center">
              <svg
                viewBox="0 0 100 130"
                className="w-full max-h-32 drop-shadow-sm"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Stylized West Bengal Geographical Silhouette */}
                <path
                  d="M 52 10 
                     C 55 12, 60 16, 62 20 
                     C 60 25, 54 28, 50 32 
                     C 48 38, 52 45, 55 52 
                     C 58 58, 65 65, 68 74 
                     C 70 82, 66 90, 64 98 
                     C 60 106, 52 115, 45 118 
                     C 38 116, 32 108, 30 100 
                     C 28 92, 34 85, 36 78 
                     C 32 72, 28 65, 30 58 
                     C 35 52, 42 48, 44 40 
                     C 42 32, 45 22, 52 10 Z"
                  fill="url(#wb-gradient)"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                />
                {/* District contour subdivisions */}
                <path
                  d="M 45 40 Q 52 45 58 52 M 36 78 Q 50 82 64 80 M 34 94 Q 48 98 60 96"
                  stroke="#60A5FA"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                <defs>
                  <linearGradient id="wb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C7D2FE" />
                    <stop offset="100%" stopColor="#93C5FD" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Region Progress Bars (8 cols) */}
            <div className="col-span-8 space-y-1.5">
              {[
                { name: 'West Bengal', pct: 68, color: 'bg-blue-600' },
                { name: 'Other States', pct: 12, color: 'bg-purple-500' },
                { name: 'Bihar', pct: 5, color: 'bg-purple-400' },
                { name: 'Jharkhand', pct: 4, color: 'bg-purple-400' },
                { name: 'Assam', pct: 3, color: 'bg-purple-400' },
                { name: 'Odisha', pct: 3, color: 'bg-purple-400' },
                { name: 'Others', pct: 5, color: 'bg-purple-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] gap-2">
                  <span className="w-18 truncate font-medium text-slate-600 dark:text-slate-300">
                    {item.name}
                  </span>
                  <span className="w-7 font-bold text-slate-800 dark:text-slate-200 text-right">
                    {item.pct}%
                  </span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', item.color)}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 3: SUBSCRIPTION OVERVIEW ROW (2 CARDS)                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card 1: Subscription Plan Overview (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Subscription Plan Overview
            </h3>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
                className="appearance-none px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 pr-6 cursor-pointer focus:outline-none"
              >
                <option value="By Subscriptions">By Subscriptions</option>
                <option value="By Revenue">By Revenue</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Vertical Bar Chart with values on top */}
          <div className="relative pt-4 pb-2">
            {/* Gridlines */}
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-4 left-0 right-0 pointer-events-none">
              <span>1,200</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-12 left-0 right-0 pointer-events-none">
              <span>900</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-20 left-0 right-0 pointer-events-none">
              <span>600</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 absolute top-28 left-0 right-0 pointer-events-none">
              <span>300</span>
              <span className="border-b border-slate-100 dark:border-slate-800/80 flex-1 mx-2" />
            </div>

            {/* 6 Bars Container */}
            <div className="grid grid-cols-6 gap-3 items-end h-36 px-4 pt-6">
              {[
                { label: '6 Months Mock Test', val: 1024, max: 1200, color: 'bg-[#2563EB]' },
                { label: '3 Months Mock Test', val: 412, max: 1200, color: 'bg-[#8B5CF6]' },
                { label: '1 Month Mock Test', val: 268, max: 1200, color: 'bg-[#10B981]' },
                { label: 'PYQ Pack', val: 156, max: 1200, color: 'bg-[#F59E0B]' },
                { label: 'Subject Pack', val: 98, max: 1200, color: 'bg-[#F43F5E]' },
                { label: 'Free Plan', val: 64, max: 1200, color: 'bg-[#64748B]' },
              ].map((bar, idx) => {
                const heightPct = Math.round((bar.val / bar.max) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 mb-1">
                      {bar.val.toLocaleString()}
                    </span>
                    <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/80 h-28 rounded-t-lg flex items-end overflow-hidden">
                      <div
                        className={cn('w-full rounded-t-lg transition-all duration-500', bar.color)}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight mt-2 line-clamp-2 h-6">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div />
        </div>

        {/* Card 2: Subscription Revenue (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Subscription Revenue
            </h3>

            {/* Timeframe Dropdown */}
            <div className="relative">
              <select
                value={revenuePeriod}
                onChange={(e) => setRevenuePeriod(e.target.value)}
                className="appearance-none px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 pr-6 cursor-pointer focus:outline-none"
              >
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="This Quarter">This Quarter</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center my-2">
            {/* Donut Chart on Left (5 cols) */}
            <div className="col-span-5 flex items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                    className="dark:stroke-slate-800"
                  />
                  {/* Segment 1: 52% (Blue) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="14"
                    strokeDasharray="124.1 238.76"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: 21% (Purple) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="14"
                    strokeDasharray="50.1 238.76"
                    strokeDashoffset="-124.1"
                  />
                  {/* Segment 3: 14% (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="14"
                    strokeDasharray="33.4 238.76"
                    strokeDashoffset="-174.2"
                  />
                  {/* Segment 4: 8% (Orange) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="14"
                    strokeDasharray="19.1 238.76"
                    strokeDashoffset="-207.6"
                  />
                  {/* Segment 5: 4% (Coral) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="14"
                    strokeDasharray="9.5 238.76"
                    strokeDashoffset="-226.7"
                  />
                  {/* Segment 6: 1% (Slate) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="14"
                    strokeDasharray="2.5 238.76"
                    strokeDashoffset="-236.2"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    ₹48,350
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">Total Revenue</span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown Legend (7 cols) */}
            <div className="col-span-7 space-y-1.5 text-[11px]">
              {[
                { name: '6 Months Mock Test', pct: '52%', amount: '₹25,142', color: 'bg-[#2563EB]' },
                { name: '3 Months Mock Test', pct: '21%', amount: '₹10,004', color: 'bg-[#8B5CF6]' },
                { name: '1 Month Mock Test', pct: '14%', amount: '₹6,770', color: 'bg-[#10B981]' },
                { name: 'PYQ Pack', pct: '8%', amount: '₹3,868', color: 'bg-[#F59E0B]' },
                { name: 'Subject Pack', pct: '4%', amount: '₹1,934', color: 'bg-[#F43F5E]' },
                { name: 'Free Plan', pct: '1%', amount: '₹632', color: 'bg-[#64748B]' },
              ].map((row, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', row.color)} />
                    <span className="text-slate-600 dark:text-slate-300 truncate text-[10px] font-medium">
                      {row.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 font-semibold text-[10px]">{row.pct}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[10px]">
                      {row.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 4: PERFORMANCE DIAGNOSTICS ROW (3 CARDS)                     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Card 1: Weakest Subjects */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
              Weakest Subjects
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                    <th className="pb-2 font-normal">#</th>
                    <th className="pb-2 font-normal">Subject</th>
                    <th className="pb-2 font-normal">Accuracy</th>
                    <th className="pb-2 font-normal">Students</th>
                    <th className="pb-2 font-normal text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {[
                    {
                      id: 1,
                      subject: 'সাধারণ বিজ্ঞান',
                      accuracy: '40%',
                      pillClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
                      students: '2,842',
                      trend: [48, 44, 42, 39, 40],
                      trendColor: '#E11D48',
                    },
                    {
                      id: 2,
                      subject: 'ইতিহাস',
                      accuracy: '52%',
                      pillClass:
                        'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
                      students: '1,986',
                      trend: [58, 54, 53, 50, 52],
                      trendColor: '#EA580C',
                    },
                    {
                      id: 3,
                      subject: 'ভূগোল',
                      accuracy: '56%',
                      pillClass:
                        'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
                      students: '1,654',
                      trend: [52, 53, 55, 54, 56],
                      trendColor: '#D97706',
                    },
                    {
                      id: 4,
                      subject: 'গণিত',
                      accuracy: '61%',
                      pillClass:
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
                      students: '1,402',
                      trend: [54, 57, 58, 60, 61],
                      trendColor: '#10B981',
                    },
                    {
                      id: 5,
                      subject: 'বাংলা ভাষা',
                      accuracy: '64%',
                      pillClass:
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
                      students: '1,236',
                      trend: [58, 60, 62, 63, 64],
                      trendColor: '#10B981',
                    },
                  ].map((row) => (
                    <tr key={row.id} className="text-[11px]">
                      <td className="py-2.5 text-slate-400 font-medium">{row.id}</td>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {row.subject}
                      </td>
                      <td className="py-2.5">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', row.pillClass)}>
                          {row.accuracy}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                        {row.students}
                      </td>
                      <td className="py-2.5 text-right">
                        <Sparkline points={row.trend} color={row.trendColor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Weakest Topics */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Weakest Topics</h3>
              <button
                type="button"
                onClick={() => showToast('Full topic analytics list opened')}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                    <th className="pb-2 font-normal">#</th>
                    <th className="pb-2 font-normal">Topic</th>
                    <th className="pb-2 font-normal">Accuracy</th>
                    <th className="pb-2 font-normal">Students</th>
                    <th className="pb-2 font-normal text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {[
                    {
                      id: 1,
                      topic: 'ভারতের সংবিধান',
                      accuracy: '32%',
                      pillClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
                      students: '1,842',
                      trend: [40, 36, 35, 30, 32],
                      trendColor: '#E11D48',
                    },
                    {
                      id: 2,
                      topic: 'মৌলিক অধিকার',
                      accuracy: '38%',
                      pillClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
                      students: '1,521',
                      trend: [44, 40, 39, 36, 38],
                      trendColor: '#E11D48',
                    },
                    {
                      id: 3,
                      topic: 'পরিবেশ ও প্রতিবেশ',
                      accuracy: '42%',
                      pillClass:
                        'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
                      students: '1,318',
                      trend: [48, 45, 43, 40, 42],
                      trendColor: '#EA580C',
                    },
                    {
                      id: 4,
                      topic: 'ভারতের ইতিহাস (মধ্যযুগ)',
                      accuracy: '45%',
                      pillClass:
                        'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
                      students: '1,206',
                      trend: [46, 45, 47, 44, 45],
                      trendColor: '#EA580C',
                    },
                    {
                      id: 5,
                      topic: 'জৈববৈচিত্র্য',
                      accuracy: '46%',
                      pillClass:
                        'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
                      students: '1,084',
                      trend: [42, 43, 44, 45, 46],
                      trendColor: '#10B981',
                    },
                  ].map((row) => (
                    <tr key={row.id} className="text-[11px]">
                      <td className="py-2.5 text-slate-400 font-medium">{row.id}</td>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {row.topic}
                      </td>
                      <td className="py-2.5">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', row.pillClass)}>
                          {row.accuracy}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                        {row.students}
                      </td>
                      <td className="py-2.5 text-right">
                        <Sparkline points={row.trend} color={row.trendColor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 3: Subject-wise Weak Students */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Subject-wise Weak Students
              </h3>
              <button
                type="button"
                onClick={() => showToast('Full weak student cohort report opened')}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                    <th className="pb-2 font-normal">#</th>
                    <th className="pb-2 font-normal">Subject</th>
                    <th className="pb-2 font-normal">Weak Students</th>
                    <th className="pb-2 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {[
                    { id: 1, subject: 'সাধারণ বিজ্ঞান', weakCount: '2,842', accuracy: '40%' },
                    { id: 2, subject: 'ইতিহাস', weakCount: '1,986', accuracy: '52%' },
                    { id: 3, subject: 'ভূগোল', weakCount: '1,654', accuracy: '56%' },
                    { id: 4, subject: 'গণিত', weakCount: '1,402', accuracy: '61%' },
                    { id: 5, subject: 'বাংলা ভাষা', weakCount: '1,236', accuracy: '64%' },
                  ].map((row) => (
                    <tr key={row.id} className="text-[11px]">
                      <td className="py-2.5 text-slate-400 font-medium">{row.id}</td>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {row.subject}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                        {row.weakCount}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubjectModal(row)}
                          className="px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 5: USAGE & HARDWARE ROW (3 CARDS)                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Card 1: Test Type Usage */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Test Type Usage</h3>

          <div className="flex items-center justify-between gap-3 my-2">
            {/* Donut Chart */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="14"
                  className="dark:stroke-slate-800"
                />
                {/* 42% Full Mock Tests (Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="14"
                  strokeDasharray="100.2 238.76"
                  strokeDashoffset="0"
                />
                {/* 36% Topic Tests (Magenta) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="14"
                  strokeDasharray="85.9 238.76"
                  strokeDashoffset="-100.2"
                />
                {/* 18% Official PYQ (Teal/Sky) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="14"
                  strokeDasharray="42.9 238.76"
                  strokeDashoffset="-186.1"
                />
                {/* 4% Other Tests (Amber) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeDasharray="9.5 238.76"
                  strokeDashoffset="-229"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                  48,320
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Tests Attempted</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-1.5 flex-1 text-[10px]">
              {[
                { name: 'Full Mock Tests', pct: '42%', count: '20,206', color: 'bg-[#2563EB]' },
                { name: 'Topic Tests', pct: '36%', count: '17,295', color: 'bg-[#EC4899]' },
                { name: 'Official PYQ', pct: '18%', count: '8,693', color: 'bg-[#0EA5E9]' },
                { name: 'Other Tests', pct: '4%', count: '2,126', color: 'bg-[#F59E0B]' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', item.color)} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 font-semibold">{item.pct}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div />
        </div>

        {/* Card 2: Device Usage */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Device Usage</h3>

          <div className="flex items-center justify-between gap-3 my-2">
            {/* Donut Chart */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="14"
                  className="dark:stroke-slate-800"
                />
                {/* 72% Mobile Android (Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="14"
                  strokeDasharray="171.9 238.76"
                  strokeDashoffset="0"
                />
                {/* 14% Mobile iOS (Sky) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="14"
                  strokeDasharray="33.4 238.76"
                  strokeDashoffset="-171.9"
                />
                {/* 9% Desktop Windows (Amber) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeDasharray="21.4 238.76"
                  strokeDashoffset="-205.3"
                />
                {/* 5% Desktop Mac (Slate) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="14"
                  strokeDasharray="11.9 238.76"
                  strokeDashoffset="-226.7"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                  7,842
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Active Students</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-1.5 flex-1 text-[10px]">
              {[
                { name: 'Mobile (Android)', pct: '72%', count: '5,642', color: 'bg-[#2563EB]' },
                { name: 'Mobile (iOS)', pct: '14%', count: '1,102', color: 'bg-[#38BDF8]' },
                { name: 'Desktop (Windows)', pct: '9%', count: '721', color: 'bg-[#F59E0B]' },
                { name: 'Desktop (Mac)', pct: '5%', count: '377', color: 'bg-[#64748B]' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', item.color)} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 font-semibold">{item.pct}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div />
        </div>

        {/* Card 3: Top Exam Categories by Usage */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Top Exam Categories by Usage
              </h3>
              <button
                type="button"
                onClick={() => showToast('Full exam usage report opened')}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                    <th className="pb-2 font-normal">#</th>
                    <th className="pb-2 font-normal">Exam Category</th>
                    <th className="pb-2 font-normal">Students</th>
                    <th className="pb-2 font-normal text-right">Tests Attempted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {[
                    { id: 1, category: 'WBP Constable', students: '4,842', attempts: '18,206' },
                    { id: 2, category: 'WBSSC Group C', students: '2,156', attempts: '8,421' },
                    { id: 3, category: 'WBSSC Group D', students: '1,984', attempts: '7,632' },
                    { id: 4, category: 'SSC (CGL/CHSL)', students: '1,120', attempts: '5,206' },
                    { id: 5, category: 'Railway (NTPC/Group D)', students: '986', attempts: '4,855' },
                  ].map((row) => (
                    <tr key={row.id} className="text-[11px]">
                      <td className="py-2.5 text-slate-400 font-medium">{row.id}</td>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {row.category}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                        {row.students}
                      </td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white text-right">
                        {row.attempts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SUBJECT WEAK STUDENTS COHORT DETAIL MODAL                            */}
      {/* ==================================================================== */}
      {selectedSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedSubjectModal.subject}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                    {selectedSubjectModal.accuracy} Accuracy
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSubjectModal.weakCount} Aspirants requiring foundational assistance
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubjectModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Recommended Actions:
              </p>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 space-y-1.5">
                <p>• Push topic-wise targeted mock tests to this cohort</p>
                <p>• Offer video solution explanations for low-scoring question sets</p>
                <p>• Send in-app notification with revision study notes</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSubjectModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubjectModal(null);
                  showToast(`Practice guidance blast triggered for ${selectedSubjectModal.subject}!`);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Dispatch Topic Practice Pack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
