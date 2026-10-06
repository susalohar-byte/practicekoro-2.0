import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  Filter,
} from 'lucide-react';
import type { MockTest, Question, Subject, Chapter } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

interface AddQuestionsToTestModalProps {
  test: MockTest | null;
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  chapters: Chapter[];
  onQuestionsAssigned: () => void;
}

export const AddQuestionsToTestModal: React.FC<AddQuestionsToTestModalProps> = ({
  test,
  isOpen,
  onClose,
  subjects,
  chapters,
  onQuestionsAssigned,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(test?.subjectId || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(test?.chapterId || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    if (!test || !isOpen) return;

    setSelectedSubjectId(test.subjectId || '');
    setSelectedChapterId(test.chapterId || '');
    loadInitialData();
  }, [test?.id, isOpen]);

  const loadInitialData = async () => {
    if (!test) return;
    setIsLoading(true);
    try {
      // 1. Get already assigned questions
      const assigned = await api.getTestAssignedQuestions(test.id);
      const assignedIds = new Set(assigned.map((a) => a.questionId));
      setSelectedQuestionIds(new Set(assignedIds));

      // 2. Load available questions from Central Question Bank
      const allQs = await api.getAllAdminQuestions({
        subjectId: test.subjectId || undefined,
        chapterId: test.chapterId || undefined,
      });
      setQuestions(allQs);
    } catch (err) {
      console.error('Failed to load question bank:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = async () => {
    setIsLoading(true);
    try {
      const filtered = await api.getAllAdminQuestions({
        subjectId: selectedSubjectId || undefined,
        chapterId: selectedChapterId || undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchTerm.trim() || undefined,
      });
      setQuestions(filtered);
    } catch (err) {
      console.error('Failed to filter questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !test) return null;

  const availableChapters = chapters.filter(
    (c) => !selectedSubjectId || c.subjectId === selectedSubjectId
  );

  const toggleSelectQuestion = (id: string) => {
    const next = new Set(selectedQuestionIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedQuestionIds(next);
  };

  const handleSelectAllVisible = () => {
    const next = new Set(selectedQuestionIds);
    questions.forEach((q) => next.add(q.id));
    setSelectedQuestionIds(next);
  };

  const handleDeselectAllVisible = () => {
    const next = new Set(selectedQuestionIds);
    questions.forEach((q) => next.delete(q.id));
    setSelectedQuestionIds(next);
  };

  const handleSaveAssignments = async () => {
    if (!test) return;
    setIsSaving(true);
    try {
      // Build question assignments preserving previous orders where possible
      const orderedIds = Array.from(selectedQuestionIds);
      const payload = orderedIds.map((qId, idx) => ({
        questionId: qId,
        orderIndex: idx + 1,
        marks: 1.0,
        negativeMarks: test.negativeMarking || 0,
      }));

      await api.saveTestQuestions(test.id, payload);
      alert(`Successfully saved ${payload.length} questions to "${test.title}"!`);
      onQuestionsAssigned();
      onClose();
    } catch (err) {
      console.error('Failed to save test questions:', err);
      alert('Failed to save questions: ' + getErrorMessage(err, 'Save failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#070D1E] shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Assign Questions from Central Question Bank
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Test: <span className="font-semibold text-blue-600 dark:text-blue-400">{test.title}</span> • Questions are referenced without duplication.
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

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080E22] shrink-0 space-y-3">
          <div className="grid grid-cols-4 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search question text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Subject Dropdown */}
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapterId('');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Topic Dropdown */}
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Topics</option>
              {availableChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Select All Visible
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-semibold hover:underline"
              >
                Deselect All
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filter
            </Button>
          </div>
        </div>

        {/* Question List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Loading questions from Question Bank...
            </div>
          ) : questions.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No questions found matching the selected filters.
            </div>
          ) : (
            questions.map((q) => {
              const isSelected = selectedQuestionIds.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelectQuestion(q.id)}
                  className={cn(
                    'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3',
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-[#070D1E]'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {q.questionBengaliText || q.questionText}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {q.difficulty}
                      </span>
                    </div>

                    {q.questionBengaliText && q.questionText && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                        {q.questionText}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10.5px] text-slate-400">
                      {q.subjectName && <span>Subject: {q.subjectName}</span>}
                      {q.chapterName && <span>Topic: {q.chapterName}</span>}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Correct: Option {q.correctOption}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#070D1E] shrink-0 flex items-center justify-between">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Selected: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedQuestionIds.size}</span> questions
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAssignments}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4"
            >
              {isSaving ? 'Assigning...' : `Assign ${selectedQuestionIds.size} Questions`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
