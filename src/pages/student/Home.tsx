import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { bannerService } from '@/services/bannerService';
import { api } from '@/services/api';
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
  Lightbulb,
  Radio,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import type { PopularTestSeriesCard } from '@/types';
import '@/styles/student-panel.css';

const isInternalPath = (value: string) => /^\/(?!\/)/.test(value) && !value.includes('\\');

const quickLinks = [
  {
    title: 'Topic practice',
    description: 'Build confidence, one chapter at a time.',
    route: '/practice',
    icon: Zap,
    tone: 'blue',
  },
  {
    title: 'Saved questions',
    description: 'Revisit the questions that matter.',
    route: '/saved-questions',
    icon: Bookmark,
    tone: 'green',
  },
  {
    title: 'Audio books',
    description: 'Keep learning, wherever you are.',
    route: '/audio-books',
    icon: Headphones,
    tone: 'purple',
  },
  {
    title: 'Leaderboard',
    description: 'See how your preparation compares.',
    route: '/rank',
    icon: Trophy,
    tone: 'amber',
  },
];

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const { selectedExam } = useExam();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedBannerImages, setFailedBannerImages] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const audience = isPro ? 'pro' : 'free';
  const bannerQuery = useQuery({
    queryKey: ['hero-banners', audience],
    queryFn: () => bannerService.getActiveBanners({ audience, placement: 'home_hero' }),
    staleTime: 30000,
  });
  const liveQuery = useQuery({
    queryKey: ['active-live-test'],
    queryFn: () => api.getActiveLiveTest(),
    staleTime: 30000,
    refetchInterval: 30000,
  });
  const attemptsQuery = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 30000,
  });
  const seriesQuery = useQuery<PopularTestSeriesCard[]>({
    queryKey: ['popular-test-series-showcase'],
    queryFn: () => api.getPopularTestSeriesCards(),
    staleTime: 60000,
  });
  const leaderboardQuery = useQuery({
    queryKey: ['home-leaderboard'],
    queryFn: () => api.getAppLeaderboard('west_bengal'),
    staleTime: 60000,
  });
  const attempts = useMemo(() => attemptsQuery.data ?? [], [attemptsQuery.data]);
  const inProgressAttempt = attempts.find((attempt) => attempt.status === 'in_progress');
  const stats = useMemo(() => {
    const completed = attempts.filter((attempt) => attempt.status === 'completed');
    return {
      count: completed.length,
      accuracy: completed.length
        ? Math.round(
            completed.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0) / completed.length
          )
        : null,
      questions: completed.reduce(
        (sum, attempt) => sum + (attempt.correctCount || 0) + (attempt.wrongCount || 0),
        0
      ),
    };
  }, [attempts]);
  const series = useMemo(
    () =>
      [...(seriesQuery.data ?? [])]
        .filter((card) => card.isActive !== false)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
    [seriesQuery.data]
  );
  const liveTest = liveQuery.data;
  const liveStart = liveTest?.startAt || liveTest?.scheduledStartTime;
  const liveStartTime = liveStart ? new Date(liveStart).getTime() : NaN;
  const validLiveStart = Number.isFinite(liveStartTime);
  const remaining = validLiveStart ? Math.max(0, liveStartTime - currentTime) : 0;
  useEffect(() => {
    if (!liveStart) return;
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [liveStart]);
  const banners = bannerQuery.data ?? [];
  const bannerIndex = banners.length ? currentSlide % banners.length : 0;
  const banner = banners[bannerIndex];
  const rawBannerLink = (banner?.primaryCtaLink || '').trim();
  const externalBanner = /^https?:\/\//i.test(rawBannerLink);
  const bannerHref =
    externalBanner || isInternalPath(rawBannerLink) ? rawBannerLink : '/test-series';
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="student-dashboard">
      <header className="sd-heading">
        <div>
          <p className="sd-eyebrow">YOUR LEARNING SPACE</p>
          <h1>
            Welcome back, {firstName}
            <span className="sd-greeting" aria-hidden="true">
              {' '}
              👋
            </span>
          </h1>
          <p>A little practice today. A stronger you tomorrow.</p>
        </div>
        <Link to="/test-series" className="sd-target-link">
          <Target size={18} aria-hidden="true" />
          <span>{selectedExam?.title || 'Choose your exam'}</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div className="sd-focus-grid">
        <section className="sd-focus" aria-labelledby="sd-focus-title">
          <div className="sd-focus-top">
            <span className="sd-focus-label">
              <Sparkles size={16} aria-hidden="true" />
              {inProgressAttempt ? 'PICK UP WHERE YOU LEFT OFF' : 'MAKE TODAY COUNT'}
            </span>
            <span className="sd-plan">{isPro ? 'PRO MEMBER' : 'LET’S GET STARTED'}</span>
          </div>
          <h2 id="sd-focus-title">
            {inProgressAttempt
              ? 'Your next step? Finish strong.'
              : 'Small steps. Big possibilities.'}
          </h2>
          <p>
            {inProgressAttempt
              ? `Continue ${inProgressAttempt.testTitle || 'your test'} and turn your effort into progress.`
              : 'Explore mock tests for your exam, or sharpen one topic with a focused practice session.'}
          </p>
          <div className="sd-focus-actions">
            <Link
              to={
                inProgressAttempt
                  ? `/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`
                  : '/test-series'
              }
              className="sd-button sd-button-light"
            >
              {inProgressAttempt ? 'Resume test' : 'Explore mock tests'}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/practice" className="sd-focus-secondary">
              Practice a topic
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="sd-focus-footer">
            <CheckCircle2 size={16} aria-hidden="true" />
            Learn from every attempt, not just your score.
          </div>
        </section>
        <aside className="sd-card sd-study" aria-labelledby="sd-study-title">
          <div className="sd-icon sd-icon-amber">
            <Lightbulb size={22} aria-hidden="true" />
          </div>
          <p className="sd-eyebrow">A BETTER STUDY HABIT</p>
          <h2 id="sd-study-title">Practice. Review. Repeat.</h2>
          <p>
            After a test, review your mistakes before starting another. Small corrections make a
            real difference.
          </p>
          <Link to="/results" className="sd-text-link">
            Review your results
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </aside>
      </div>

      <section aria-labelledby="sd-progress-title" className="sd-section">
        <div className="sd-section-heading">
          <div>
            <h2 id="sd-progress-title">Your progress, at a glance</h2>
            <p>Based on your completed test attempts.</p>
          </div>
          <Link to="/results" className="sd-text-link">
            View results
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {attemptsQuery.isError ? (
          <div role="alert" className="sd-empty">
            We couldn’t load your progress.
            <button className="sd-text-link" onClick={() => void attemptsQuery.refetch()}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : (
          <div className="sd-stats" aria-busy={attemptsQuery.isLoading}>
            {[
              {
                label: 'Tests completed',
                value: stats.count,
                detail: stats.count ? 'Keep your momentum going' : 'Your first attempt starts here',
                icon: FileText,
                tone: 'blue',
              },
              {
                label: 'Average accuracy',
                value: stats.accuracy === null ? '—' : `${stats.accuracy}%`,
                detail:
                  stats.accuracy === null
                    ? 'Available after your first test'
                    : 'Across completed attempts',
                icon: Target,
                tone: 'green',
              },
              {
                label: 'Questions answered',
                value: stats.questions.toLocaleString('en-IN'),
                detail: 'Correct and incorrect answers',
                icon: CheckCircle2,
                tone: 'purple',
              },
            ].map((stat) => (
              <div key={stat.label} className="sd-card sd-stat">
                <div className={`sd-icon sd-icon-${stat.tone}`}>
                  <stat.icon size={21} aria-hidden="true" />
                </div>
                <div>
                  <h3>{stat.label}</h3>
                  <strong>{attemptsQuery.isLoading ? '…' : stat.value}</strong>
                  <p>{stat.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="sd-tools-title" className="sd-section">
        <div className="sd-section-heading">
          <div>
            <h2 id="sd-tools-title">Find your focus</h2>
            <p>Everything you need for your next study session.</p>
          </div>
        </div>
        <div className="sd-tools">
          {quickLinks.map(({ title, description, route, icon: Icon, tone }) => (
            <Link key={route} to={route} className="sd-card sd-tool">
              <div className="sd-tool-top">
                <div className={`sd-icon sd-icon-${tone}`}>
                  <Icon size={22} aria-hidden="true" />
                </div>
                <ArrowRight size={18} className="sd-tool-arrow" aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {liveTest && (
        <section className="sd-live" aria-label="Live test">
          <div className="sd-live-main">
            <div className="sd-icon sd-icon-rose">
              <Radio size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="sd-eyebrow">{remaining > 0 ? 'UPCOMING LIVE TEST' : 'LIVE TEST'}</p>
              <h2>{liveTest.title}</h2>
              {validLiveStart && (
                <p>
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata',
                  }).format(new Date(liveStartTime))}{' '}
                  IST
                </p>
              )}
            </div>
          </div>
          <div className="sd-live-action">
            {remaining > 0 && (
              <span className="sd-countdown">
                Starts in {Math.floor(remaining / 86400000)}d {Math.floor(remaining / 3600000) % 24}
                h {Math.floor(remaining / 60000) % 60}m
              </span>
            )}
            <Link
              to={liveTest.testId ? `/live-test/${liveTest.testId}` : '/live-test'}
              className="sd-button sd-button-primary"
            >
              View live test
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {banner && (
        <section className="sd-promotion" aria-label="Announcements">
          <a
            href={bannerHref}
            target={externalBanner ? '_blank' : undefined}
            rel={externalBanner ? 'noopener noreferrer' : undefined}
            onClick={() => void bannerService.trackBannerClick(banner.id)}
          >
            {banner.imageUrl && !failedBannerImages.includes(banner.imageUrl) ? (
              <picture>
                {banner.mobileImageUrl && (
                  <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />
                )}
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Explore featured tests'}
                  loading="lazy"
                  onError={() =>
                    setFailedBannerImages((previous) => [...previous, banner.imageUrl!])
                  }
                />
              </picture>
            ) : (
              <div className="sd-text-promotion">
                <p className="sd-eyebrow">FEATURED FOR YOU</p>
                <h2>{banner.title}</h2>
                {banner.subtitle && <p>{banner.subtitle}</p>}
                <span className="sd-text-link">
                  {banner.primaryCtaText || 'Explore tests'}
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
            )}
          </a>
          {banners.length > 1 && (
            <div className="sd-banner-controls">
              <button
                aria-label="Previous slide"
                onClick={() => setCurrentSlide((bannerIndex + banners.length - 1) % banners.length)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                {bannerIndex + 1} / {banners.length}
              </span>
              <button
                aria-label="Next slide"
                onClick={() => setCurrentSlide((bannerIndex + 1) % banners.length)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </section>
      )}

      <section className="sd-section" aria-labelledby="sd-series-title">
        <div className="sd-section-heading">
          <div>
            <h2 id="sd-series-title">Explore test series</h2>
            <p>A focused path towards your target exam.</p>
          </div>
          <Link to="/test-series" className="sd-text-link">
            Browse all
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {seriesQuery.isError ? (
          <div className="sd-empty" role="alert">
            Test series couldn’t be loaded.
            <button className="sd-text-link" onClick={() => void seriesQuery.refetch()}>
              Try again
            </button>
          </div>
        ) : seriesQuery.isLoading ? (
          <div className="sd-empty" role="status">
            Loading test series…
          </div>
        ) : series.length ? (
          <div className="sd-series-grid">
            {series.map((card) => (
              <Link
                key={card.id}
                to={
                  card.route && isInternalPath(card.route)
                    ? card.route
                    : `/test-series/${card.testSeriesId || card.id}`
                }
                className="sd-card sd-series"
              >
                <div className="sd-series-top">
                  <div className="sd-series-logo">
                    {card.cardLogoUrl ? (
                      <img
                        src={card.cardLogoUrl}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/logo-icon.png';
                        }}
                      />
                    ) : (
                      <FileText size={24} aria-hidden="true" />
                    )}
                  </div>
                  {card.badgeText && <span className="sd-series-badge">{card.badgeText}</span>}
                </div>
                <h3>{card.title}</h3>
                <p>{card.subtitle || 'Prepare with focused test practice.'}</p>
                <div className="sd-series-details">
                  {card.fullMockCount != null && (
                    <span>
                      <strong>{card.fullMockCount}</strong> full mocks
                    </span>
                  )}
                  {card.topicTestCount != null && (
                    <span>
                      <strong>{card.topicTestCount}</strong> topic tests
                    </span>
                  )}
                  {card.pyqTestCount != null && (
                    <span>
                      <strong>{card.pyqTestCount}</strong> PYQs
                    </span>
                  )}
                </div>
                <span className="sd-text-link">
                  Explore series
                  <ArrowRight size={17} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="sd-empty">
            <FileText size={24} aria-hidden="true" />
            <div>
              <h3>Find the right test for you</h3>
              <p>Browse the catalog to explore available exams and test series.</p>
            </div>
            <Link to="/test-series" className="sd-button sd-button-primary">
              Browse catalog
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="sd-card sd-leaderboard" aria-labelledby="sd-rank-title">
        <div className="sd-section-heading">
          <div>
            <h2 id="sd-rank-title">Learning together, growing together</h2>
            <p>West Bengal leaderboard</p>
          </div>
          <Link to="/rank" className="sd-text-link">
            View rankings
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {leaderboardQuery.isError ? (
          <div className="sd-empty" role="alert">
            Rankings couldn’t be loaded.
            <button className="sd-text-link" onClick={() => void leaderboardQuery.refetch()}>
              Try again
            </button>
          </div>
        ) : leaderboardQuery.isLoading ? (
          <p className="sd-muted" role="status">
            Loading rankings…
          </p>
        ) : leaderboardQuery.data?.length ? (
          <ol className="sd-ranks">
            {leaderboardQuery.data.slice(0, 4).map((row) => (
              <li key={row.rank}>
                <span className="sd-rank-number">{row.rank}</span>
                <div>
                  <strong>{row.display_name}</strong>
                  <span>{Number(row.tests_count) || 0} tests completed</span>
                </div>
                <b>{Math.round(Number(row.average_percentage) || 0)}%</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sd-muted">
            Rankings will appear here when results are available. Keep practising!
          </p>
        )}
      </section>
    </div>
  );
};
