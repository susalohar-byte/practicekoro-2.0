import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  BookOpen,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import type { Exam, Subject, Chapter, MockTest } from '@/types';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface CreateMockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  onTestCreated: (test: MockTest) => void;
  initialType?: 'full_mock' | 'topic' | 'pyq';
}

export const CreateMockTestModal: React.FC<CreateMockTestModalProps> = ({
  isOpen,
  onClose,
  exams,
  subjects,
  chapters,
  onTestCreated,
  initialType = 'full_mock',
}) => {
  const [testType, setTestType] = useState<'full_mock' | 'topic' | 'pyq'>(initialType);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [paperName, setPaperName] = useState('Prelims');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode defaults when testType changes
  useEffect(() => {
    if (testType === 'full_mock') {
      setDurationMinutes(90);
      setTotalMarks(100);
      setPassingMarks(40);
      setNegativeMarking(0.25);
      if (exams.length > 0 && !examId) setExamId(exams[0].id);
    } else if (testType === 'topic') {
      setDurationMinutes(30);
      setTotalMarks(25);
      setPassingMarks(10);
      setNegativeMarking(0.25);
      if (subjects.length > 0 && !subjectId) setSubjectId(subjects[0].id);
    } else if (testType === 'pyq') {
      setDurationMinutes(60);
      setTotalMarks(85);
      setPassingMarks(35);
      setNegativeMarking(0.25);
      if (exams.length > 0 && !examId) setExamId(exams[0].id);
    }
  }, [testType, exams, subjects]);

  // Filter topics based on selected subject
  const availableChapters = chapters.filter((c) => !subjectId || c.subjectId === subjectId);

  // Auto-generate a title suggestion if title is empty
  const handleAutoSuggestTitle = () => {
    if (testType === 'full_mock') {
      const selectedExam = exams.find((e) => e.id === examId);
      if (selectedExam) {
        setTitle(`${selectedExam.title} Full Mock Test 01`);
      }
    } else if (testType === 'topic') {
      const selectedSub = subjects.find((s) => s.id === subjectId);
      const selectedTop = chapters.find((c) => c.id === chapterId);
      if (selectedTop) {
        setTitle(`${selectedTop.name} - Topic Practice Test`);
      } else if (selectedSub) {
        setTitle(`${selectedSub.name} Topic Test`);
      }
    } else if (testType === 'pyq') {
      const selectedExam = exams.find((e) => e.id === examId);
      if (selectedExam) {
        setTitle(`${selectedExam.title} ${year} ${paperName} Official PYQ`);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Please provide a test title.');
      return;
    }

    if (testType === 'full_mock' && !examId) {
      setError('Full Mock tests must be linked to a specific competitive exam.');
      return;
    }

    if (testType === 'topic' && (!subjectId || !chapterId)) {
      setError('Topic tests must be linked to both a Subject and a Topic.');
      return;
    }

    if (testType === 'pyq' && (!examId || !year)) {
      setError('Official PYQ tests must be linked to an Exam and an Exam Year.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createTest({
        title: title.trim(),
        description: description.trim() || undefined,
        testType,
        examId: testType === 'topic' ? undefined : examId || undefined,
        subjectId: testType === 'topic' ? subjectId : undefined,
        chapterId: testType === 'topic' ? chapterId : undefined,
        year: testType === 'pyq' ? year : undefined,
        paperName: testType === 'pyq' ? paperName : undefined,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        negativeMarking: Number(negativeMarking),
        isPremium,
        status,
        totalQuestions: 0,
        orderIndex: 0,
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        isActive: true,
      });

      onTestCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create mock test:', err);
      setError(getErrorMessage(err, 'Failed to create mock test. Please check inputs.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-[#070D1E]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Create New Mock Test
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure parameters for exams, subject topics, or official previous year questions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector - 3 Modes: Full Mock, Topic Test, Official PYQ */}
        <div className="p-6 pb-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
            Test Mode *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* 1. Full Mock */}
            <button
              type="button"
              onClick={() => setTestType('full_mock')}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between',
                testType === 'full_mock'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D1E]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                {testType === 'full_mock' && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Full Mock
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Complete exam pattern
                </span>
              </div>
            </button>

            {/* 2. Topic Test */}
            <button
              type="button"
              onClick={() => setTestType('topic')}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between',
                testType === 'topic'
                  ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D1E]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                {testType === 'topic' && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Topic Test
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Subject & topic specific
                </span>
              </div>
            </button>

            {/* 3. Official PYQ */}
            <button
              type="button"
              onClick={() => setTestType('pyq')}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between',
                testType === 'pyq'
                  ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 ring-1 ring-rose-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D1E]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                {testType === 'pyq' && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Official PYQ
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Past year question paper
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Conditional Linking Section based on Mode */}
          {testType === 'full_mock' && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target Exam *
              </label>
              <select
                required
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Exam</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {testType === 'topic' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject *
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setChapterId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Topic *
                </label>
                <select
                  required
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Topic</option>
                  {availableChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {testType === 'pyq' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Exam *
                </label>
                <select
                  required
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select Exam</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  min={2000}
                  max={2030}
                  required
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Paper / Shift
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prelims / Shift 1"
                  value={paperName}
                  onChange={(e) => setPaperName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* Test Title & Auto Suggest */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Test Title *
              </label>
              <button
                type="button"
                onClick={handleAutoSuggestTitle}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Auto-generate name
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. WBP Constable Full Mock 01"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Description (Bengali / English)
            </label>
            <textarea
              rows={2}
              placeholder="Optional overview or guidelines for this mock test..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Duration, Marks, Negative Marking */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Duration (min) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Total Marks *
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Passing Marks
              </label>
              <input
                type="number"
                min={0}
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Negative Mark
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Access & Publish Status */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Published (Ready for practice)</option>
                <option value="draft">Draft (Hidden from students)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Access Plan
              </label>
              <select
                value={isPremium ? 'pro' : 'free'}
                onChange={(e) => setIsPremium(e.target.value === 'pro')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free Practice for All</option>
                <option value="pro">PRO Members Only</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5"
            >
              {isSubmitting ? 'Creating...' : '+ Create Mock Test'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
