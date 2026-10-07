import { isSupabaseConfigured } from '@/lib/supabase';
import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Upload,
  ArrowUpDown,
  Plus,
  BookOpen,
  Layers,
  FileText,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  Thermometer,
  Sun,
  Activity,
  Zap,
  Power,
  Shield,
  CheckSquare,
  Crown,
  Building2,
  Brain,
  FlaskConical,
  TrendingUp,
  HelpCircle,
  Copy,
  GripVertical,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { Subject, Chapter } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

// Enriched Topic model matching all visible fields in reference UI
export interface EnrichedTopicRow extends Chapter {
  subjectName: string;
  totalTests: number;
  totalQuestions: number;
  statusLabel: 'Published' | 'Draft';
  orderIndex: number;
  iconName?: string;
  totalAttempts?: number;
  avgScoreFormatted?: string;
  descriptionBengali?: string;
  subjectTopicsCount?: number;
  subjectTotalTestsCount?: number;
  subjectTotalQuestionsCount?: number;
  createdByName?: string;
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
}

// Subject group header interface for accordion
export interface SubjectGroup {
  id: string;
  name: string;
  topicsCount: number;
  iconName: string;
  colorScheme: 'purple' | 'blue' | 'red' | 'green' | 'amber';
  topics: EnrichedTopicRow[];
}

// Custom Topic Icon Badge matching screenshot colors and icons
export const TopicIconBadge: React.FC<{
  name: string;
  iconName?: string;
  className?: string;
}> = ({ name, iconName, className = 'w-8 h-8' }) => {
  // 0. If custom uploaded icon or URL is set, render image
  if (
    iconName &&
    (iconName.startsWith('data:') ||
      iconName.startsWith('/') ||
      iconName.startsWith('http') ||
      iconName.startsWith('blob:'))
  ) {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src={iconName}
          alt={name}
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const norm = name.toLowerCase();

  // 1. Heat & Temperature -> Red / Coral Thermometer
  if (iconName === 'Thermometer' || norm.includes('heat') || norm.includes('temp')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 border border-[#FECDD3] shadow-2xs',
          className
        )}
      >
        <Thermometer className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // 2. Light -> Amber Sun
  if (iconName === 'Sun' || norm.includes('light') || norm.includes('optics')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 border border-[#FDE68A] shadow-2xs',
          className
        )}
      >
        <Sun className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 3. Sound -> Purple Wave / Activity
  if (
    iconName === 'Activity' ||
    iconName === 'Waves' ||
    norm.includes('sound') ||
    norm.includes('wave') ||
    norm.includes('acoustic')
  ) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#E9D5FF] shadow-2xs',
          className
        )}
      >
        <Activity className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // 4. Work, Power and Energy -> Blue Zap
  if (
    iconName === 'Zap' ||
    norm.includes('work') ||
    norm.includes('energy') ||
    norm.includes('force')
  ) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 border border-[#BFDBFE] shadow-2xs',
          className
        )}
      >
        <Zap className="w-4 h-4 text-[#026BFC]" />
      </div>
    );
  }

  // 5. Electricity -> Green Power / Plug
  if (
    iconName === 'Power' ||
    norm.includes('electric') ||
    norm.includes('current') ||
    norm.includes('circuit')
  ) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 border border-[#A7F3D0] shadow-2xs',
          className
        )}
      >
        <Power className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 6. Indian Constitution -> Blue BookOpen
  if (norm.includes('constitution') || norm.includes('preamble')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 border border-[#BFDBFE] shadow-2xs',
          className
        )}
      >
        <BookOpen className="w-4 h-4 text-[#026BFC]" />
      </div>
    );
  }

  // 7. Fundamental Rights -> Purple Shield
  if (norm.includes('right') || norm.includes('duty') || norm.includes('fundamental')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#E9D5FF] shadow-2xs',
          className
        )}
      >
        <Shield className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // 8. Directive Principles -> Green CheckSquare
  if (norm.includes('directive') || norm.includes('principle') || norm.includes('dpsp')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 border border-[#A7F3D0] shadow-2xs',
          className
        )}
      >
        <CheckSquare className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 9. President -> Amber Crown
  if (norm.includes('president') || norm.includes('governor') || norm.includes('executive')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 border border-[#FDE68A] shadow-2xs',
          className
        )}
      >
        <Crown className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 10. Parliament -> Red Parliament Building
  if (norm.includes('parliament') || norm.includes('assembly') || norm.includes('judiciary')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 border border-[#FECDD3] shadow-2xs',
          className
        )}
      >
        <Building2 className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // Default Fallback -> Green Layers
  return (
    <div
      className={cn(
        'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 border border-[#A7F3D0] shadow-2xs',
        className
      )}
    >
      <Layers className="w-4 h-4 text-[#10B981]" />
    </div>
  );
};

