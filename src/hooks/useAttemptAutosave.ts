import { useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import type { AttemptAnswerState } from '@/types';

export function useAttemptAutosave(
  attemptId: string,
  answers: Record<string, AttemptAnswerState>,
  timeSpent: number,
  enabled: boolean
) {
  const timeRef = useRef(timeSpent);
  timeRef.current = timeSpent;
  const sequence = useRef(0);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const version = ++sequence.current;
    if (!enabled || !attemptId || !Object.keys(answers).length) return;
    // Keep immediate browser recovery independently of server/network success.
    try {
      localStorage.setItem(
        `practicekoro_attempt_${attemptId}`,
        JSON.stringify({
          answers: Object.values(answers),
          timeSpentSeconds: timeRef.current,
          updatedAt: Date.now(),
        })
      );
    } catch {
      /* The server remains authoritative when browser storage is unavailable. */
    }
    const timer = setTimeout(async () => {
      try {
        const saved = await api.saveAnswers(attemptId, Object.values(answers), timeRef.current);
        if (!saved) throw new Error('Save not confirmed');
        if (version === sequence.current) setError('');
      } catch {
        if (version === sequence.current)
          setError('Answers could not be saved to the server. Keep this page open and retry.');
      }
    }, 2000);
    const counter = sequence;
    return () => {
      clearTimeout(timer);
      counter.current++;
    };
  }, [answers, attemptId, enabled, retry]);
  return { error, retry: () => setRetry((value) => value + 1) };
}
