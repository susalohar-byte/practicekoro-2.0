import type { Subject, Chapter, MockTest } from '@/types';
export interface SubjectReportingData {
  questions: { id: string; subject_id?: string; chapter_id?: string; topic_id?: string }[] | null;
  attempts:
    | {
        id: string;
        test_id: string;
        status: string;
        score: number;
        total_marks: number;
        correct_count: number;
        wrong_count: number;
      }[]
    | null;
  warnings: string[];
}
export interface SubjectDetails extends Subject {
  category: string;
  topicsCount: number;
  topicTestsCount: number;
  totalQuestionsCount: number;
  totalQuestionsFormatted: string;
  statusLabel: 'Published' | 'Draft';
  attemptsCount: number | null;
  createdByName: string;
  createdAtFormatted: string;
  updatedAtFormatted: string;
  avgScoreFormatted: string;
  completionRateFormatted: string;
}
export function isSubjectTopicTest(t: MockTest) {
  return t.testType === 'topic' || t.testType === 'chapter_mock';
}
export function subjectTopics(subjectId: string, chapters: Chapter[]) {
  return chapters.filter((c) => c.subjectId === subjectId);
}
export function subjectTests(subjectId: string, chapters: Chapter[], tests: MockTest[]) {
  const ids = new Set(subjectTopics(subjectId, chapters).map((c) => c.id));
  return tests.filter(
    (t) => t.subjectId === subjectId || (!t.subjectId && !!t.chapterId && ids.has(t.chapterId))
  );
}
export function enrichSubject(
  s: Subject,
  chapters: Chapter[],
  tests: MockTest[],
  report: SubjectReportingData
): SubjectDetails {
  const topics = subjectTopics(s.id, chapters),
    topicIds = new Set(topics.map((t) => t.id));
  const linked = subjectTests(s.id, chapters, tests),
    testIds = new Set(linked.map((t) => t.id));
  const questions = report.questions?.filter(
    (q) =>
      q.subject_id === s.id ||
      (!q.subject_id && [q.chapter_id, q.topic_id].some((id) => id && topicIds.has(id)))
  );
  const attempts = report.attempts?.filter((a) => testIds.has(a.test_id));
  const completed = attempts?.filter((a) => a.status === 'completed');
  const scored = completed?.filter((a) => Number(a.total_marks) > 0) || [];
  const mean = scored.length
    ? scored.reduce((sum, a) => sum + (Number(a.score) / Number(a.total_marks)) * 100, 0) /
      scored.length
    : null;
  const formatDate = (value?: string) =>
    value && Number.isFinite(Date.parse(value))
      ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      : 'Unavailable';
  return {
    ...s,
    category: s.category || 'General',
    topicsCount: topics.length,
    topicTestsCount: linked.filter(isSubjectTopicTest).length,
    totalQuestionsCount: questions?.length ?? 0,
    totalQuestionsFormatted: questions ? questions.length.toLocaleString('en-IN') : 'Unavailable',
    statusLabel: s.isActive ? 'Published' : 'Draft',
    attemptsCount: attempts?.length ?? null,
    createdByName: 'Unavailable',
    createdAtFormatted: formatDate(s.createdAt),
    updatedAtFormatted: formatDate(s.updatedAt),
    avgScoreFormatted: mean === null ? 'Unavailable' : `${Math.round(mean * 10) / 10}%`,
    completionRateFormatted: attempts?.length
      ? `${Math.round(((completed?.length || 0) / attempts.length) * 1000) / 10}%`
      : 'Unavailable',
  };
}
export function subjectSummary(
  subjects: Subject[],
  chapters: Chapter[],
  tests: MockTest[],
  report: SubjectReportingData
) {
  const ids = new Set(
    subjects.flatMap((s) => subjectTests(s.id, chapters, tests).map((t) => t.id))
  );
  const attempts = report.attempts?.filter((a) => ids.has(a.test_id));
  const complete = attempts?.filter((a) => a.status === 'completed') || [];
  const correct = complete.reduce((s, a) => s + Number(a.correct_count || 0), 0),
    wrong = complete.reduce((s, a) => s + Number(a.wrong_count || 0), 0);
  return {
    attempts: attempts?.length ?? null,
    accuracy:
      report.attempts && correct + wrong > 0
        ? `${Math.round((correct / (correct + wrong)) * 1000) / 10}%`
        : 'Unavailable',
    topicTests: tests.filter((t) => isSubjectTopicTest(t) && ids.has(t.id)).length,
  };
}
export function validateSubjectInput(input: Partial<Subject>) {
  if (!input.name?.trim()) throw new Error('Subject name is required.');
  if (!input.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug))
    throw new Error(
      'Enter a valid lowercase URL slug (letters, numbers and hyphens). Bengali names need a separate URL slug.'
    );
  if (
    input.orderIndex !== undefined &&
    (!Number.isInteger(input.orderIndex) || input.orderIndex < 0 || input.orderIndex > 2147483647)
  )
    throw new Error('Order must be an integer from 0 to 2147483647.');
  const icon = input.iconName || '';
  if (icon && !/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(icon) && !/^\/(?!\/)/.test(icon)) {
    let url: URL;
    try {
      url = new URL(icon);
    } catch {
      throw new Error('Use an HTTPS icon URL, a site asset path, or a named icon.');
    }
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error(
        'Temporary data/blob URLs and insecure icon URLs cannot be saved. Use durable HTTPS storage.'
      );
  }
}