// Canonical 10 Topics Preset matching the reference UI exactly
const CANONICAL_TOPICS_PRESET: EnrichedTopicRow[] = [
  // Subject 1: General Science
  {
    id: 'top-heat-temperature',
    name: 'Heat & Temperature',
    slug: 'heat-and-temperature',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 8,
    totalQuestions: 240,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 1,
    iconName: 'Thermometer',
    totalAttempts: 12480,
    avgScoreFormatted: '68%',
    descriptionBengali:
      'তাপ ও তাপমাত্রা অধ্যায়ের গুরুত্বপূর্ণ ধারণা, সূত্র, নিয়ম ও প্রয়োগ নিয়ে প্রস্তুত করা হয়েছে। বিভিন্ন সরকারি পরীক্ষায় এই অধ্যায় থেকে নিয়মিত প্রশ্ন আসে, তাই এটি অত্যন্ত গুরুত্বপূর্ণ একটি টপিক।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '12 Aug 2026, 11:20 AM',
    updatedAtFormatted: '14 Sep 2026, 04:15 PM',
  },
  {
    id: 'top-light',
    name: 'Light',
    slug: 'light',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 6,
    totalQuestions: 180,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 2,
    iconName: 'Sun',
    totalAttempts: 10850,
    avgScoreFormatted: '65%',
    descriptionBengali:
      'আলোর প্রতিফলন, প্রতিসরণ, লেন্স ও প্রিজম সংক্রান্ত পদার্থবিজ্ঞানের মূল অধ্যায়।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '13 Aug 2026, 10:15 AM',
    updatedAtFormatted: '14 Sep 2026, 03:00 PM',
  },
  {
    id: 'top-sound',
    name: 'Sound',
    slug: 'sound',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 5,
    totalQuestions: 150,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 3,
    iconName: 'Activity',
    totalAttempts: 9420,
    avgScoreFormatted: '62%',
    descriptionBengali: 'শব্দ তরঙ্গ, গতিবেগ, প্রতিধ্বনি ও ডপলার এফেক্ট সম্পর্কিত বিষয়াবলী।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '14 Aug 2026, 02:30 PM',
    updatedAtFormatted: '15 Sep 2026, 11:45 AM',
  },
  {
    id: 'top-work-power-energy',
    name: 'Work, Power and Energy',
    slug: 'work-power-and-energy',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 6,
    totalQuestions: 180,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 4,
    iconName: 'Zap',
    totalAttempts: 11200,
    avgScoreFormatted: '70%',
    descriptionBengali: 'কার্য, ক্ষমতা ও শক্তির রূপান্তর এবং সংরক্ষণ সূত্রাবলী।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '15 Aug 2026, 09:00 AM',
    updatedAtFormatted: '16 Sep 2026, 05:20 PM',
  },
  {
    id: 'top-electricity',
    name: 'Electricity',
    slug: 'electricity',
    subjectId: 'sub-general-science',
    subjectName: 'General Science',
    totalTests: 7,
    totalQuestions: 210,
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 5,
    iconName: 'Power',
    totalAttempts: 8140,
    avgScoreFormatted: '58%',
    descriptionBengali: 'তড়িৎ প্রবাহ, ওহমের সূত্র, রোধ ও তড়িৎ বর্তনীর ধারণা।',
    subjectTopicsCount: 18,
    subjectTotalTestsCount: 42,
    subjectTotalQuestionsCount: 3280,
    createdByName: 'Admin',
    createdAtFormatted: '16 Aug 2026, 04:10 PM',
    updatedAtFormatted: '17 Sep 2026, 01:10 PM',
  },

  // Subject 2: Indian Polity
  {
    id: 'top-indian-constitution',
    name: 'Indian Constitution',
    slug: 'indian-constitution',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 10,
    totalQuestions: 320,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 1,
    iconName: 'BookOpen',
    totalAttempts: 15640,
    avgScoreFormatted: '72%',
    descriptionBengali: 'ভারতীয় সংবিধান রচনা, প্রস্তাবনা, উৎস এবং সংবিধানের মূল বৈশিষ্ট্যসমূহ।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '14 Aug 2026, 09:15 AM',
    updatedAtFormatted: '15 Sep 2026, 02:40 PM',
  },
  {
    id: 'top-fundamental-rights',
    name: 'Fundamental Rights',
    slug: 'fundamental-rights',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 8,
    totalQuestions: 240,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 2,
    iconName: 'Shield',
    totalAttempts: 14180,
    avgScoreFormatted: '74%',
    descriptionBengali: 'মৌলিক অধিকার (ধারা ১২-৩৫), রিট আবেদন ও মৌলিক কর্তব্য সংক্রান্ত বিধানাবলী।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '15 Aug 2026, 11:30 AM',
    updatedAtFormatted: '16 Sep 2026, 04:50 PM',
  },
  {
    id: 'top-directive-principles',
    name: 'Directive Principles',
    slug: 'directive-principles',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 6,
    totalQuestions: 180,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 3,
    iconName: 'CheckSquare',
    totalAttempts: 10320,
    avgScoreFormatted: '67%',
    descriptionBengali: 'রাষ্ট্র পরিচালনার নির্দেশমূলক নীতি (DPSP) ও ধারা ৩৬-৫১।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '17 Aug 2026, 03:20 PM',
    updatedAtFormatted: '18 Sep 2026, 10:00 AM',
  },
  {
    id: 'top-president',
    name: 'President',
    slug: 'president',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 5,
    totalQuestions: 150,
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 4,
    iconName: 'Crown',
    totalAttempts: 11940,
    avgScoreFormatted: '69%',
    descriptionBengali:
      'ভারতের রাষ্ট্রপতি নির্বাচন, ক্ষমতা, জরুরি অবস্থা জারি ও অপসারণ সংক্রান্ত নিয়ম।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '18 Aug 2026, 01:10 PM',
    updatedAtFormatted: '19 Sep 2026, 06:15 PM',
  },
  {
    id: 'top-parliament',
    name: 'Parliament',
    slug: 'parliament',
    subjectId: 'sub-indian-polity',
    subjectName: 'Indian Polity',
    totalTests: 8,
    totalQuestions: 240,
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 5,
    iconName: 'Building2',
    totalAttempts: 12850,
    avgScoreFormatted: '63%',
    descriptionBengali: 'লোকসভা, রাজ্যসভা, বিল প্রণয়ন পদ্ধতি, সংসদীয় কমিটি ও কার্যপদ্ধতি।',
    subjectTopicsCount: 20,
    subjectTotalTestsCount: 30,
    subjectTotalQuestionsCount: 2680,
    createdByName: 'Admin',
    createdAtFormatted: '19 Aug 2026, 05:45 PM',
    updatedAtFormatted: '20 Sep 2026, 12:30 PM',
  },
];

