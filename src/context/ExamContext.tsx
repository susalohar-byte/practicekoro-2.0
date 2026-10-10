import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { EXAMS_UPDATED_EVENT } from '@/lib/dataSync';
import type { Exam } from '@/types';

interface ExamContextType {
  exams: Exam[];
  selectedExam: Exam | null;
  setSelectedExam: (exam: Exam) => void;
  selectExamById: (examId: string) => void;
  loading: boolean;
  /** Re-fetch exams from the database (e.g. after admin edits). */
  refreshExams: () => Promise<void>;
}

function readSavedExamId(): string | null {
  try {
    return localStorage.getItem('practicekoro_selected_exam');
  } catch {
    return null;
  }
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExamState] = useState<Exam | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshExams = useCallback(async () => {
    try {
      const data = await api.getExams();
      setExams(data);
      // Keep the selection if it still exists, else fall back gracefully.
      setSelectedExamState((prev) => {
        if (prev && data.some((e) => e.id === prev.id)) {
          return data.find((e) => e.id === prev.id)!;
        }
        const savedExamId = readSavedExamId();
        return data.find((e) => e.id === savedExamId) || data[0] || null;
      });
    } catch (err) {
      console.error('Error refreshing exams:', err);
    }
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await api.getExams();
        setExams(data);

        // Load saved exam preference or default to WBP Constable
        const savedExamId = readSavedExamId();
        const found = data.find((e) => e.id === savedExamId) || data[0] || null;
        setSelectedExamState(found);
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();

    // Live sync: admin exam create/update/delete re-fetches the list so
    // student UI never shows stale exams without a full reload.
    const handleExamsUpdated = () => {
      void refreshExams();
    };
    window.addEventListener(EXAMS_UPDATED_EVENT, handleExamsUpdated);
    return () => window.removeEventListener(EXAMS_UPDATED_EVENT, handleExamsUpdated);
  }, [refreshExams]);

  const setSelectedExam = (exam: Exam) => {
    setSelectedExamState(exam);
    try {
      localStorage.setItem('practicekoro_selected_exam', exam.id);
    } catch {
      /* In-memory selection still works when storage is blocked. */
    }
  };

  const selectExamById = (examId: string) => {
    const found = exams.find((e) => e.id === examId);
    if (found) {
      setSelectedExam(found);
    }
  };

  return (
    <ExamContext.Provider
      value={{
        exams,
        selectedExam,
        setSelectedExam,
        selectExamById,
        loading,
        refreshExams,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};
