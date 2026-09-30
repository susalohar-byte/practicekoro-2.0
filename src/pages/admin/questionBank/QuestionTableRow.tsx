import React from 'react';
import { Archive, Check, Edit2, Eye, Trash2 } from 'lucide-react';
import type { Question } from '@/types';

export interface QuestionTableRowProps {
  q: Question;
  questionNumber: number;
  examTitle?: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onPreview: () => void;
  onOpenEdit: () => void;
  onArchive: () => void;
  onRequestDelete: () => void;
}

/** Compact table row (extracted verbatim from AdminQuestionBank; props-driven). */
export const QuestionTableRow: React.FC<QuestionTableRowProps> = ({
  q,
  questionNumber,
  examTitle,
  isSelected = false,
  onToggleSelect,
  onPreview,
  onOpenEdit,
  onArchive,
  onRequestDelete,
}) => {
  const isTopic = q.sourceType === 'topic';
  const isExam = q.sourceType === 'other' || Boolean(q.sourceExam);
  const isPyq = q.sourceType === 'pyq';
  return (
    <tr key={q.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors ${isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''}`}>
      {/* Checkbox + Question Index */}
      <td className="px-3 py-3.5 text-center">
        <div className="flex items-center justify-center gap-2">
          {onToggleSelect && (
            <button
              type="button"
              onClick={onToggleSelect}
              className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'border-sky-500 bg-sky-500 text-white'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 hover:border-sky-400'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          )}
          <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px]">{questionNumber}</span>
        </div>
      </td>

      {/* Question Text */}
      <td className="px-4 py-3.5 max-w-md">
        <div className="space-y-1">
          <p className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
            {q.questionBengaliText || q.questionText}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500">
              {q.defaultMarks} Mark
            </span>
          </div>
        </div>
      </td>

      {/* Source & Hierarchy */}
      <td className="px-4 py-3 text-[11px]">
        {isTopic && (
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              Topic Test
            </span>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {q.subjectName || 'Subject'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {q.topicName || q.chapterName || 'General Topic'}
            </p>
          </div>
        )}

        {isExam && (
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
              Full Mock Test
            </span>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {examTitle || q.sourceExam || 'Standard Exam'}
            </p>
            {q.testTitle && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {q.testTitle}
              </p>
            )}
          </div>
        )}

        {isPyq && (
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              PYQ Paper
            </span>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {q.sourceExam || 'WBP Exam'} {q.sourceYear ? `(${q.sourceYear})` : ''}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {q.sourcePaper || 'Official Paper'}
            </p>
          </div>
        )}
      </td>

      {/* Options Overview */}
      <td className="px-4 py-3 text-[11px] max-w-xs">
        <div className="grid grid-cols-2 gap-1.5">
          <div
            className={`p-1 rounded text-[10px] line-clamp-1 ${
              q.correctOption === 'A'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-500'
            }`}
          >
            (a) {q.optionA}
          </div>
          <div
            className={`p-1 rounded text-[10px] line-clamp-1 ${
              q.correctOption === 'B'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-500'
            }`}
          >
            (b) {q.optionB}
          </div>
          <div
            className={`p-1 rounded text-[10px] line-clamp-1 ${
              q.correctOption === 'C'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-500'
            }`}
          >
            (c) {q.optionC}
          </div>
          <div
            className={`p-1 rounded text-[10px] line-clamp-1 ${
              q.correctOption === 'D'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-500'
            }`}
          >
            (d) {q.optionD}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            q.status === 'active' || (!q.status && q.isActive)
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {q.status || (q.isActive ? 'active' : 'archived')}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onPreview}
            title="Preview Question"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenEdit}
            title="Edit Question"
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onArchive}
            title={q.status === 'archived' ? 'Unarchive' : 'Archive'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRequestDelete}
            title="Delete Question"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