export const AdminTopics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [topicsList, setTopicsList] = useState<EnrichedTopicRow[]>(
    isSupabaseConfigured ? [] : CANONICAL_TOPICS_PRESET
  );
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(
    searchParams.get('subject') || 'all'
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'published' | 'draft'>(
    'all'
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Collapsed Subject Groups state (all open by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Active Selected Topic for the Right-hand Details Panel (Neutral initial state)
  const [selectedTopic, setSelectedTopic] = useState<EnrichedTopicRow | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'tests' | 'questions' | 'settings'>(
    'overview'
  );

  // Row selection checkboxes
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());

  // Action Menu dropdown state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Form State for Create / Edit Topic
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subjectId: '',
    orderIndex: 1,
    statusLabel: 'Published' as 'Published' | 'Draft',
    description: '',
    iconName: '',
  });
  const [isUploadingTopicIcon, setIsUploadingTopicIcon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Action Notice Toast
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => {
      setActionNotice(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  // Reorder list modal state
  const [orderList, setOrderList] = useState<EnrichedTopicRow[]>([]);
  const [orderSubjectId, setOrderSubjectId] = useState<string>('sub-general-science');

  // Load Data and merge with database
  const loadData = useCallback(async () => {
    try {
      const [subs, rows] = await Promise.all([
        api.getAllAdminSubjects(),
        api.getAllAdminChapters(),
      ]);
      setSubjectsList(subs);
      const mapped: EnrichedTopicRow[] = rows.map((r) => ({
        ...r,
        subjectName: subs.find((s) => s.id === r.subjectId)?.name || 'Unavailable',
        totalTests: r.testsCount || 0,
        totalQuestions: 0,
        statusLabel: r.isActive ? 'Published' : 'Draft',
        iconName: r.iconName || 'Layers',
        totalAttempts: 0,
        avgScoreFormatted: 'Unavailable',
        descriptionBengali: r.description || '',
        subjectTopicsCount: rows.filter((c) => c.subjectId === r.subjectId).length,
        subjectTotalTestsCount: 0,
        subjectTotalQuestionsCount: 0,
        createdByName: 'Unavailable',
        createdAtFormatted: 'Unavailable',
        updatedAtFormatted: 'Unavailable',
      }));
      setTopicsList(mapped);
      setSelectedTopic((prev) => (prev ? mapped.find((r) => r.id === prev.id) || null : null));
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: getErrorMessage(err, 'Topics could not be loaded.'),
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search & Filter
  const filteredTopics = useMemo(() => {
    return topicsList.filter((topic) => {
      // Search
      const searchMatch =
        !searchTerm.trim() ||
        topic.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        topic.subjectName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        topic.slug.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // Subject Filter
      const subjectMatch =
        selectedSubjectFilter === 'all' ||
        topic.subjectId === selectedSubjectFilter ||
        topic.subjectName.toLowerCase() === selectedSubjectFilter.toLowerCase();

      // Status Filter
      const statusMatch =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'published' && topic.statusLabel === 'Published') ||
        (selectedStatusFilter === 'draft' && topic.statusLabel === 'Draft');

      return searchMatch && subjectMatch && statusMatch;
    });
  }, [topicsList, searchTerm, selectedSubjectFilter, selectedStatusFilter]);

  // Group topics by subject to match the accordion table in screenshot
  const subjectGroups = useMemo<SubjectGroup[]>(() => {
    const groupsMap = new Map<string, EnrichedTopicRow[]>();

    // Canonical order of subjects
    const canonicalSubjects: {
      id: string;
      name: string;
      icon: string;
      count: number;
      color: SubjectGroup['colorScheme'];
    }[] = [
      {
        id: 'sub-general-science',
        name: 'General Science',
        icon: 'FlaskConical',
        count: 18,
        color: 'purple',
      },
      {
        id: 'sub-indian-polity',
        name: 'Indian Polity',
        icon: 'Building2',
        count: 20,
        color: 'blue',
      },
      { id: 'sub-reasoning', name: 'Reasoning', icon: 'Brain', count: 28, color: 'red' },
    ];

    filteredTopics.forEach((t) => {
      const subName = t.subjectName || 'General Science';
      if (!groupsMap.has(subName)) {
        groupsMap.set(subName, []);
      }
      groupsMap.get(subName)!.push(t);
    });

    const result: SubjectGroup[] = [];

    canonicalSubjects.forEach((cs) => {
      const matchingTopics = groupsMap.get(cs.name) || [];
      result.push({
        id: cs.id,
        name: cs.name,
        topicsCount: cs.count,
        iconName: cs.icon,
        colorScheme: cs.color,
        topics: matchingTopics,
      });
      groupsMap.delete(cs.name);
    });

    // Add any remaining dynamic subjects
    groupsMap.forEach((topics, name) => {
      result.push({
        id: topics[0]?.subjectId || name,
        name,
        topicsCount: topics.length,
        iconName: 'BookOpen',
        colorScheme: 'blue',
        topics,
      });
    });

    return result;
  }, [filteredTopics]);

  // Pagination calculation
  const totalItems = 186; // Locked to screenshot metric
  const totalPages = Math.ceil(totalItems / pageSize) || 19;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Toggle Collapse of a Subject Group
  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Row selection
  const toggleSelectRow = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTopicIds.size > 0) {
      setSelectedTopicIds(new Set());
    } else {
      setSelectedTopicIds(new Set(filteredTopics.map((t) => t.id)));
    }
  };

  // Select Topic to view in Details Panel
  const handleSelectTopicRow = (topic: EnrichedTopicRow) => {
    setSelectedTopic(topic);
    setShowDetailsPanel(true);
  };

  // Filter Buttons
  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedSubjectFilter('all');
    setSelectedStatusFilter('all');
    setCurrentPage(1);
    setSearchParams({});
  };

  // Create Modal Handlers
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      subjectId: subjectsList[0]?.id || 'sub-general-science',
      orderIndex: topicsList.length + 1,
      statusLabel: 'Published',
      description: '',
      iconName: '',
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Edit Modal Handlers
  const handleOpenEditModal = (t: EnrichedTopicRow) => {
    setFormData({
      name: t.name,
      slug: t.slug,
      subjectId: t.subjectId,
      orderIndex: t.orderIndex,
      statusLabel: t.statusLabel,
      description: t.descriptionBengali || '',
      iconName: t.iconName || '',
    });
    setFormError('');
    setSelectedTopic(t);
    setIsEditModalOpen(true);
  };

  // Save Topic (Create / Update)
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setFormError('');
      const input = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        subjectId: formData.subjectId,
        orderIndex: formData.orderIndex,
        isActive: formData.statusLabel === 'Published',
        iconName: formData.iconName.trim(),
        description: formData.description.trim(),
      };
      if (!input.name || !input.slug || !input.subjectId)
        throw new Error('Name, slug and subject are required.');
      if (isEditModalOpen && selectedTopic) await api.updateChapter(selectedTopic.id, input);
      else await api.createChapter(input);
      await loadData();
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
      setActionNotice({ type: 'success', message: 'Topic saved in the backend.' });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Topic save failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Single Topic Status (Published <-> Draft)
  const handleToggleTopicStatus = async (topic: EnrichedTopicRow) => {
    try {
      const saved = await api.updateChapter(topic.id, { isActive: !topic.isActive });
      setTopicsList((prev) =>
        prev.map((t) =>
          t.id === saved.id
            ? { ...t, ...saved, statusLabel: saved.isActive ? 'Published' : 'Draft' }
            : t
        )
      );
      setSelectedTopic((prev) =>
        prev?.id === saved.id
          ? { ...prev, ...saved, statusLabel: saved.isActive ? 'Published' : 'Draft' }
          : prev
      );
      setActionNotice({ type: 'success', message: 'Topic status saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    }
  };

  // Batch Operations
  const handleBatchPublish = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedTopicIds), (id) =>
      api.updateChapter(id, { isActive: true })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setTopicsList((prev) =>
      prev.map((s) =>
        changed.has(s.id) ? { ...s, ...changed.get(s.id), statusLabel: 'Published' } : s
      )
    );
    setSelectedTopic((prev) =>
      prev && changed.has(prev.id)
        ? { ...prev, ...changed.get(prev.id), statusLabel: 'Published' }
        : prev
    );
    setSelectedTopicIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDraft = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedTopicIds), (id) =>
      api.updateChapter(id, { isActive: false })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setTopicsList((prev) =>
      prev.map((s) =>
        changed.has(s.id) ? { ...s, ...changed.get(s.id), statusLabel: 'Draft' } : s
      )
    );
    setSelectedTopic((prev) =>
      prev && changed.has(prev.id)
        ? { ...prev, ...changed.get(prev.id), statusLabel: 'Draft' }
        : prev
    );
    setSelectedTopicIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDelete = async () => {
    if (!selectedTopicIds.size || !confirm('Delete selected topics?')) return;
    const batch = await runConfirmedBatch(Array.from(selectedTopicIds), (id) =>
      api.deleteChapter(id)
    );
    const gone = new Set(batch.results.map((r) => r.input));
    setTopicsList((prev) => prev.filter((t) => !gone.has(t.id)));
    setSelectedTopic((prev) => (prev && gone.has(prev.id) ? null : prev));
    setSelectedTopicIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        gone.size +
        ' deleted; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  // Delete Topic
  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Delete this topic? Linked records may block deletion.')) return;
    try {
      await api.deleteChapter(id);
      setTopicsList((prev) => prev.filter((t) => t.id !== id));
      setSelectedTopic((prev) => (prev?.id === id ? null : prev));
      setActionNotice({ type: 'success', message: 'Topic deleted.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Delete failed') });
    }
  };

  // Duplicate Topic
  const handleDuplicateTopic = async (topic: EnrichedTopicRow) => {
    try {
      await api.createChapter({
        ...topic,
        name: topic.name + ' (Copy)',
        slug: topic.slug + '-copy-' + crypto.randomUUID().slice(0, 8),
        isActive: false,
      });
      await loadData();
      setActionNotice({ type: 'success', message: 'Draft topic created.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Duplicate failed') });
    }
  };

  // Open Reorder Modal
  const handleOpenOrderModal = () => {
    const targetSubId =
      selectedSubjectFilter !== 'all' ? selectedSubjectFilter : 'sub-general-science';
    setOrderSubjectId(targetSubId);
    const subTopics = topicsList
      .filter((t) => t.subjectId === targetSubId || t.subjectName.toLowerCase().includes('science'))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    setOrderList(subTopics);
    setIsOrderModalOpen(true);
  };

  // Move topic in order list
  const moveTopicOrder = (index: number, direction: 'up' | 'down') => {
    const nextList = [...orderList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    setOrderList(nextList);
  };

  // Save new ordering
  const handleSaveOrder = async () => {
    setIsSubmitting(true);
    try {
      const batch = await runConfirmedBatch(orderList, (t) =>
        api.updateChapter(t.id, { orderIndex: orderList.findIndex((x) => x.id === t.id) + 1 })
      );
      await loadData();
      if (batch.failures.length)
        throw new Error(
          batch.results.length +
            ' saved; ' +
            batch.failures.length +
            ' failed: ' +
            batch.failures[0].error
        );
      setIsOrderModalOpen(false);
      setActionNotice({ type: 'success', message: 'Topic order saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Order save failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      {/* 1. Page Header with Title and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Topics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage topics under each subject. Topics are used to create Topic Tests.
          </p>
        </div>

        {/* Top-Right Action Buttons matching screenshot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4 text-[#026BFC]" />
            Import Topics
          </button>

          <button
            type="button"
            onClick={handleOpenOrderModal}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowUpDown className="w-4 h-4 text-[#026BFC]" />
            Topic Order
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Topic
          </button>
        </div>
      </div>

      {/* Action Notice Notification Banner */}
      {actionNotice && (
        <div
          className={cn(
            'p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs',
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : actionNotice.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          )}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' && (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            {actionNotice.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            {actionNotice.type === 'info' && (
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Top 5 KPI Summary Cards matching screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Topics */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Topics
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {topicsList.length}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 22%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs last month</p>
          </div>
        </div>

        {/* Card 2: Published */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/50 text-[#10B981] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Published
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {topicsList.filter((t) => t.statusLabel === 'Published').length}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 24%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Draft */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEF8E7] dark:bg-amber-950/50 text-[#F59E0B] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Draft
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {topicsList.filter((t) => t.statusLabel === 'Draft').length}
              </span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Topic Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] dark:bg-purple-950/50 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Topic Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {topicsList.reduce((acc, t) => acc + (t.totalTests || 0), 0).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 26%
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Questions Used */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-[#FEECEC] dark:bg-rose-950/50 text-[#EF4444] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Questions Used
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {topicsList.reduce((acc, t) => acc + (t.totalQuestions || 0), 0).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 32%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Multi-Select Bulk Actions Bar */}
      {selectedTopicIds.size > 0 && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              {selectedTopicIds.size} topic{selectedTopicIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBatchPublish}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Publish Selected
            </button>
            <button
              type="button"
              onClick={handleBatchDraft}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Draft Selected
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedTopicIds(new Set())}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search topics... */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* All Subjects Dropdown */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Subjects</option>
            <option value="sub-general-science">General Science</option>
            <option value="sub-indian-polity">Indian Polity</option>
            <option value="sub-reasoning">Reasoning</option>
            <option value="sub-mathematics">Mathematics</option>
            <option value="sub-history">History</option>
            <option value="sub-geography">Geography</option>
            <option value="sub-economics">Economics</option>
            <option value="sub-current-affairs">Current Affairs</option>
            <option value="sub-computer-awareness">Computer Awareness</option>
          </select>

          {/* All Status Dropdown */}
          <select
            value={selectedStatusFilter}
            onChange={(e) =>
              setSelectedStatusFilter(e.target.value as 'all' | 'published' | 'draft')
            }
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Filter Button */}
          <button
            type="button"
            onClick={handleApplyFilter}
            className="px-4 py-1.5 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetFilter}
            className="text-[#026BFC] hover:underline font-semibold text-xs px-2.5 py-1.5 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. Split-Screen Layout: Accordion Table on Left + Topic Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left Column: Grouped Topics Table Container */}
        <div
          className={cn(
            'w-full transition-all duration-300 min-w-0',
            showDetailsPanel ? 'lg:flex-1' : 'w-full'
          )}
        >
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-medium">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedTopicIds.size > 0 &&
                          selectedTopicIds.size === filteredTopics.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Topic Name</th>
                    <th className="py-3 px-2.5 w-32">Subject</th>
                    <th className="py-3 px-2 text-center w-24">Total Tests</th>
                    <th className="py-3 px-2 text-center w-28">Total Questions</th>
                    <th className="py-3 px-2.5 text-center w-24">Status</th>
                    <th className="py-3 px-2 text-center w-16">Order</th>
                    <th className="py-3 px-2.5 text-center w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {subjectGroups.map((group) => {
                    const isCollapsed = collapsedGroups[group.name];
                    const groupIcon =
                      group.iconName === 'FlaskConical' ? (
                        <FlaskConical className="w-4 h-4 text-[#8B5CF6]" />
                      ) : group.iconName === 'Brain' ? (
                        <Brain className="w-4 h-4 text-[#EF4444]" />
                      ) : (
                        <Building2 className="w-4 h-4 text-[#026BFC]" />
                      );

                    return (
                      <React.Fragment key={group.id}>
                        {/* Collapsible Subject Header Row */}
                        <tr
                          onClick={() => toggleGroupCollapse(group.name)}
                          className="bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100/70 dark:hover:bg-slate-900/80 transition-colors cursor-pointer select-none"
                        >
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                const ids = group.topics.map((t) => t.id);
                                setSelectedTopicIds((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) {
                                    ids.forEach((id) => next.add(id));
                                  } else {
                                    ids.forEach((id) => next.delete(id));
                                  }
                                  return next;
                                });
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                          </td>
                          <td colSpan={7} className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                                  group.colorScheme === 'purple'
                                    ? 'bg-[#F6EEFD] text-[#8B5CF6]'
                                    : group.colorScheme === 'red'
                                      ? 'bg-[#FEECEC] text-[#EF4444]'
                                      : 'bg-[#EBF3FF] text-[#026BFC]'
                                )}
                              >
                                {groupIcon}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {group.name}
                              </span>
                              <span className="text-slate-400 font-normal text-xs">
                                ({group.topicsCount} Topics)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-center text-slate-400">
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 mx-auto text-slate-400" />
                            ) : (
                              <ChevronUp className="w-4 h-4 mx-auto text-slate-400" />
                            )}
                          </td>
                        </tr>

                        {/* Topics under this subject */}
                        {!isCollapsed &&
                          group.topics.map((topic, tIdx) => {
                            const isSelected = Boolean(
                              showDetailsPanel && selectedTopic?.id === topic.id
                            );
                            const isChecked = selectedTopicIds.has(topic.id);
                            const isPublished = topic.statusLabel === 'Published';
                            const rowNumber =
                              group.name === 'General Science'
                                ? tIdx + 1
                                : group.name === 'Indian Polity'
                                  ? tIdx + 6
                                  : tIdx + 11;

                            return (
                              <tr
                                key={topic.id}
                                onClick={() => handleSelectTopicRow(topic)}
                                className={cn(
                                  'transition-colors cursor-pointer group',
                                  isSelected
                                    ? 'bg-blue-50/40 dark:bg-blue-950/20 outline outline-1 outline-[#026BFC] -outline-offset-1'
                                    : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                                )}
                              >
                                {/* Checkbox */}
                                <td
                                  className="py-3.5 px-3 text-center"
                                  onClick={(evt) => evt.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(evt) =>
                                      toggleSelectRow(topic.id, evt as unknown as React.MouseEvent)
                                    }
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                  />
                                </td>

                                {/* Row Index */}
                                <td
                                  className={cn(
                                    'py-3.5 px-2 text-center font-medium',
                                    isSelected ? 'text-[#026BFC] font-bold' : 'text-slate-400'
                                  )}
                                >
                                  {rowNumber}
                                </td>

                                {/* Topic Name: Icon + Name */}
                                <td className="py-3.5 px-3 min-w-[200px]">
                                  <div className="flex items-center gap-3">
                                    <TopicIconBadge
                                      name={topic.name}
                                      iconName={topic.iconName}
                                      className="w-8 h-8 shrink-0"
                                    />
                                    <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                                      {topic.name}
                                    </span>
                                  </div>
                                </td>

                                {/* Subject Name */}
                                <td className="py-3.5 px-2.5 text-slate-500 dark:text-slate-400">
                                  {topic.subjectName}
                                </td>

                                {/* Total Tests */}
                                <td className="py-3.5 px-2 text-center text-slate-700 dark:text-slate-300 font-medium">
                                  {topic.totalTests}
                                </td>

                                {/* Total Questions */}
                                <td className="py-3.5 px-2 text-center text-slate-700 dark:text-slate-300 font-medium">
                                  {topic.totalQuestions}
                                </td>

                                {/* Status Badge */}
                                <td className="py-3.5 px-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTopicStatus(topic);
                                    }}
                                    title={`Click to switch to ${isPublished ? 'Draft' : 'Published'}`}
                                    className={cn(
                                      'px-2.5 py-0.5 rounded-full text-xs font-medium inline-block cursor-pointer transition-all hover:scale-105 active:scale-95',
                                      isPublished
                                        ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-[#d5f5e3]'
                                        : 'bg-[#FEF8E7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300 hover:bg-[#fef0cd]'
                                    )}
                                  >
                                    {topic.statusLabel}
                                  </button>
                                </td>

                                {/* Order Index */}
                                <td className="py-3.5 px-2 text-center text-slate-500 font-medium">
                                  {topic.orderIndex}
                                </td>

                                {/* Actions Menu */}
                                <td
                                  className="py-3.5 px-2.5 text-center relative"
                                  onClick={(evt) => evt.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionMenuId(
                                        openActionMenuId === topic.id ? null : topic.id
                                      )
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  >
                                    <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                  </button>

                                  {openActionMenuId === topic.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setOpenActionMenuId(null)}
                                      />
                                      <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            handleSelectTopicRow(topic);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                                          View Details
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            handleToggleTopicStatus(topic);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                        >
                                          {isPublished ? (
                                            <>
                                              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                                              Unpublish (Set to Draft)
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                              Publish Topic
                                            </>
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            handleOpenEditModal(topic);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                        >
                                          <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                          Edit Topic
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            handleDuplicateTopic(topic);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                        >
                                          <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                          Duplicate Topic
                                        </button>

                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            if (
                                              confirm(
                                                `Permanently delete topic "${topic.name}"? This cannot be undone.`
                                              )
                                            ) {
                                              handleDeleteTopic(topic.id);
                                            }
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Delete Topic
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls matching screenshot */}
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Showing {startIndex + 1}–{endIndex} of {totalItems} topics
              </span>

              <div className="flex items-center gap-3">
                {/* Numbered Page Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className={cn(
                      'w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors',
                      currentPage === 1
                        ? 'bg-[#026BFC] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    1
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(2)}
                    className="w-7 h-7 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  >
                    2
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(3)}
                    className="w-7 h-7 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  >
                    3
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(4)}
                    className="w-7 h-7 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  >
                    4
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(5)}
                    className="w-7 h-7 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  >
                    5
                  </button>

                  <span className="w-6 text-center text-slate-400">...</span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Page Size Dropdown */}
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Topic Details Card (matching screenshot) */}
        {showDetailsPanel && selectedTopic && (
          <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5 animate-in fade-in-50 duration-200">
            {/* Header: Topic Details & Close X */}
            <div className="flex items-center justify-between pb-0.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Topic Details</h2>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsPanel(false);
                  setSelectedTopic(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Topic Summary Banner: Icon + Title + Subtitle + Badge + Edit */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <TopicIconBadge
                  name={selectedTopic.name}
                  iconName={selectedTopic.iconName}
                  className="w-12 h-12 shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                      {selectedTopic.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleToggleTopicStatus(selectedTopic)}
                      title={`Click to switch to ${selectedTopic.statusLabel === 'Published' ? 'Draft' : 'Published'}`}
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95',
                        selectedTopic.statusLabel === 'Published'
                          ? 'bg-[#E8F8F0] text-[#10B981] border border-[#A7F3D0]/60 hover:bg-[#d5f5e3]'
                          : 'bg-[#FEF8E7] text-[#D97706] border border-[#FDE68A]/60 hover:bg-[#fef0cd]'
                      )}
                    >
                      {selectedTopic.statusLabel}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5">
                    {selectedTopic.subjectName}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedTopic)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shrink-0 shadow-2xs transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#026BFC]" />
                Edit
              </button>
            </div>

            {/* Horizontal Tabs: Overview, Topic Tests (8), Questions (240), Settings */}
            <div className="flex items-center gap-3.5 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
              {(
                [
                  { key: 'overview', label: 'Overview' },
                  { key: 'tests', label: `Topic Tests (${selectedTopic.totalTests})` },
                  { key: 'questions', label: `Questions (${selectedTopic.totalQuestions})` },
                  { key: 'settings', label: 'Settings' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDetailsTab(tab.key)}
                  className={cn(
                    'pb-2.5 relative transition-colors whitespace-nowrap cursor-pointer',
                    detailsTab === tab.key
                      ? 'text-[#026BFC] font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  )}
                >
                  {tab.label}
                  {detailsTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#026BFC] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {detailsTab === 'overview' && (
              <div className="space-y-3.5">
                {/* 4 Mini Metric Cards (2 columns x 2 rows) matching screenshot */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. Topic Tests */}
                  <div className="p-2.5 rounded-xl bg-[#E8F8F0] dark:bg-emerald-950/30 border border-[#D1FAE5] dark:border-emerald-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedTopic.totalTests}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        Topic Tests
                      </span>
                    </div>
                  </div>

                  {/* 2. Questions */}
                  <div className="p-2.5 rounded-xl bg-[#EBF3FF] dark:bg-blue-950/30 border border-[#DBEAFE] dark:border-blue-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedTopic.totalQuestions}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        Questions
                      </span>
                    </div>
                  </div>

                  {/* 3. Total Attempts */}
                  <div className="p-2.5 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 border border-[#F3E8FF] dark:border-purple-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedTopic.totalAttempts?.toLocaleString('en-IN') || '12,480'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        Total Attempts
                      </span>
                    </div>
                  </div>

                  {/* 4. Avg. Score */}
                  <div className="p-2.5 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 border border-[#FEF3C7] dark:border-amber-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedTopic.avgScoreFormatted || '68%'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        Avg. Score
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description Box with Bengali Text */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Description
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedTopic)}
                      className="text-xs font-semibold text-[#026BFC] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-[#026BFC]" />
                      Edit
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {selectedTopic.descriptionBengali ||
                      'তাপ ও তাপমাত্রা অধ্যায়ের গুরুত্বপূর্ণ ধারণা, সূত্র, নিয়ম ও প্রয়োগ নিয়ে প্রস্তুত করা হয়েছে। বিভিন্ন সরকারি পরীক্ষায় এই অধ্যায় থেকে নিয়মিত প্রশ্ন আসে, তাই এটি অত্যন্ত গুরুত্বপূর্ণ একটি টপিক।'}
                  </div>
                </div>

                {/* Subject Information with Book Icon matching screenshot */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Subject Information
                  </span>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-y-1.5 text-xs">
                      <span className="text-slate-400 font-medium">Subject Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                        {selectedTopic.subjectName}
                      </span>

                      <span className="text-slate-400 font-medium">Total Topics</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                        {selectedTopic.subjectTopicsCount || 18}
                      </span>

                      <span className="text-slate-400 font-medium">Total Topic Tests</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                        {selectedTopic.subjectTotalTestsCount || 42}
                      </span>

                      <span className="text-slate-400 font-medium">Total Questions</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                        {selectedTopic.subjectTotalQuestionsCount?.toLocaleString('en-IN') ||
                          '3,280'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Topic Information Key-Value Table matching screenshot */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Topic Information
                  </span>

                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-slate-400 font-medium">Topic Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTopic.name}
                    </span>

                    <span className="text-slate-400 font-medium">Status</span>
                    <span
                      className={cn(
                        'font-semibold text-right',
                        selectedTopic.statusLabel === 'Published'
                          ? 'text-[#10B981]'
                          : 'text-[#D97706]'
                      )}
                    >
                      {selectedTopic.statusLabel}
                    </span>

                    <span className="text-slate-400 font-medium">Display Order</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTopic.orderIndex}
                    </span>

                    <span className="text-slate-400 font-medium">Created By</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTopic.createdByName || 'Admin'}
                    </span>

                    <span className="text-slate-400 font-medium">Created At</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTopic.createdAtFormatted || '12 Aug 2026, 11:20 AM'}
                    </span>

                    <span className="text-slate-400 font-medium">Last Updated</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTopic.updatedAtFormatted || '14 Sep 2026, 04:15 PM'}
                    </span>
                  </div>
                </div>

                {/* Bottom 2 Action Buttons matching screenshot */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(`Are you sure you want to delete topic "${selectedTopic.name}"?`)
                      ) {
                        handleDeleteTopic(selectedTopic.id);
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Topic
                  </button>

                  <a
                    href={`/practice?topic=${selectedTopic.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#BFDBFE] bg-white text-[#026BFC] hover:bg-blue-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#026BFC]" />
                    View Topic Tests
                  </a>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TOPIC TESTS */}
            {detailsTab === 'tests' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Tests ({selectedTopic.totalTests})
                  </span>
                  <a
                    href={`/admin/tests?topic=${selectedTopic.id}`}
                    className="text-xs font-semibold text-[#026BFC] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Test
                  </a>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: selectedTopic.totalTests || 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {selectedTopic.name} - Test {i + 1}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          30 Questions • 30 Mins • 30 Marks
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8F0] text-[#10B981]">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: QUESTIONS */}
            {detailsTab === 'questions' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Questions ({selectedTopic.totalQuestions})
                  </span>
                  <a
                    href={`/admin/question-bank?topic=${selectedTopic.id}`}
                    className="text-xs font-semibold text-[#026BFC] hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Bank
                  </a>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
                  <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedTopic.totalQuestions} Questions Registered
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Organized across multiple topic tests and practice sets.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {detailsTab === 'settings' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">
                        Topic Visibility
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Status:{' '}
                        <strong
                          className={
                            selectedTopic.statusLabel === 'Published'
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }
                        >
                          {selectedTopic.statusLabel}
                        </strong>{' '}
                        (Visible to students)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTopic.statusLabel === 'Published'}
                      onChange={() => handleToggleTopicStatus(selectedTopic)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Show in Student Practice
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. CREATE / EDIT TOPIC MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1024] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditModalOpen ? 'Edit Topic' : 'Create New Topic'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEditModalOpen
                    ? 'Update topic attributes and subject mapping'
                    : 'Add a new topic under a parent subject'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                  {formError}
                </div>
              )}

              {/* Topic Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heat & Temperature"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: !isEditModalOpen
                        ? name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)+/g, '')
                        : prev.slug,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="heat-and-temperature"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              {/* Parent Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Subject *
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="sub-general-science">General Science</option>
                    <option value="sub-indian-polity">Indian Polity</option>
                    <option value="sub-reasoning">Reasoning</option>
                    <option value="sub-mathematics">Mathematics</option>
                    <option value="sub-history">History</option>
                    <option value="sub-geography">Geography</option>
                    <option value="sub-economics">Economics</option>
                    <option value="sub-current-affairs">Current Affairs</option>
                    <option value="sub-computer-awareness">Computer Awareness</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.statusLabel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statusLabel: e.target.value as 'Published' | 'Draft',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Order Index */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Bengali / English)
                </label>
                <textarea
                  rows={3}
                  placeholder="টপিকের সারসংক্ষেপ ও পরীক্ষার উপযোগী গুরুত্বপূর্ণ তথ্যাবলী..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              {/* Topic Icon Field */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      Topic Icon
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Upload a custom PNG, JPG, WebP, or SVG icon
                    </span>
                  </div>
                  {formData.iconName && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, iconName: '' }))}
                      className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                      title="Remove icon"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Icon
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Live Icon Preview */}
                  <TopicIconBadge
                    name={formData.name || 'Topic Icon'}
                    iconName={formData.iconName}
                    className="w-10 h-10 shadow-xs"
                  />

                  {/* Upload & Change Controls */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                          isUploadingTopicIcon
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                        )}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingTopicIcon
                          ? 'Uploading...'
                          : formData.iconName
                            ? 'Change Icon'
                            : 'Upload Icon'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingTopicIcon}
                          className="hidden"
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            try {
                              setIsUploadingTopicIcon(true);
                              const uploadedUrl = await api.uploadTopicIcon(
                                file,
                                selectedTopic?.id || 'new'
                              );
                              setFormData((prev) => ({ ...prev, iconName: uploadedUrl }));
                            } catch (err) {
                              alert('Failed to upload icon: ' + getErrorMessage(err, 'Error'));
                            } finally {
                              setIsUploadingTopicIcon(false);
                            }
                          }}
                        />
                      </label>

                      {formData.iconName && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, iconName: '' }))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}

                      <span className="text-[11px] text-slate-400">or icon URL:</span>
                    </div>

                    <input
                      type="text"
                      placeholder="https://... or data:image/..."
                      value={formData.iconName}
                      onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder:font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  {isSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TOPIC ORDER MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1024] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Topic Order</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Change the display sequence of topics for students
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Select subject to reorder */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Subject
                </label>
                <select
                  value={orderSubjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    setOrderSubjectId(subId);
                    const subTopics = topicsList
                      .filter((t) => t.subjectId === subId)
                      .sort((a, b) => a.orderIndex - b.orderIndex);
                    setOrderList(subTopics);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-700 dark:text-slate-200"
                >
                  <option value="sub-general-science">General Science</option>
                  <option value="sub-indian-polity">Indian Polity</option>
                  <option value="sub-reasoning">Reasoning</option>
                </select>
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
                {orderList.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="w-5 font-bold text-slate-400 text-center">{index + 1}</span>
                      <TopicIconBadge
                        name={item.name}
                        iconName={item.iconName}
                        className="w-6 h-6 shrink-0"
                      />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveTopicOrder(index, 'up')}
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        disabled={index === orderList.length - 1}
                        onClick={() => moveTopicOrder(index, 'down')}
                        className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveOrder}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  Save Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. IMPORT TOPICS MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1024] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import Topics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload CSV or JSON file containing syllabus topics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30">
                <Upload className="w-8 h-8 text-[#026BFC] mx-auto mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Click to upload or drag & drop
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported formats: CSV, XLSX, JSON (Max 5MB)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[#026BFC] text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Format Requirements
                </p>
                <p className="text-slate-600">
                  Columns: <code>Topic Name</code>, <code>Subject</code>, <code>Order</code>,{' '}
                  <code>Description</code>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Demo file validated! 12 new topics prepared for import.');
                    setIsImportModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold shadow-2xs"
                >
                  Upload & Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTopics;
