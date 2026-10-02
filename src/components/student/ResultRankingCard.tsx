import React, { useEffect, useState } from 'react';
import { Award, MapPin, Trophy } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { api } from '@/services/api';
import type { AttemptRankings } from '@/types';
import { cn } from '@/lib/utils';

type RankingScope = 'testSeries' | 'district' | 'westBengal';

const RANKING_TABS: { id: RankingScope; label: string }[] = [
  { id: 'testSeries', label: 'Test Series Rank' },
  { id: 'district', label: 'District Rank' },
  { id: 'westBengal', label: 'West Bengal Rank' },
];

const numberFormat = new Intl.NumberFormat('en-IN');

export const ResultRankingCard: React.FC<{ attemptId: string }> = ({ attemptId }) => {
  const [activeScope, setActiveScope] = useState<RankingScope>('testSeries');
  const [rankings, setRankings] = useState<AttemptRankings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setRankings(null);
    if (typeof api.getAttemptRankings !== 'function') {
      setError(true);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    api
      .getAttemptRankings(attemptId)
      .then((data) => {
        if (active) setRankings(data);
      })
      .catch((err) => {
        console.error('Failed to load result rankings:', err);
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId]);

  const formatRank = (rank: number | null | undefined) => (rank ? `#${numberFormat.format(rank)}` : '—');

  return (
    <Card className="overflow-hidden rounded-3xl border border-blue-100/80 bg-white p-0 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Your Ranking</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Based on completed PracticeKoro results
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Ranking scope"
          className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto"
        >
          {RANKING_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`ranking-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={activeScope === tab.id}
              onClick={() => setActiveScope(tab.id)}
              className={cn(
                'min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold transition-colors sm:text-xs',
                activeScope === tab.id
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-200'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tabpanel"
        aria-labelledby={`ranking-tab-${activeScope}`}
        className="p-5 sm:p-6"
      >
        {loading ? (
          <div className="grid min-h-28 place-items-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Updating live ranks…
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
            Rankings are temporarily unavailable. Your test result is saved as usual.
          </p>
        ) : !rankings ? (
          <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
            Live ranking data is not available for this result yet.
          </p>
        ) : activeScope === 'testSeries' ? (
          rankings.testSeries.name ? (
            <div className="space-y-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                  Test Series
                </p>
                <h3 className="mt-1 break-words text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">
                  {rankings.testSeries.name}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric
                  label="Your Rank"
                  value={formatRank(rankings.testSeries.rank)}
                  supportingText={rankings.testSeries.rank ? 'In this test series' : 'Complete more tests to rank'}
                  prominent
                />
                <Metric
                  label="Your Score"
                  value={`${rankings.testSeries.score}/${rankings.testSeries.totalMarks}`}
                  supportingText="This test result"
                />
                <Metric
                  label="Participants"
                  value={numberFormat.format(rankings.testSeries.participants)}
                  supportingText="Students with a completed result"
                />
              </div>
            </div>
          ) : (
            <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
              This test is not linked to a Test Series, so a Test Series rank is not available.
            </p>
          )
        ) : activeScope === 'district' ? (
          rankings.district.name ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Metric
                label="District Rank"
                value={formatRank(rankings.district.rank)}
                supportingText={rankings.district.name}
                prominent
                icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
              />
              <Metric
                label="District Participants"
                value={numberFormat.format(rankings.district.participants)}
                supportingText={`PracticeKoro students in ${rankings.district.name}`}
              />
            </div>
          ) : (
            <p className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm font-semibold text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
              Select your district in Profile to view your district rank.
            </p>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric
              label="West Bengal Rank"
              value={formatRank(rankings.westBengal.rank)}
              supportingText="Across West Bengal"
              prominent
              icon={<Award className="h-4 w-4" aria-hidden="true" />}
            />
            <Metric
              label="West Bengal Participants"
              value={numberFormat.format(rankings.westBengal.participants)}
              supportingText="PracticeKoro students with completed results"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

const Metric: React.FC<{
  label: string;
  value: string;
  supportingText: string;
  prominent?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, supportingText, prominent = false, icon }) => (
  <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {icon}
      {label}
    </p>
    <p
      className={cn(
        'mt-1 break-words font-black tracking-tight text-slate-900 dark:text-white',
        prominent ? 'text-3xl sm:text-4xl' : 'text-lg sm:text-xl'
      )}
    >
      {value}
    </p>
    <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{supportingText}</p>
  </div>
);
