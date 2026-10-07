import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  Network,
  Shield,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Save,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';
import type { Exam, Subject, Chapter } from '@/types';
import { getErrorMessage } from '@/lib/errors';

export const AdminExamTopics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryExamId = searchParams.get('examId');

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(queryExamId || '');
  const [mappedTopicIds, setMappedTopicIds] = useState<Set<string>>(new Set());
  const [initialMappedIds, setInitialMappedIds] = useState<Set<string>>(new Set());

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [allExams, allSubjects, allChapters] = await Promise.all([
          api.getAllAdminExams(),
          api.getAllAdminSubjects(),
          api.getAllAdminChapters(),
        ]);
        setExams(allExams);
        setSubjects(allSubjects);
        setChapters(allChapters);
        if (allExams.length > 0) {
          const targetExam =
            queryExamId && allExams.some((e) => e.id === queryExamId)
              ? queryExamId
              : allExams[0].id;
          setSelectedExamId(targetExam);
        }
      } catch (err) {
        setErrorMessage(getErrorMessage(err, 'Failed to load initial data'));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [queryExamId]);

  // Sync selected exam if URL query parameter changes
  useEffect(() => {
    if (queryExamId && exams.some((e) => e.id === queryExamId) && queryExamId !== selectedExamId) {
      setSelectedExamId(queryExamId);
    }
  }, [queryExamId, exams, selectedExamId]);

  // Load mappings when selected exam changes
  const loadMappingsForExam = useCallback(async (examId: string) => {
    if (!examId) return;
    try {
      setErrorMessage('');
      const mappings = await api.getExamTopicMappings(examId);
      const set = new Set(mappings);
      setMappedTopicIds(set);
      setInitialMappedIds(new Set(mappings));
    } catch (err) {
      console.error('Error loading topic mappings:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadMappingsForExam(selectedExamId);
    }
  }, [selectedExamId, loadMappingsForExam]);

  // Toggle single topic
  const toggleTopic = (topicId: string) => {
    setMappedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
    setSaveSuccess(false);
  };

  // Select all topics under a subject
  const selectAllSubjectTopics = (subjectId: string) => {
    const subTopics = chapters.filter((c) => c.subjectId === subjectId);
    setMappedTopicIds((prev) => {
      const next = new Set(prev);
      subTopics.forEach((t) => next.add(t.id));
      return next;
    });
    setSaveSuccess(false);
  };

  // Deselect all topics under a subject
  const deselectAllSubjectTopics = (subjectId: string) => {
    const subTopics = chapters.filter((c) => c.subjectId === subjectId);
    setMappedTopicIds((prev) => {
      const next = new Set(prev);
      subTopics.forEach((t) => next.delete(t.id));
      return next;
    });
    setSaveSuccess(false);
  };

  // Save mappings
  const handleSave = async () => {
    if (!selectedExamId) return;
    try {
      setIsSaving(true);
      setErrorMessage('');
      const success = await api.saveExamTopicMappings(selectedExamId, Array.from(mappedTopicIds));
      if (success) {
        setInitialMappedIds(new Set(mappedTopicIds));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage('Failed to save exam topic mappings to database.');
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to save mappings'));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const isDirty =
    mappedTopicIds.size !== initialMappedIds.size ||
    Array.from(mappedTopicIds).some((id) => !initialMappedIds.has(id));

  // Filter topics and subjects by search term
  const filteredSubjects = subjects
    .map((sub) => {
      const subTopics = chapters.filter((c) => c.subjectId === sub.id);
      const matches = subTopics.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return {
        subject: sub,
        topics: matches,
      };
    })
    .filter((group) => group.topics.length > 0 || searchTerm === '');

  return withAdminSkeleton(
    isLoading,
    <div className="space-y-6">
      {/* Sub-Navigation Tabs: Manage Exams & Syllabus Mapping */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <Link
          to="/admin/exams"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
        >
          <Shield className="w-3.5 h-3.5" />
          Exams Directory ({exams.length})
        </Link>
        <Link
          to="/admin/tests?tab=topic"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Manage Topic Tests
        </Link>
        <Link
          to="/admin/exam-topics"
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
        >
          <Network className="w-3.5 h-3.5" />
          Custom Topic Scope (Optional)
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Exam <span className="text-indigo-600 dark:text-indigo-400">↔</span> Topic Scope
              (Optional)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Topic Tests are active by default for all exams. Use this optional screen only if you
            want to customize or restrict which topics appear for an exam.
          </p>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              Saved successfully!
            </span>
          )}
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!isDirty || isSaving}
            className="gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
          >
            <Save className="w-4 h-4 text-white" />
            <span className="text-white">Save Exam Mappings</span>
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Control Bar: Exam Selector & Search */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exam Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5">
              Select Target Examination
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={selectedExamId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedExamId(newId);
                  setSearchParams({ examId: newId });
                }}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5">
              Filter Topics by Keyword
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject or topic name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Active Exam:{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {selectedExam?.title || 'None'}
            </strong>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/20 text-[11px]">
              {mappedTopicIds.size} of {chapters.length} Topics Mapped
            </span>
            {isDirty && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                • Unsaved Changes
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Subjects & Topics Matrix */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-36 bg-slate-100 dark:bg-slate-800/40 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-300">No topics found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try changing your search keyword.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubjects.map(({ subject, topics }) => {
            const checkedCount = topics.filter((t) => mappedTopicIds.has(t.id)).length;

            return (
              <Card
                key={subject.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden"
              >
                {/* Subject Header with Bulk Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                      {subject.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {subject.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {checkedCount} / {topics.length} topics mapped to {selectedExam?.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectAllSubjectTopics(subject.id)}
                      className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1 transition-colors"
                    >
                      <CheckSquare className="w-3 h-3" />
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => deselectAllSubjectTopics(subject.id)}
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center gap-1 transition-colors"
                    >
                      <Square className="w-3 h-3" />
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-4">
                  {topics.map((topic) => {
                    const isChecked = mappedTopicIds.has(topic.id);

                    return (
                      <div
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-950 dark:text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container click
                          className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight truncate">{topic.name}</p>
                          {topic.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {topic.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>,
    { label: 'Loading exam topics…', variant: 'table' }
  );
};
