import { useState } from 'react';
import { BarChart3, Table as TableIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminMoneyChart({
  points,
}: {
  points: { label: string; revenue: number; refunds?: number }[];
}) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hasRefunds = points.some((p) => (p.refunds ?? 0) > 0);
  const totalRevenue = points.reduce((acc, p) => acc + p.revenue, 0);
  const totalRefunds = points.reduce((acc, p) => acc + (p.refunds || 0), 0);
  const netRevenue = totalRevenue - totalRefunds;

  const max = Math.max(1, ...points.flatMap((p) => [p.revenue, p.refunds || 0]));
  // Round up max for clean grid ticks
  const chartCeiling = Math.ceil(max * 1.15) || 100;
  const yTicks = [
    chartCeiling,
    Math.round(chartCeiling * 0.66),
    Math.round(chartCeiling * 0.33),
    0,
  ];

  const hasAnyData = points.some((p) => (p.revenue || 0) > 0 || (p.refunds || 0) > 0);

  return (
    <div className="space-y-4" aria-label="Recorded revenue by period">
      {/* 1. Quick Financial Metric Pills & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Net Retained */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              Period Net:
            </span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              ₹{netRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Gross Retained */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              Gross Retained:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Total Refunds (if any) */}
          {hasRefunds && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">
                Refunds:
              </span>
              <span className="font-bold text-rose-700 dark:text-rose-300">
                -₹{totalRefunds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* View Switcher: Interactive Bar Chart vs Tabular Breakdown */}
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/60 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer',
              viewMode === 'chart'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Chart View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer',
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Data Table</span>
          </button>
        </div>
      </div>

      {/* Accessible standard caption */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Blue: retained revenue{hasRefunds ? ' · Pink: recorded refunds' : ''} · INR
      </p>

      {/* 2. MAIN VISUAL: Interactive Dual-Bar Chart */}
      <div
        className={cn(
          'relative rounded-2xl bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/60 dark:to-slate-900 p-4 border border-slate-100 dark:border-slate-800/80 transition-all',
          viewMode === 'table' && 'hidden'
        )}
      >
        {hasAnyData ? (
          <div className="relative h-64 sm:h-72 flex flex-col justify-between pt-6 pb-2">
            {/* Background Grid Lines & Y-Axis Labels */}
            <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between pointer-events-none">
              {yTicks.map((tick, i) => (
                <div key={i} className="flex items-center w-full">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-12 text-right pr-2 shrink-0 select-none">
                    ₹{tick.toLocaleString('en-IN')}
                  </span>
                  <div className="flex-1 border-b border-dashed border-slate-200/60 dark:border-slate-800" />
                </div>
              ))}
            </div>

            {/* Bars Column Container */}
            <div className="relative pl-12 h-full flex items-end justify-between gap-2 z-10">
              {points.map((p, idx) => {
                const revHeightPct = Math.min(
                  100,
                  Math.max(p.revenue > 0 ? 6 : 0, Math.round((p.revenue / chartCeiling) * 100))
                );
                const refHeightPct = Math.min(
                  100,
                  Math.max(
                    (p.refunds || 0) > 0 ? 6 : 0,
                    Math.round(((p.refunds || 0) / chartCeiling) * 100)
                  )
                );
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={`${p.label}-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  >
                    {/* Floating Tooltip */}
                    <div
                      className={cn(
                        'absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 transition-all pointer-events-none z-30 whitespace-nowrap bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-slate-700/50 flex flex-col gap-1 min-w-[140px]',
                        isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      )}
                    >
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 pb-1 flex items-center justify-between">
                        <span>{p.label}</span>
                        <Sparkles className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sky-300 font-semibold">
                        <span>Retained:</span>
                        <span>
                          ₹{p.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {hasRefunds && (
                        <div className="flex items-center justify-between gap-3 text-rose-300 font-medium">
                          <span>Refunded:</span>
                          <span>
                            ₹{(p.refunds || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold pt-1 border-t border-slate-700/60">
                        <span>Net:</span>
                        <span>
                          ₹
                          {(p.revenue - (p.refunds || 0)).toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Bar Pillar Columns Container */}
                    <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-1.5 pb-1">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeightPct}%` }}
                        className={cn(
                          'w-3.5 sm:w-5 bg-gradient-to-t from-[#026BFC] via-[#2563EB] to-[#38BDF8] rounded-t-md transition-all shadow-2xs group-hover:brightness-110 group-hover:shadow-blue-500/20',
                          isHovered && 'ring-2 ring-blue-400/50'
                        )}
                      />

                      {/* Refund Bar (if present) */}
                      {hasRefunds && (
                        <div
                          style={{ height: `${refHeightPct}%` }}
                          className={cn(
                            'w-3.5 sm:w-5 bg-gradient-to-t from-[#E11D48] via-[#F43F5E] to-[#FB7185] rounded-t-md transition-all shadow-2xs group-hover:brightness-110 group-hover:shadow-rose-500/20',
                            isHovered && 'ring-2 ring-rose-400/50'
                          )}
                        />
                      )}
                    </div>

                    {/* Bucket X-Axis Label */}
                    <div className="w-full text-center border-t border-slate-200 dark:border-slate-800 pt-1.5">
                      <span
                        className={cn(
                          'text-[10px] sm:text-[11px] font-medium block truncate transition-colors',
                          isHovered
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {p.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No recorded revenue or refunds in this period.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Try switching the reporting filter to &ldquo;All Time&rdquo; or select another time
              range to view past revenue trajectory.
            </p>
          </div>
        )}
      </div>

      {/* 3. Detailed Data Table (Always accessible in DOM for full accessibility & precision) */}
      <div
        className={cn(
          'overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
          viewMode === 'chart' && 'hidden'
        )}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2.5 px-4 font-semibold">Period starting</th>
              <th className="py-2.5 px-4 font-semibold">Retained revenue</th>
              {hasRefunds && <th className="py-2.5 px-4 font-semibold">Recorded refunds</th>}
              <th className="py-2.5 px-4 font-semibold text-right">Net Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {points.map((p, index) => {
              const net = p.revenue - (p.refunds || 0);
              return (
                <tr
                  key={`${p.label}-${index}`}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <th className="py-3 px-4 text-left font-medium text-slate-800 dark:text-slate-200">
                    {p.label}
                  </th>
                  {(hasRefunds ? [p.revenue, p.refunds || 0] : [p.revenue]).map((value, i) => (
                    <td key={i} className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        <span>₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div
                        aria-hidden="true"
                        className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 max-w-[140px]"
                      >
                        <div
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            i
                              ? 'bg-gradient-to-r from-rose-500 to-pink-400'
                              : 'bg-gradient-to-r from-blue-600 to-sky-400'
                          )}
                          style={{ width: `${Math.min(100, Math.round((100 * value) / max))}%` }}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={cn(
                        'font-bold px-2 py-0.5 rounded-md text-[11px]',
                        net > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : net < 0
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      ₹{net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Screen Reader Accessible Data Table when in Chart View */}
      {viewMode === 'chart' && (
        <div className="sr-only">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Period starting</th>
                <th>Retained revenue</th>
                {hasRefunds && <th>Recorded refunds</th>}
              </tr>
            </thead>
            <tbody>
              {points.map((p, index) => (
                <tr key={`${p.label}-${index}`} className="border-t border-slate-100">
                  <th className="py-2 text-left font-medium">{p.label}</th>
                  {(hasRefunds ? [p.revenue, p.refunds || 0] : [p.revenue]).map((value, i) => (
                    <td key={i} className="w-1/3 px-2">
                      <span>₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      <div aria-hidden="true" className="mt-1 h-2 rounded bg-slate-100">
                        <div
                          className={`h-2 rounded ${i ? 'bg-pink-400' : 'bg-blue-500'}`}
                          style={{ width: `${(100 * value) / max}%` }}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State Message for tests and users */}
      {!hasAnyData && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No recorded revenue or refunds in this period.
        </p>
      )}
    </div>
  );
}
