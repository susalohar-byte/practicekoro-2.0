import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, FileText, Trophy, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, type LiveTest } from '@/services/api';

const formatCountdown = (target: string) => {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return { days, hours, mins, secs };
};

export const LiveTest: React.FC = () => {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState<LiveTest | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const load = async () => {
      try {
        const value = await api.getFeaturedLiveTest();
        setTest(value);
        if (value && user?.id) setRegistered(await api.isRegistered(value.id, user.id));
      } finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const state = useMemo(() => {
    if (!test) return 'empty';
    const start = new Date(test.scheduledStartAt).getTime();
    const end = new Date(test.scheduledEndAt).getTime();
    if (test.status === 'cancelled') return 'cancelled';
    if (now < start) return 'upcoming';
    if (now <= end) return 'live';
    return 'ended';
  }, [test, now]);

  const countdown = test && state === 'upcoming' ? formatCountdown(test.scheduledStartAt) : null;

  const join = async () => {
    if (!test || !user?.id) return;
    if (test.subscriptionRequired && !isPro) {
      navigate('/subscription');
      return;
    }
    setJoining(true);
    try {
      await api.joinLiveTest(test.id, user.id);
      setRegistered(true);
      if (state === 'live') {
        navigate(`/exams/${test.testId}/runner`);
      }
    } finally { setJoining(false); }
  };

  if (loading) return <div className="pk-student-page"><div className="pk-content"><div className="pk-panel p-8 animate-pulse">Loading Live Test...</div></div></div>;

  if (!test) return (
    <div className="pk-student-page"><div className="pk-content">
      <div className="pk-panel p-10 text-center">
        <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h1 className="text-xl font-black text-[#0B1F44]">No Live Test Scheduled</h1>
        <p className="mt-2 text-sm text-slate-500">Check back later for the next scheduled examination.</p>
      </div>
    </div></div>
  );

  return (
    <div className="pk-student-page">
      <div className="pk-content space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-400">Home / Live Test</p>
          <h1 className="mt-1 text-2xl font-black text-[#0B1F44]">Live Test</h1>
        </div>

        <div className="pk-panel overflow-hidden">
          <div className="bg-gradient-to-br from-[#063585] to-[#0158FC] p-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-black uppercase">
                {state === 'live' ? 'Live Now' : state === 'upcoming' ? 'Scheduled' : state}
              </span>
              {test.rankingEnabled && <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">Ranked Test</span>}
            </div>
            <h2 className="mt-4 text-2xl font-black">{test.title}</h2>
            {test.description && <p className="mt-2 max-w-2xl text-sm text-blue-100">{test.description}</p>}
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Info icon={<CalendarClock />} label="Start" value={new Date(test.scheduledStartAt).toLocaleString()} />
            <Info icon={<Clock3 />} label="Duration" value={`${test.durationMinutes} minutes`} />
            <Info icon={<FileText />} label="Questions" value={`${test.test?.totalQuestions || 0}`} />
            <Info icon={<Trophy />} label="Ranking" value={test.rankingEnabled ? 'Enabled' : 'Disabled'} />
          </div>

          {countdown && (
            <div className="grid grid-cols-4 gap-2 border-t border-slate-100 p-5">
              {[
                ['Days', countdown.days], ['Hours', countdown.hours], ['Minutes', countdown.mins], ['Seconds', countdown.secs]
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-[#EFF5FB] p-3 text-center">
                  <div className="text-2xl font-black text-[#063585]">{String(value).padStart(2,'0')}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              {registered ? <span className="inline-flex items-center gap-2 font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> You're registered</span> : 'Register once to enter this Live Test.'}
            </div>
            <button onClick={join} disabled={joining || state === 'ended' || state === 'cancelled'} className="pk-primary-btn inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {joining ? 'Please wait...' : state === 'live' ? 'Join Now' : registered ? 'View Test' : 'Register'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
    <div className="text-[#0158FC]">{React.cloneElement(icon as React.ReactElement, { className:'h-5 w-5' })}</div>
    <div><div className="text-[10px] font-bold uppercase text-slate-400">{label}</div><div className="text-sm font-bold text-[#0B1F44]">{value}</div></div>
  </div>
);
