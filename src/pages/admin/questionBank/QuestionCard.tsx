import React from 'react';
import { BookOpen, Check, Edit2, Lock, Trash2 } from 'lucide-react';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import type { Question } from '@/types';

export interface QuestionCardProps {
  q: Question;
  questionNumber: number;
  isSelected: boolean;
  subjectTitle: string;
  notesExpanded: boolean;
  onToggleSelect: () => void;
  onOpenEdit: () => void;
  onRequestDelete: () => void;
  onToggleNotes: () => void;
  onPreview: () => void;
}

/** Single question card (extracted verbatim from AdminQuestionBank; props-driven). */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  q,
  questionNumber,
  isSelected,
  subjectTitle,
  notesExpanded,
  onToggleSelect,
  onOpenEdit,
  onRequestDelete,
  onToggleNotes,
  onPreview,
}) => {
  return (
    <div
      key={q.id}
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 sm:p-6 transition-all shadow-xs ${
        isSelected
          ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20 dark:bg-sky-950/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Row: Selection circle, Question text, Action Icons */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Selection Checkbox */}
          <button
            type="button"
            onClick={onToggleSelect}
            title={isSelected ? 'Deselect question' : 'Select question'}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isSelected
                ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 hover:border-sky-400 dark:hover:border-sky-500'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Question Number & Text */}
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              {questionNumber}. {q.questionBengaliText || q.questionText}
            </h3>
          </div>
        </div>

        {/* Top-Right Actions: Edit & Delete */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={onOpenEdit}
            title="Edit Question"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRequestDelete}
            title="Delete Question"
            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle: 2-Column Options Grid (Column 1 = A & C, Column 2 = B & D) */}
      <div className="ml-8 mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-800 dark:text-slate-200">
        {/* Column 1: A and C */}
        <div className="space-y-2">
          {/* Option A */}
          <div
            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
              q.correctOption === 'A'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-300/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 shadow-2xs font-medium ring-1 ring-emerald-500/15'
                : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-baseline gap-2 min-w-0">
              <span
                className={`font-bold shrink-0 ${
                  q.correctOption === 'A'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                A.
              </span>
              <span
                className={
                  q.correctOption === 'A'
                    ? 'font-semibold text-emerald-950 dark:text-emerald-100'
                    : ''
                }
              >
                {q.optionA}
              </span>
            </div>
            {q.correctOption === 'A' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md select-none shrink-0 ml-1">
                ✓ Correct
              </span>
            )}
          </div>

          {/* Option C */}
          <div
            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
              q.correctOption === 'C'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-300/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 shadow-2xs font-medium ring-1 ring-emerald-500/15'
                : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-baseline gap-2 min-w-0">
              <span
                className={`font-bold shrink-0 ${
                  q.correctOption === 'C'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                C.
              </span>
              <span
                className={
                  q.correctOption === 'C'
                    ? 'font-semibold text-emerald-950 dark:text-emerald-100'
                    : ''
                }
              >
                {q.optionC}
              </span>
            </div>
            {q.correctOption === 'C' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md select-none shrink-0 ml-1">
                ✓ Correct
              </span>
            )}
          </div>
        </div>

        {/* Column 2: B and D */}
        <div className="space-y-2">
          {/* Option B */}
          <div
            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
              q.correctOption === 'B'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-300/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 shadow-2xs font-medium ring-1 ring-emerald-500/15'
                : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-baseline gap-2 min-w-0">
              <span
                className={`font-bold shrink-0 ${
                  q.correctOption === 'B'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                B.
              </span>
              <span
                className={
                  q.correctOption === 'B'
                    ? 'font-semibold text-emerald-950 dark:text-emerald-100'
                    : ''
                }
              >
                {q.optionB}
              </span>
            </div>
            {q.correctOption === 'B' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md select-none shrink-0 ml-1">
                ✓ Correct
              </span>
            )}
          </div>

          {/* Option D */}
          <div
            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
              q.correctOption === 'D'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-300/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 shadow-2xs font-medium ring-1 ring-emerald-500/15'
                : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-baseline gap-2 min-w-0">
              <span
                className={`font-bold shrink-0 ${
                  q.correctOption === 'D'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                D.
              </span>
              <span
                className={
                  q.correctOption === 'D'
                    ? 'font-semibold text-emerald-950 dark:text-emerald-100'
                    : ''
                }
              >
                {q.optionD}
              </span>
            </div>
            {q.correctOption === 'D' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md select-none shrink-0 ml-1">
                ✓ Correct
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Short Notes / Explanation Toggle Icon & Clean Format */}
      {Boolean(q.explanationBengali || q.explanation) && (
        <div className="ml-8 mt-3.5">
          <ShortNotesBox
            explanation={q.explanationBengali || q.explanation}
            isExpanded={notesExpanded}
            collapsible={true}
            onToggle={onToggleNotes}
            isMathematics={isMathematicsQuestion(q)}
          />
        </div>
      )}

      {/* Bottom Row: Book icon, subject name, bn, Lock icon */}
      <div className="ml-8 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>{subjectTitle}</span>
          </div>
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{q.defaultMarks || 1} Mark</span>
          {q.explanation && (
            <button
              type="button"
              onClick={onPreview}
              className="ml-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
            >
              View Solution
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
