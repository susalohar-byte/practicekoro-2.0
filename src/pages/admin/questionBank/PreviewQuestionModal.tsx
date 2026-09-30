import React from 'react';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { MathText } from '@/components/common/MathText';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import type { Question } from '@/types';

export interface PreviewQuestionModalProps {
  question: Question;
  onClose: () => void;
}

/** Read-only question preview (extracted verbatim from AdminQuestionBank). */
export const PreviewQuestionModal: React.FC<PreviewQuestionModalProps> = ({
  question,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" /> Question Details
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">
            <MathText>{question.questionBengaliText || question.questionText}</MathText>
          </p>

          <div className="space-y-1.5 pt-1">
            {[
              { key: 'A', text: question.optionA },
              { key: 'B', text: question.optionB },
              { key: 'C', text: question.optionC },
              { key: 'D', text: question.optionD },
            ].map((opt) => {
              const isCorrect = question.correctOption === opt.key;
              return (
                <div
                  key={opt.key}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>
                    ({opt.key.toLowerCase()}) <MathText>{opt.text}</MathText>
                  </span>
                  {isCorrect && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                      Correct Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {(question.explanationBengali || question.explanation) && (
            <div className="space-y-2">
              <ShortNotesBox
                explanation={question.explanationBengali || question.explanation}
                isMathematics={isMathematicsQuestion(question)}
                defaultExpanded={true}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
