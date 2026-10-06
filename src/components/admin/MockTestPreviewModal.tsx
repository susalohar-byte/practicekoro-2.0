import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import type { MockTest, TestQuestionAssignment } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface MockTestPreviewModalProps {
  test: MockTest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MockTestPreviewModal: React.FC<MockTestPreviewModalProps> = ({
  test,
  isOpen,
  onClose,
}) => {
  const [questions, setQuestions] = useState<TestQuestionAssignment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!test || !isOpen) return;

    loadQuestions();
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
  }, [test?.id, isOpen]);

  const loadQuestions = async () => {
    if (!test) return;
    setIsLoading(true);
    try {
      const data = await api.getTestAssignedQuestions(test.id);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions for preview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !test) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: option,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#070D1E] shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold tracking-wide">
              ADMIN PREVIEW
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                {test.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Duration: {test.durationMinutes} mins • Total Marks: {test.totalMarks} • Negative: -{test.negativeMarking} marks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>{test.durationMinutes}:00</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Loading mock test examination preview...
          </div>
        ) : questions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Questions Attached
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              This mock test currently has no questions assigned. Add questions from the Question Bank in the drawer to preview.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Area: Current Question View */}
            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 border-r border-slate-200 dark:border-slate-800">
              <div className="space-y-6">
                {/* Question Info Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    {currentQ.difficulty && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {currentQ.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Marks: <span className="text-emerald-600">+{currentQ.marks || 1}</span> /{' '}
                    <span className="text-rose-600">-{currentQ.negativeMarks ?? 0}</span>
                  </div>
                </div>

                {/* Question Content */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.questionBengaliText || currentQ.questionText}
                  </h4>
                  {currentQ.questionBengaliText && currentQ.questionText && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {currentQ.questionText}
                    </p>
                  )}
                  {currentQ.imageUrl && (
                    <img
                      src={currentQ.imageUrl}
                      alt="Question attachment"
                      className="max-h-56 rounded-xl border border-slate-200 dark:border-slate-800 object-contain"
                    />
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2.5 pt-2">
                  {[
                    { key: 'A', text: currentQ.optionA },
                    { key: 'B', text: currentQ.optionB },
                    { key: 'C', text: currentQ.optionC },
                    { key: 'D', text: currentQ.optionD },
                  ].map((opt) => {
                    if (!opt.text) return null;
                    const isSelected = selectedAnswers[currentIndex] === opt.key;
                    const isCorrect = currentQ.correctOption === opt.key;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={cn(
                          'w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all duration-150',
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D1E]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0',
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            )}
                          >
                            {opt.key}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {opt.text}
                          </span>
                        </div>

                        {showExplanation && isCorrect && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Correct Answer
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Solution Drawer Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showExplanation ? 'Hide Solution & Explanation' : 'View Solution & Explanation'}
                  </button>

                  {showExplanation && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Correct Option: {currentQ.correctOption}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {currentQ.explanationBengali ||
                          currentQ.explanation ||
                          'No explanation provided for this question yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Nav Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex((prev) => prev - 1);
                    setShowExplanation(false);
                  }}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAnswers((prev) => {
                        const next = { ...prev };
                        delete next[currentIndex];
                        return next;
                      });
                    }}
                    className="text-xs text-slate-500"
                  >
                    Clear Response
                  </Button>

                  <Button
                    size="sm"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => {
                      setCurrentIndex((prev) => prev + 1);
                      setShowExplanation(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Area: Question Navigation Palette */}
            <div className="w-72 bg-slate-50/60 dark:bg-[#070D1E] p-5 flex flex-col justify-between overflow-y-auto shrink-0">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Question Palette
                </h4>

                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, idx) => {
                    const isAnswered = Boolean(selectedAnswers[idx]);
                    const isCurrent = idx === currentIndex;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCurrentIndex(idx);
                          setShowExplanation(false);
                        }}
                        className={cn(
                          'w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center',
                          isCurrent
                            ? 'ring-2 ring-blue-500 bg-blue-600 text-white'
                            : isAnswered
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-blue-600 shrink-0" />
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <span>Not Answered</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
