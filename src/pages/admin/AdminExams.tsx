import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  X,
  Layers,
  FileText,
  Copy,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Users,
  ExternalLink,
  MoreHorizontal,
  FolderKanban,
  Filter,
  TrendingUp,
  Upload,
  Camera,
  GripVertical,
} from 'lucide-react';
import { supabaseRuntime, isSupabaseConfigured } from '@/lib/supabase';
import type { Exam, MockTest, Subject, TestSeries } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { LEGACY_EXAM_CATEGORY_NAMES } from '@/services/domains/admin.examCategories';
import { getPageNumbers } from '@/utils/pagination';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';

const STORAGE_KEY_CATEGORIES = 'practicekoro_exam_categories';
const DEFAULT_EXAM_CATEGORIES = [
  'State Govt',
  'Central Govt',
  'Other',
  'WB Police (WBP / KP)',
  'WBPSC (Clerkship / WBCS)',
  'Teaching (TET / SLST)',
  'SSC & Central Govt.',
  'Railways (RRB)',
];

const EXAM_LOGO_CACHE_KEY = 'practicekoro_exam_logos';

function getExamLogoCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(EXAM_LOGO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveExamLogoCache(examId: string, logoUrl: string) {
  try {
    const cache = getExamLogoCache();
    if (logoUrl) cache[examId] = logoUrl;
    else delete cache[examId];
    localStorage.setItem(EXAM_LOGO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable
  }
}

// Exam row data model with rich display fields
interface EnrichedExamRow extends Exam {
  subtitle?: string;
  categoryLabel?: string;
  subjectsCount: number;
  testSeriesCount: number;
  totalTestsCount: number;
  enrollmentsCount: number;
  enrollmentsFormatted: string;
  statusLabel: 'Published' | 'Draft';
  shortName?: string;
  createdByName?: string;
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
  avgScoreFormatted?: string;
  completionRateFormatted?: string;
}

const EXAM_OVERRIDES_CACHE_KEY = 'practicekoro_exam_overrides';

function getExamOverridesCache(): Record<string, Partial<EnrichedExamRow>> {
  try {
    const raw = localStorage.getItem(EXAM_OVERRIDES_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveExamOverrideCache(examId: string, overrides: Partial<EnrichedExamRow>) {
  try {
    const cache = getExamOverridesCache();
    cache[examId] = { ...(cache[examId] || {}), ...overrides };
    localStorage.setItem(EXAM_OVERRIDES_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable
  }
}

// 18 canonical exam presets matching the reference screenshot exactly
const CANONICAL_EXAMS_PRESET: EnrichedExamRow[] = [
  {
    id: 'wbp-constable',
    title: 'WBP Constable',
    slug: 'wbp-constable',
    subtitle: 'West Bengal Police Constable',
    shortName: 'WBP',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 10,
    testSeriesCount: 5,
    totalTestsCount: 28,
    enrollmentsCount: 12480,
    enrollmentsFormatted: '12,480',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 1,
    iconName: 'Shield',
    createdByName: 'Admin',
    createdAtFormatted: '10 Sep 2026, 04:30 PM',
    updatedAtFormatted: '12 Sep 2026, 10:15 AM',
    avgScoreFormatted: '68%',
    completionRateFormatted: '72%',
    description:
      'WBP Constable পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি সিরিজ। এই পরীক্ষায় যুক্ত রয়েছে Full Mock, Topic Test ইত্যাদি বিভিন্ন ধরণের পরীক্ষার সিরিজ যা আপনাকে পরীক্ষার প্রস্তুতিকে শক্তিশালী করবে।',
  },
  {
    id: 'ssc-mts',
    title: 'SSC MTS',
    slug: 'ssc-mts',
    subtitle: 'Staff Selection Commission',
    shortName: 'SSC',
    category: 'Central Govt',
    categoryLabel: 'Central Govt',
    subjectsCount: 12,
    testSeriesCount: 4,
    totalTestsCount: 26,
    enrollmentsCount: 8920,
    enrollmentsFormatted: '8,920',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 2,
    iconName: 'Award',
    createdByName: 'Admin',
    createdAtFormatted: '12 Sep 2026, 11:20 AM',
    updatedAtFormatted: '15 Sep 2026, 02:40 PM',
    avgScoreFormatted: '65%',
    completionRateFormatted: '70%',
    description:
      'Staff Selection Commission Multi-Tasking Staff পরীক্ষার পূর্ণাঙ্গ মক ও টপিক টেস্ট।',
  },
  {
    id: 'railway-group-d',
    title: 'Railway Group D',
    slug: 'railway-group-d',
    subtitle: 'Indian Railways',
    shortName: 'RRB',
    category: 'Central Govt',
    categoryLabel: 'Central Govt',
    subjectsCount: 11,
    testSeriesCount: 4,
    totalTestsCount: 22,
    enrollmentsCount: 6430,
    enrollmentsFormatted: '6,430',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 3,
    iconName: 'Compass',
    createdByName: 'Admin',
    createdAtFormatted: '15 Sep 2026, 09:15 AM',
    updatedAtFormatted: '18 Sep 2026, 04:10 PM',
    avgScoreFormatted: '62%',
    completionRateFormatted: '69%',
    description:
      'Indian Railways Group D CBT পরীক্ষার জন্য সম্পূর্ণ সিলেবাস অনুযায়ী মক টেস্ট সিরিজ।',
  },
  {
    id: 'wbpsc-clerkship',
    title: 'WBPSC Clerkship',
    slug: 'wbpsc-clerkship',
    subtitle: 'West Bengal Public Service Commission',
    shortName: 'WBPSC',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 14,
    testSeriesCount: 3,
    totalTestsCount: 20,
    enrollmentsCount: 5210,
    enrollmentsFormatted: '5,210',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 4,
    iconName: 'GraduationCap',
    createdByName: 'Admin',
    createdAtFormatted: '18 Sep 2026, 03:00 PM',
    updatedAtFormatted: '20 Sep 2026, 01:25 PM',
    avgScoreFormatted: '71%',
    completionRateFormatted: '75%',
    description: 'WBPSC ক্লার্কশিপ পার্ট-১ ও পার্ট-২ পরীক্ষার জন্য বিশেষ স্পেশাল প্রস্তুতি সিরিজ।',
  },
  {
    id: 'icds-supervisor',
    title: 'ICDS Supervisor',
    slug: 'icds-supervisor',
    subtitle: 'Integrated Child Development Services',
    shortName: 'ICDS',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 8,
    testSeriesCount: 3,
    totalTestsCount: 18,
    enrollmentsCount: 4860,
    enrollmentsFormatted: '4,860',
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 5,
    iconName: 'FileCheck',
    createdByName: 'Admin',
    createdAtFormatted: '20 Sep 2026, 10:45 AM',
    updatedAtFormatted: '22 Sep 2026, 05:30 PM',
    avgScoreFormatted: '59%',
    completionRateFormatted: '64%',
    description: 'মহিলা ও শিশু বিকাশ দপ্তরের ICDS সুপারভাইজার পরীক্ষার খসড়া টেস্ট সিরিজ।',
  },
  {
    id: 'food-si',
    title: 'Food SI',
    slug: 'food-si',
    subtitle: 'Food Sub Inspector',
    shortName: 'Food SI',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 10,
    testSeriesCount: 3,
    totalTestsCount: 16,
    enrollmentsCount: 4120,
    enrollmentsFormatted: '4,120',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 6,
    iconName: 'Award',
    createdByName: 'Admin',
    createdAtFormatted: '22 Sep 2026, 01:10 PM',
    updatedAtFormatted: '24 Sep 2026, 06:00 PM',
    avgScoreFormatted: '67%',
    completionRateFormatted: '73%',
    description: 'খাদ্য সরবরাহ দপ্তরের সাব-ইন্সপেক্টর নিয়োগ পরীক্ষার ১০০ নম্বরের ফুল মক টেস্ট।',
  },
  {
    id: 'kolkata-police',
    title: 'Kolkata Police',
    slug: 'kolkata-police',
    subtitle: 'Kolkata Police Constable',
    shortName: 'KP',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 9,
    testSeriesCount: 2,
    totalTestsCount: 14,
    enrollmentsCount: 3980,
    enrollmentsFormatted: '3,980',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 7,
    iconName: 'Shield',
    createdByName: 'Admin',
    createdAtFormatted: '24 Sep 2026, 02:30 PM',
    updatedAtFormatted: '26 Sep 2026, 11:40 AM',
    avgScoreFormatted: '70%',
    completionRateFormatted: '74%',
    description: 'কলকাতা পুলিশ কনস্টেবল প্রিলিমস ও মেইনস পরীক্ষার স্পেশাল মক টেস্ট সিরিজ।',
  },
  {
    id: 'ssc-gd',
    title: 'SSC GD',
    slug: 'ssc-gd',
    subtitle: 'Staff Selection Commission GD',
    shortName: 'SSC GD',
    category: 'Central Govt',
    categoryLabel: 'Central Govt',
    subjectsCount: 11,
    testSeriesCount: 3,
    totalTestsCount: 18,
    enrollmentsCount: 3640,
    enrollmentsFormatted: '3,640',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 8,
    iconName: 'Award',
    createdByName: 'Admin',
    createdAtFormatted: '25 Sep 2026, 04:00 PM',
    updatedAtFormatted: '27 Sep 2026, 09:15 AM',
    avgScoreFormatted: '64%',
    completionRateFormatted: '68%',
    description:
      'কেন্দ্রীয় আধা-সামরিক বাহিনীতে কনস্টেবল নিয়োগ পরীক্ষার অল-ইন্ডিয়া প্যাটার্ন টেস্ট।',
  },
  {
    id: 'wbssc-group-c-d',
    title: 'WBSSC Group C & D',
    slug: 'wbssc-group-c-d',
    subtitle: 'West Bengal School Service Commission',
    shortName: 'WBSSC',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 13,
    testSeriesCount: 4,
    totalTestsCount: 24,
    enrollmentsCount: 3210,
    enrollmentsFormatted: '3,210',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 9,
    iconName: 'BookOpen',
    createdByName: 'Admin',
    createdAtFormatted: '27 Sep 2026, 12:00 PM',
    updatedAtFormatted: '28 Sep 2026, 03:50 PM',
    avgScoreFormatted: '66%',
    completionRateFormatted: '71%',
    description: 'পশ্চিমবঙ্গ স্কুল সার্ভিস কমিশন গ্রুপ-সি ও গ্রুপ-ডি পদের জন্য সম্পূর্ণ প্রস্তুতি।',
  },
  {
    id: 'general-knowledge',
    title: 'General Knowledge',
    slug: 'general-knowledge',
    subtitle: 'General Knowledge (Mixed)',
    shortName: 'GK',
    category: 'Other',
    categoryLabel: 'Other',
    subjectsCount: 6,
    testSeriesCount: 2,
    totalTestsCount: 10,
    enrollmentsCount: 2980,
    enrollmentsFormatted: '2,980',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 10,
    iconName: 'BookOpen',
    createdByName: 'Admin',
    createdAtFormatted: '28 Sep 2026, 05:20 PM',
    updatedAtFormatted: '29 Sep 2026, 08:30 PM',
    avgScoreFormatted: '72%',
    completionRateFormatted: '76%',
    description:
      'সমস্ত প্রতিযোগিতামূলক পরীক্ষার জন্য ইতিহাস, ভূগোল, বিজ্ঞান ও কারেন্ট অ্যাফেয়ার্স মক।',
  },
  // Page 2 Exams (11 to 18)
  {
    id: 'primary-tet',
    title: 'Primary TET',
    slug: 'primary-tet',
    subtitle: 'West Bengal Primary Education',
    shortName: 'TET',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 8,
    testSeriesCount: 2,
    totalTestsCount: 12,
    enrollmentsCount: 2750,
    enrollmentsFormatted: '2,750',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 11,
    iconName: 'BookOpen',
    createdByName: 'Admin',
    createdAtFormatted: '29 Sep 2026, 10:00 AM',
    updatedAtFormatted: '30 Sep 2026, 12:00 PM',
    avgScoreFormatted: '63%',
    completionRateFormatted: '67%',
    description:
      'প্রাথমিক শিক্ষক নিয়োগ পরীক্ষার শিশু বিকাশ, বাংলা, গণিত ও পরিবেশ বিদ্যা টেস্ট সিরিজ।',
  },
  {
    id: 'wbcs-prelims',
    title: 'WBCS Executive Prelims',
    slug: 'wbcs-prelims',
    subtitle: 'West Bengal Civil Service',
    shortName: 'WBCS',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 15,
    testSeriesCount: 4,
    totalTestsCount: 30,
    enrollmentsCount: 2640,
    enrollmentsFormatted: '2,640',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 12,
    iconName: 'Award',
    createdByName: 'Admin',
    createdAtFormatted: '30 Sep 2026, 02:00 PM',
    updatedAtFormatted: '01 Oct 2026, 04:30 PM',
    avgScoreFormatted: '58%',
    completionRateFormatted: '62%',
    description: 'ডব্লুবিসিএস প্রিলিমিনারি ২০০ নম্বরের স্ট্যান্ডার্ড মক ও বিশদ সমাধান।',
  },
  {
    id: 'ssc-cgl',
    title: 'SSC CGL',
    slug: 'ssc-cgl',
    subtitle: 'Combined Graduate Level',
    shortName: 'CGL',
    category: 'Central Govt',
    categoryLabel: 'Central Govt',
    subjectsCount: 12,
    testSeriesCount: 3,
    totalTestsCount: 20,
    enrollmentsCount: 2420,
    enrollmentsFormatted: '2,420',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 13,
    iconName: 'Award',
    createdByName: 'Admin',
    createdAtFormatted: '01 Oct 2026, 09:30 AM',
    updatedAtFormatted: '02 Oct 2026, 11:15 AM',
    avgScoreFormatted: '61%',
    completionRateFormatted: '65%',
    description: 'এসএসসি কম্বাইন্ড গ্র্যাজুয়েট লেভেল টিয়ার-১ পরীক্ষার অনলাইন মক টেস্ট সিরিজ।',
  },
  {
    id: 'railway-ntpc',
    title: 'Railway NTPC',
    slug: 'railway-ntpc',
    subtitle: 'RRB Non-Technical Popular Categories',
    shortName: 'NTPC',
    category: 'Central Govt',
    categoryLabel: 'Central Govt',
    subjectsCount: 11,
    testSeriesCount: 3,
    totalTestsCount: 18,
    enrollmentsCount: 2190,
    enrollmentsFormatted: '2,190',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 14,
    iconName: 'Compass',
    createdByName: 'Admin',
    createdAtFormatted: '02 Oct 2026, 01:20 PM',
    updatedAtFormatted: '03 Oct 2026, 03:40 PM',
    avgScoreFormatted: '65%',
    completionRateFormatted: '70%',
    description: 'আরআরবি এনটিপিসি সিবিটি-১ ও সিবিটি-২ পরীক্ষার সম্পূর্ণ সিলেবাস প্র্যাকটিস।',
  },
  {
    id: 'upper-primary-tet',
    title: 'Upper Primary TET',
    slug: 'upper-primary-tet',
    subtitle: 'West Bengal Upper Primary TET',
    shortName: 'UP-TET',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 8,
    testSeriesCount: 2,
    totalTestsCount: 8,
    enrollmentsCount: 1850,
    enrollmentsFormatted: '1,850',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 15,
    iconName: 'BookOpen',
    createdByName: 'Admin',
    createdAtFormatted: '02 Oct 2026, 04:00 PM',
    updatedAtFormatted: '03 Oct 2026, 09:00 AM',
    avgScoreFormatted: '60%',
    completionRateFormatted: '64%',
    description: 'উচ্চ প্রাথমিক শিক্ষক নিয়োগ পরীক্ষার বিষয়ভিত্তিক প্র্যাকটিস সিরিজ।',
  },
  {
    id: 'ctet',
    title: 'CTET',
    slug: 'ctet',
    subtitle: 'Central Teacher Eligibility Test',
    shortName: 'CTET',
    category: 'Central Govt',
    categoryLabel: 'Central Govt',
    subjectsCount: 9,
    testSeriesCount: 2,
    totalTestsCount: 15,
    enrollmentsCount: 1620,
    enrollmentsFormatted: '1,620',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 16,
    iconName: 'GraduationCap',
    createdByName: 'Admin',
    createdAtFormatted: '03 Oct 2026, 11:30 AM',
    updatedAtFormatted: '04 Oct 2026, 02:15 PM',
    avgScoreFormatted: '66%',
    completionRateFormatted: '72%',
    description: 'সেন্ট্রাল টিচার এলিজিবিলিটি টেস্ট পেপার-১ ও পেপার-২ এর জন্য অনলাইন টেস্ট।',
  },
  {
    id: 'wb-police-si',
    title: 'WB Police SI',
    slug: 'wb-police-si',
    subtitle: 'West Bengal Police Sub-Inspector',
    shortName: 'WBP SI',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 10,
    testSeriesCount: 3,
    totalTestsCount: 16,
    enrollmentsCount: 1480,
    enrollmentsFormatted: '1,480',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 17,
    iconName: 'Shield',
    createdByName: 'Admin',
    createdAtFormatted: '03 Oct 2026, 03:40 PM',
    updatedAtFormatted: '04 Oct 2026, 05:00 PM',
    avgScoreFormatted: '68%',
    completionRateFormatted: '73%',
    description: 'পশ্চিমবঙ্গ পুলিশ সাব-ইন্সপেক্টর প্রিলিমিনারি ও মেইনস পরীক্ষার স্পেশাল টেস্ট।',
  },
  {
    id: 'kolkata-police-si',
    title: 'Kolkata Police SI',
    slug: 'kolkata-police-si',
    subtitle: 'Kolkata Police Sub-Inspector & Sergeant',
    shortName: 'KP SI',
    category: 'State Govt',
    categoryLabel: 'State Govt',
    subjectsCount: 9,
    testSeriesCount: 2,
    totalTestsCount: 14,
    enrollmentsCount: 1290,
    enrollmentsFormatted: '1,290',
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 18,
    iconName: 'Shield',
    createdByName: 'Admin',
    createdAtFormatted: '04 Oct 2026, 10:15 AM',
    updatedAtFormatted: '04 Oct 2026, 06:45 PM',
    avgScoreFormatted: '62%',
    completionRateFormatted: '66%',
    description: 'কলকাতা পুলিশ এসআই ও সার্জেন্ট নিয়োগ পরীক্ষার ড্রাফট প্র্যাকটিস সেট।',
  },
];

export const AdminExams: React.FC = () => {
  // Data States
  const [exams, setExams] = useState<EnrichedExamRow[]>(
    isSupabaseConfigured ? [] : CANONICAL_EXAMS_PRESET
  );
  const [, setDbTests] = useState<MockTest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [testSeriesList, setTestSeriesList] = useState<TestSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Selected Exam & Side Panel
  const [selectedExam, setSelectedExam] = useState<EnrichedExamRow | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState<boolean>(false);
  const [detailsTab, setDetailsTab] = useState<
    'overview' | 'subjects' | 'test_series' | 'settings'
  >('overview');

  // Row selection checkboxes
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());

  // Actions Dropdown Menu
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Filter Toolbar States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Success Notification Banner
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Categories & Modal
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading categories:', e);
    }
    return DEFAULT_EXAM_CATEGORIES;
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Create / Edit Exam Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<EnrichedExamRow | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('State Govt');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formIconName, setFormIconName] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // File upload helper: uploads to Supabase storage if available, falls back to Base64 data URL
  const handleUploadImageFile = async (file: File): Promise<string> => {
    if (isSupabaseConfigured) {
      {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `exam-logos/${Date.now()}-${cleanName}`;
        const { data, error } = await supabaseRuntime.storage.from('banners').upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });
        if (!error && data) {
          return supabaseRuntime.storage.from('banners').getPublicUrl(data.path).data.publicUrl;
        }
      }
      throw new Error('Image upload failed. Check Storage permissions.');
    }

    // Fallback to Base64 Data URL (durable, works offline & online)
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  // The confirmed backend record remains authoritative even if a later refresh fails.
  const applySavedExam = (saved: Exam) => {
    const merge = (previous?: EnrichedExamRow): EnrichedExamRow => ({
      subjectsCount: 0,
      testSeriesCount: 0,
      totalTestsCount: 0,
      enrollmentsCount: 0,
      enrollmentsFormatted: 'Unavailable',
      createdByName: 'Unavailable',
      createdAtFormatted: 'Unavailable',
      updatedAtFormatted: 'Unavailable',
      avgScoreFormatted: 'Unavailable',
      completionRateFormatted: 'Unavailable',
      ...previous,
      ...saved,
      shortName: saved.shortName || saved.title.split(' ')[0],
      subtitle: saved.subtitle || saved.description || '',
      categoryLabel: saved.category,
      statusLabel: saved.isActive ? 'Published' : 'Draft',
    });
    setExams((previous) =>
      previous.some((exam) => exam.id === saved.id)
        ? previous.map((exam) => (exam.id === saved.id ? merge(exam) : exam))
        : [...previous, merge()]
    );
    setSelectedExam((previous) => (previous?.id === saved.id ? merge(previous) : previous));
  };

  // Quick direct upload exam logo (e.g. from drawer or table hover)
  const handleQuickUploadExamLogo = async (examId: string, logoUrl: string) => {
    try {
      const saved = await api.updateExam(examId, { iconName: logoUrl });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam logo saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update logo'));
    }
  };

  // Details Drawer Settings Tab States
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsCategory, setSettingsCategory] = useState('State Govt');
  const [settingsStatus, setSettingsStatus] = useState<'Published' | 'Draft'>('Published');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (selectedExam) {
      setSettingsTitle(selectedExam.title);
      setSettingsCategory(selectedExam.category || 'State Govt');
      setSettingsStatus(selectedExam.isActive ? 'Published' : 'Draft');
    }
  }, [selectedExam]);

  // Quick Toggle Exam Status (Published <-> Draft)
  const handleToggleExamStatus = async (exam: EnrichedExamRow, forcedStatus?: boolean) => {
    try {
      const saved = await api.updateExam(exam.id, { isActive: forcedStatus ?? !exam.isActive });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam status saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Status update failed'));
    }
  };

  // Save Settings from Drawer Settings Tab
  const handleSaveDrawerSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedExam || isSavingSettings) return;
    try {
      setIsSavingSettings(true);
      const saved = await api.updateExam(selectedExam.id, {
        title: settingsTitle.trim(),
        category: settingsCategory,
        isActive: settingsStatus === 'Published',
      });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam settings saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Settings save failed'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Load authoritative records; presets only enrich matching backend identities.
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const [rawExams, allTests, allSubjects, allSeries, dbCats] = await Promise.all([
        api.getAllAdminExams(),
        api.getAllAdminTests().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getTestSeries().catch(() => []),
        api.getExamCategories().catch(() => []),
      ]);

      setDbTests(allTests || []);
      setSubjects(allSubjects || []);
      setTestSeriesList(allSeries || []);

      if (dbCats && dbCats.length > 0) {
        const catNames = dbCats
          .map((c) => c.name)
          .filter((name) => !LEGACY_EXAM_CATEGORY_NAMES.has(name.toLowerCase()));
        if (catNames.length > 0) {
          const merged = isSupabaseConfigured
            ? catNames
            : Array.from(new Set([...['State Govt', 'Central Govt', 'Other'], ...catNames]));
          setCategories(merged);
        }
      }

      const mergedList: EnrichedExamRow[] = rawExams.map((dbEx) => {
        const preset = CANONICAL_EXAMS_PRESET.find((e) => e.id === dbEx.id);
        return {
          ...preset,
          ...dbEx,
          shortName: dbEx.shortName || dbEx.title.split(' ')[0],
          subtitle: dbEx.subtitle || dbEx.description || '',
          categoryLabel: dbEx.category,
          subjectsCount: allSubjects.filter((x) => x.examId === dbEx.id).length,
          testSeriesCount: allSeries.filter((x) => x.examId === dbEx.id).length,
          totalTestsCount: dbEx.testsCount ?? allTests.filter((x) => x.examId === dbEx.id).length,
          enrollmentsCount: 0,
          enrollmentsFormatted: 'Unavailable',
          statusLabel: dbEx.isActive ? 'Published' : 'Draft',
          createdByName: 'Unavailable',
          createdAtFormatted: 'Unavailable',
          updatedAtFormatted: 'Unavailable',
          avgScoreFormatted: 'Unavailable',
          completionRateFormatted: 'Unavailable',
        };
      });
      setExams(mergedList);
      setSelectedExam((prev) => {
        if (!prev) return null;
        const found = mergedList.find((e) => e.id === prev.id);
        return found || null;
      });
    } catch (err) {
      console.error('Error loading exams data:', err);
      setLoadError(getErrorMessage(err, 'Exams could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!actionSuccessMessage) return;
    const timer = setTimeout(() => setActionSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [actionSuccessMessage]);

  // Filter application
  const handleApplyFilter = () => {
    setAppliedFilters({
      search: searchTerm,
      category: selectedCategory,
      status: selectedStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setAppliedFilters({
      search: '',
      category: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  // Filtered exams list
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const q = appliedFilters.search.toLowerCase().trim();
      if (q) {
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSub = (e.subtitle || '').toLowerCase().includes(q);
        const matchCat = (e.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchCat) return false;
      }

      if (appliedFilters.category !== 'all') {
        const catNorm = e.category.toLowerCase();
        const targetNorm = appliedFilters.category.toLowerCase();
        if (targetNorm === 'state govt' && !catNorm.includes('state') && !catNorm.includes('wb')) {
          return false;
        }
        if (
          targetNorm === 'central govt' &&
          !catNorm.includes('central') &&
          !catNorm.includes('ssc') &&
          !catNorm.includes('rail')
        ) {
          return false;
        }
        if (targetNorm === 'other' && (catNorm.includes('state') || catNorm.includes('central'))) {
          return false;
        }
      }

      if (appliedFilters.status !== 'all') {
        if (appliedFilters.status === 'published' && (!e.isActive || e.statusLabel === 'Draft')) {
          return false;
        }
        if (appliedFilters.status === 'draft' && e.isActive && e.statusLabel === 'Published') {
          return false;
        }
      }

      return true;
    });
  }, [exams, appliedFilters]);

  // Pagination calculation
  const totalItems = filteredExams.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedExams = filteredExams.slice(startIndex, endIndex);

  // Keep currentPage within bounds when exams are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Row selection handler
  const toggleSelectAll = () => {
    if (selectedExamIds.size === pagedExams.length) {
      setSelectedExamIds(new Set());
    } else {
      setSelectedExamIds(new Set(pagedExams.map((e) => e.id)));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectExamRow = (exam: EnrichedExamRow) => {
    if (selectedExam?.id === exam.id && showDetailsPanel) {
      return;
    }
    setSelectedExam(exam);
    setShowDetailsPanel(true);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingExam(null);
    setFormTitle('');
    setFormShortName('');
    setFormSubtitle('');
    setFormSlug('');
    setFormCategory(categories[0] || 'State Govt');
    setFormDescription('');
    setFormIsActive(true);
    setFormIconName('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exam: EnrichedExamRow) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormShortName(exam.shortName || exam.title.split(' ')[0]);
    setFormSubtitle(exam.subtitle || '');
    setFormSlug(exam.slug);
    setFormCategory(exam.category || 'State Govt');
    setFormDescription(exam.description || '');
    setFormIsActive(exam.isActive);
    setFormIconName(exam.iconName || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Exam (Create / Edit)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formTitle.trim()) {
      setFormError('Exam title is required.');
      return;
    }
    try {
      setIsSaving(true);
      setFormError('');
      const slug =
        formSlug.trim() ||
        formTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      if (!slug) throw new Error('Enter an English URL slug for this exam.');
      const input = {
        title: formTitle.trim(),
        slug,
        shortName: formShortName.trim(),
        subtitle: formSubtitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        orderIndex: editingExam?.orderIndex ?? exams.length + 1,
        isActive: formIsActive,
        iconName: formIconName.trim() || 'Shield',
      };
      const saved = editingExam
        ? await api.updateExam(editingExam.id, input)
        : await api.createExam(input);
      if (!saved?.id) throw new Error('Exam save was not confirmed.');
      applySavedExam(saved);
      await loadData();
      setIsModalOpen(false);
      setActionSuccessMessage('Exam saved in the backend.');
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save exam'));
    } finally {
      setIsSaving(false);
    }
  };

  // Archive / Delete Exam
  const handleArchiveExam = async (exam: EnrichedExamRow) => {
    if (!confirm('Archive "' + exam.title + '"?')) return;
    try {
      const saved = await api.updateExam(exam.id, { isActive: false });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam archived.');
    } catch (err) {
      alert(getErrorMessage(err, 'Archive failed'));
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (
      !window.confirm(
        'Permanently delete this exam? Linked content will block deletion; Archive preserves history.'
      )
    )
      return;
    try {
      await api.deleteExam(examId);
      setExams((prev) => prev.filter((e) => e.id !== examId));
      setSelectedExam((prev) => (prev?.id === examId ? null : prev));
      if (selectedExam?.id === examId) setShowDetailsPanel(false);
      setSelectedExamIds((prev) => {
        const next = new Set(prev);
        next.delete(examId);
        return next;
      });
      // Cache cleanup is best-effort and cannot turn a confirmed deletion into a failure.
      for (const [key, readCache] of [
        [EXAM_LOGO_CACHE_KEY, getExamLogoCache],
        [EXAM_OVERRIDES_CACHE_KEY, getExamOverridesCache],
      ] as const) {
        try {
          const cache = readCache();
          delete cache[examId];
          localStorage.setItem(key, JSON.stringify(cache));
        } catch (error) {
          console.warn('Exam deleted; optional browser cache cleanup failed.', error);
        }
      }
      setCurrentPage(1);
      setActionSuccessMessage('Exam deleted in the backend.');
    } catch (err) {
      alert(getErrorMessage(err, 'Delete failed; archive linked exams instead.'));
    }
  };

  // Duplicate Exam
  const handleDuplicateExam = async (exam: EnrichedExamRow) => {
    try {
      const saved = await api.createExam({
        ...exam,
        title: exam.title + ' (Copy)',
        slug: exam.slug + '-copy-' + crypto.randomUUID().slice(0, 8),
        isActive: false,
      });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Draft exam created.');
    } catch (err) {
      alert(getErrorMessage(err, 'Duplicate failed'));
    }
  };

  // Add Category Handler
  const handleAddCategory = async () => {
    if (!newCategoryInput.trim()) return;
    try {
      const saved = await api.createExamCategory(newCategoryInput.trim(), categories.length);
      setCategories((prev) => [...new Set([...prev, saved.name])]);
      setNewCategoryInput('');
      setActionSuccessMessage('Category saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Category save failed'));
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      await api.deleteExamCategory(catName);
      setCategories((prev) => prev.filter((c) => c !== catName));
      await api.getExamCategories();
      setActionSuccessMessage(`Category "${catName}" deleted.`);
    } catch (err) {
      alert(getErrorMessage(err, 'Category delete failed'));
    }
  };

  return withAdminSkeleton(
    isLoading,
    <div className="space-y-4 max-w-[1600px] mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-200">
      {formError && !isModalOpen && (
        <div role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">
          {formError}
        </div>
      )}
      {loadError && (
        <div role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-800">
          Exam list refresh failed: {loadError}. Any confirmed changes are retained below.
          <button type="button" onClick={() => void loadData()} className="ml-2 underline">
            Retry exam list
          </button>
        </div>
      )}
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Page Header with Title and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Exams
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage exams. Organize exams into categories and link subjects.
          </p>
        </div>

        {/* Top-Right Action Buttons matching screenshot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FolderKanban className="w-4 h-4 text-[#026BFC]" />
            Exam Categories
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Exam
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards in Single Row matching reference screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Exams */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Exams
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {exams.length}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 20%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs last month</p>
          </div>
        </div>

        {/* Card 2: Active Exams */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F6EEFD] dark:bg-purple-950/50 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Active Exams
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {exams.filter((e) => e.isActive).length}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 14%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Test Series */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEF8E7] dark:bg-amber-950/50 text-[#F59E0B] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Test Series
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {testSeriesList.length || 42}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 28%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Mock Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEECEC] dark:bg-rose-950/50 text-[#EF4444] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Mock Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                248
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 32%
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Enrollments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] dark:bg-purple-950/50 text-[#9333EA] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Enrollments
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                1,24,860
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 26%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat, idx) => (
            <div
              key={cat}
              draggable
              title={`Drag to reorder "${cat}"`}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={async (e) => {
                e.preventDefault();
                const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                if (isNaN(fromIdx) || fromIdx === idx) return;
                const updated = [...categories];
                const [moved] = updated.splice(fromIdx, 1);
                updated.splice(idx, 0, moved);
                setCategories(updated);
                try {
                  await api.reorderExamCategories(
                    updated.map((c, i) => ({ name: c, orderIndex: i + 1 }))
                  );
                  setActionSuccessMessage('Categories reordered.');
                } catch (err) {
                  console.warn('Reorder failed:', err);
                }
              }}
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all border flex items-center gap-1.5 select-none',
                selectedCategory === cat
                  ? 'bg-[#026BFC] text-white border-[#026BFC] shadow-2xs'
                  : 'bg-white dark:bg-[#0A1024] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-blue-400'
              )}
            >
              <GripVertical className="w-3 h-3 opacity-60 shrink-0" />
              <span>{cat}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  selectedCategory === cat
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                )}
              >
                {exams.filter((e) => e.category.toLowerCase().includes(cat.toLowerCase())).length}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Filter Toolbar Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search exams... */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* All Categories Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="State Govt">State Govt</option>
            <option value="Central Govt">Central Govt</option>
            <option value="Other">Other</option>
            {categories
              .filter((c) => !['State Govt', 'Central Govt', 'Other'].includes(c))
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>

          {/* All Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'published' | 'draft')}
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
            className="px-4 py-1.5 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetFilter}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. Main Split-Screen Container: Table on Left + Exam Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left Column: Table Container */}
        <div
          className={cn(
            'w-full transition-[flex,max-width] duration-200 min-w-0',
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
                          selectedExamIds.size > 0 && selectedExamIds.size === pagedExams.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Exam Name</th>
                    <th className="py-3 px-2.5 w-28">Category</th>
                    <th className="py-3 px-2 text-center w-20">Subjects</th>
                    <th className="py-3 px-2 text-center w-24">Test Series</th>
                    <th className="py-3 px-2 text-center w-24">Total Tests</th>
                    <th className="py-3 px-3 text-center w-28">Enrollments</th>
                    <th className="py-3 px-2.5 text-center w-24">Status</th>
                    <th className="py-3 px-2.5 text-center w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pagedExams.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No exams found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    pagedExams.map((e, index) => {
                      const rowNumber = startIndex + index + 1;
                      const isSelected = Boolean(showDetailsPanel && selectedExam?.id === e.id);
                      const isChecked = selectedExamIds.has(e.id);
                      const isPublished = e.statusLabel === 'Published';

                      return (
                        <tr
                          key={e.id}
                          onClick={() => handleSelectExamRow(e)}
                          className={cn(
                            'transition-colors cursor-pointer group',
                            isSelected
                              ? 'bg-blue-50/50 dark:bg-blue-950/20'
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
                                toggleSelectRow(e.id, evt as unknown as React.MouseEvent)
                              }
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                          </td>

                          {/* Row Index */}
                          <td className="py-3.5 px-2 text-center text-slate-400 font-medium">
                            {rowNumber}
                          </td>

                          {/* Exam Name: Emblem + Title + Subtitle */}
                          <td className="py-3.5 px-3 min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="relative group/logo shrink-0">
                                <ExamEmblemBadge
                                  title={e.title}
                                  slug={e.slug}
                                  iconName={e.iconName}
                                  className="w-8 h-8 shrink-0"
                                />
                                <label
                                  htmlFor={`table-logo-upload-${e.id}`}
                                  className="absolute inset-0 bg-slate-900/70 rounded-xl opacity-0 group-hover/logo:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white shadow-2xs"
                                  title="Upload new logo"
                                  onClick={(ev) => ev.stopPropagation()}
                                >
                                  <Camera className="w-3.5 h-3.5 text-white" />
                                  <input
                                    id={`table-logo-upload-${e.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onClick={(ev) => ev.stopPropagation()}
                                    onChange={async (ev) => {
                                      ev.stopPropagation();
                                      const file = ev.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const uploadedUrl = await handleUploadImageFile(file);
                                        await handleQuickUploadExamLogo(e.id, uploadedUrl);
                                      } catch (err) {
                                        console.error('Failed to upload logo:', err);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                                  {e.title}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                                  {e.subtitle || 'Competitive Recruitment Exam'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-2.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300 whitespace-nowrap">
                              {e.categoryLabel || e.category || 'State Govt'}
                            </span>
                          </td>

                          {/* Subjects Count */}
                          <td className="py-3.5 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {e.subjectsCount}
                          </td>

                          {/* Test Series Count */}
                          <td className="py-3.5 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {e.testSeriesCount}
                          </td>

                          {/* Total Tests */}
                          <td className="py-3.5 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {e.totalTestsCount}
                          </td>

                          {/* Enrollments */}
                          <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {e.enrollmentsFormatted || e.enrollmentsCount.toLocaleString('en-IN')}
                          </td>

                          {/* Status Badge */}
                          <td
                            className="py-3.5 px-2.5 text-center"
                            onClick={(evt) => evt.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleExamStatus(e)}
                              title={`Click to switch status to ${isPublished ? 'Draft' : 'Published'}`}
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer select-none',
                                isPublished
                                  ? 'bg-[#E8F8F0] text-[#10B981] hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-[#FEF8E7] text-[#D97706] hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  isPublished ? 'bg-[#10B981]' : 'bg-[#D97706]'
                                )}
                              />
                              {e.statusLabel}
                            </button>
                          </td>

                          {/* Actions Menu */}
                          <td
                            className="py-3.5 px-2.5 text-center relative"
                            onClick={(evt) => evt.stopPropagation()}
                          >
                            <button
                              type="button"
                              aria-label={`Actions for ${e.title}`}
                              onClick={() =>
                                setOpenActionMenuId(openActionMenuId === e.id ? null : e.id)
                              }
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </button>

                            {openActionMenuId === e.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleSelectExamRow(e);
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
                                      handleOpenEditModal(e);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                    Edit Exam
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleToggleExamStatus(e);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    {isPublished ? (
                                      <>
                                        <X className="w-3.5 h-3.5 text-amber-500" />
                                        Change to Draft
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        Publish Exam
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDuplicateExam(e);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                    Duplicate Exam
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleArchiveExam(e);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Archive Exam
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDeleteExam(e.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Permanently
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls matching screenshot */}
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} exams
              </span>

              <div className="flex items-center gap-3">
                {/* Numbered Page Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={cn(
                          'min-w-7 h-7 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer',
                          item === currentPage
                            ? 'bg-[#026BFC] text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Page Size Dropdown */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Exam Details Card (Side-by-side with Table) */}
        {showDetailsPanel && selectedExam && (
          <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5">
            {/* Header: Exam Details & Close X */}
            <div className="flex items-center justify-between pb-0.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Exam Details</h2>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsPanel(false);
                  setSelectedExam(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Exam Summary Banner: Shield + Title + Badges + Edit */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="relative group/drawerlogo shrink-0">
                  <ExamEmblemBadge
                    title={selectedExam.title}
                    slug={selectedExam.slug}
                    iconName={selectedExam.iconName}
                    className="w-10 h-11 shrink-0"
                  />
                  <label
                    htmlFor={`drawer-logo-upload-${selectedExam.id}`}
                    className="absolute inset-0 bg-slate-900/70 rounded-xl opacity-0 group-hover/drawerlogo:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white shadow-2xs"
                    title="Upload new logo"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      id={`drawer-logo-upload-${selectedExam.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (ev) => {
                        const file = ev.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploadedUrl = await handleUploadImageFile(file);
                          await handleQuickUploadExamLogo(selectedExam.id, uploadedUrl);
                        } catch (err) {
                          console.error('Failed to upload logo:', err);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {selectedExam.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-slate-400 truncate">
                      {selectedExam.subtitle || 'West Bengal Police Constable'}
                    </p>
                    <label
                      htmlFor={`drawer-logo-upload-badge-${selectedExam.id}`}
                      className="text-[10px] text-[#026BFC] hover:underline font-semibold cursor-pointer shrink-0 flex items-center gap-0.5"
                      title="Upload new logo image"
                    >
                      <Upload className="w-2.5 h-2.5" />
                      Logo
                      <input
                        id={`drawer-logo-upload-badge-${selectedExam.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (ev) => {
                          const file = ev.target.files?.[0];
                          if (!file) return;
                          try {
                            const uploadedUrl = await handleUploadImageFile(file);
                            await handleQuickUploadExamLogo(selectedExam.id, uploadedUrl);
                          } catch (err) {
                            console.error('Failed to upload logo:', err);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Status Badge + Edit Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleExamStatus(selectedExam)}
                  title={`Click to switch status to ${selectedExam.statusLabel === 'Published' ? 'Draft' : 'Published'}`}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer',
                    selectedExam.statusLabel === 'Published'
                      ? 'bg-[#E8F8F0] text-[#10B981] hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-[#FEF8E7] text-[#D97706] hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                  )}
                >
                  {selectedExam.statusLabel}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(selectedExam)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-50 shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>

            {/* Horizontal Tabs: Overview, Subjects (10), Test Series (5), Settings */}
            <div className="flex items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
              {(
                [
                  { key: 'overview', label: 'Overview' },
                  { key: 'subjects', label: `Subjects (${selectedExam.subjectsCount || 10})` },
                  {
                    key: 'test_series',
                    label: `Test Series (${selectedExam.testSeriesCount || 5})`,
                  },
                  { key: 'settings', label: 'Settings' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDetailsTab(tab.key)}
                  className={cn(
                    'pb-2.5 relative transition-colors',
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
                {/* 6 Mini KPI Cards (3 columns x 2 rows) matching screenshot */}
                <div className="grid grid-cols-3 gap-1.5">
                  {/* 1. Subjects */}
                  <div className="p-2 rounded-xl bg-[#EBF5FF] dark:bg-blue-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
                      <BookOpen className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedExam.subjectsCount}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">Subjects</span>
                    </div>
                  </div>

                  {/* 2. Test Series */}
                  <div className="p-2 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                      <Layers className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedExam.testSeriesCount}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        Test Series
                      </span>
                    </div>
                  </div>

                  {/* 3. Total Tests */}
                  <div className="p-2 rounded-xl bg-[#FEECEC] dark:bg-rose-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#FCD4D4] text-[#EF4444] flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedExam.totalTestsCount}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        Total Tests
                      </span>
                    </div>
                  </div>

                  {/* 4. Enrollments */}
                  <div className="p-2 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
                      <Users className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedExam.enrollmentsFormatted ||
                          selectedExam.enrollmentsCount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        Enrollments
                      </span>
                    </div>
                  </div>

                  {/* 5. Avg. Score */}
                  <div className="p-2 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedExam.avgScoreFormatted || '68%'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">Avg. Score</span>
                    </div>
                  </div>

                  {/* 6. Completion Rate */}
                  <div className="p-2 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedExam.completionRateFormatted || '72%'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        Completion Rate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description Box with Bengali Text */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Description
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedExam)}
                      className="text-[11px] font-semibold text-[#026BFC] flex items-center gap-0.5"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      Edit
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedExam.description ||
                      'WBP Constable পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি সিরিজ। এই পরীক্ষায় যুক্ত রয়েছে Full Mock, Topic Test ইত্যাদি বিভিন্ন ধরণের পরীক্ষার সিরিজ যা আপনাকে পরীক্ষার প্রস্তুতিকে শক্তিশালী করবে।'}
                  </p>
                </div>

                {/* Basic Information Key-Value Table matching screenshot */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Basic Information
                  </span>

                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-slate-400">Exam Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.title}
                    </span>

                    <span className="text-slate-400">Short Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.shortName || selectedExam.title.split(' ')[0]}
                    </span>

                    <span className="text-slate-400">Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.categoryLabel || selectedExam.category || 'State Govt'}
                    </span>

                    <span className="text-slate-400">Total Subjects</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.subjectsCount}
                    </span>

                    <span className="text-slate-400">Total Test Series</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.testSeriesCount}
                    </span>

                    <span className="text-slate-400">Total Tests</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.totalTestsCount}
                    </span>

                    <span className="text-slate-400">Total Enrollments</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.enrollmentsFormatted ||
                        selectedExam.enrollmentsCount.toLocaleString('en-IN')}
                    </span>

                    <span className="text-slate-400">Status</span>
                    <span
                      className={cn(
                        'font-semibold text-right',
                        selectedExam.statusLabel === 'Published'
                          ? 'text-[#10B981]'
                          : 'text-[#D97706]'
                      )}
                    >
                      {selectedExam.statusLabel}
                    </span>

                    <span className="text-slate-400">Created By</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.createdByName || 'Admin'}
                    </span>

                    <span className="text-slate-400">Created At</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.createdAtFormatted || '10 Sep 2026, 04:30 PM'}
                    </span>

                    <span className="text-slate-400">Last Updated</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedExam.updatedAtFormatted || '12 Sep 2026, 10:15 AM'}
                    </span>
                  </div>
                </div>

                {/* Bottom 2 Action Buttons matching screenshot */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleArchiveExam(selectedExam)}
                    className="flex-1 py-2 px-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Archive Exam
                  </button>

                  <a
                    href={`/exams/${selectedExam.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on Website
                  </a>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SUBJECTS */}
            {detailsTab === 'subjects' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Linked Subjects ({selectedExam.subjectsCount})
                  </span>
                  <a
                    href="/admin/subjects"
                    className="text-xs text-[#026BFC] hover:underline font-semibold"
                  >
                    Manage Subjects
                  </a>
                </div>
                <p className="text-[11px] text-slate-500">
                  Subjects associated with {selectedExam.title} for topic tests and syllabus
                  coverage:
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {(subjects.length > 0
                    ? subjects.slice(0, selectedExam.subjectsCount)
                    : [
                        { id: '1', name: 'General Awareness & GK', orderIndex: 1 },
                        { id: '2', name: 'Elementary Mathematics', orderIndex: 2 },
                        { id: '3', name: 'Reasoning & Logical Analysis', orderIndex: 3 },
                        { id: '4', name: 'English Grammar & Comprehension', orderIndex: 4 },
                        { id: '5', name: 'General Science & Physics', orderIndex: 5 },
                        { id: '6', name: 'Indian History & Freedom Struggle', orderIndex: 6 },
                        { id: '7', name: 'Geography of India & West Bengal', orderIndex: 7 },
                        { id: '8', name: 'Indian Constitution & Polity', orderIndex: 8 },
                        { id: '9', name: 'Current Affairs & Sports', orderIndex: 9 },
                        { id: '10', name: 'Bengali Language & Grammar', orderIndex: 10 },
                      ]
                  ).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {sub.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: TEST SERIES */}
            {detailsTab === 'test_series' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Test Series ({selectedExam.testSeriesCount})
                  </span>
                  <a
                    href="/admin/test-series"
                    className="text-xs text-[#026BFC] hover:underline font-semibold"
                  >
                    View All Series
                  </a>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {[
                    {
                      id: 'ts-1',
                      title: `${selectedExam.title} Mega Full Mock Series`,
                      tests: 15,
                      enrolls: '8,400',
                    },
                    {
                      id: 'ts-2',
                      title: `${selectedExam.title} Official PYQ 2018-2024`,
                      tests: 8,
                      enrolls: '3,200',
                    },
                    {
                      id: 'ts-3',
                      title: `${selectedExam.title} High-Yield Topic Tests`,
                      tests: 12,
                      enrolls: '2,900',
                    },
                    {
                      id: 'ts-4',
                      title: `${selectedExam.title} Speed Booster Math & GI`,
                      tests: 6,
                      enrolls: '1,800',
                    },
                    {
                      id: 'ts-5',
                      title: `${selectedExam.title} Special Bengali Mock Set`,
                      tests: 4,
                      enrolls: '1,200',
                    },
                  ]
                    .slice(0, selectedExam.testSeriesCount)
                    .map((ts) => (
                      <div
                        key={ts.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {ts.title}
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{ts.tests} Tests</span>
                          <span>{ts.enrolls} Students</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {detailsTab === 'settings' && (
              <div className="space-y-3 text-xs">
                {/* Exam Logo Upload */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Exam Logo / Emblem
                  </label>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                    <ExamEmblemBadge
                      title={selectedExam.title}
                      slug={selectedExam.slug}
                      iconName={selectedExam.iconName}
                      className="w-10 h-10 shrink-0 shadow-2xs"
                    />
                    <div className="space-y-1 min-w-0">
                      <label
                        htmlFor={`settings-tab-logo-upload-${selectedExam.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        Upload New Logo
                        <input
                          id={`settings-tab-logo-upload-${selectedExam.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            try {
                              const uploadedUrl = await handleUploadImageFile(file);
                              await handleQuickUploadExamLogo(selectedExam.id, uploadedUrl);
                            } catch (err) {
                              console.error('Failed to upload logo:', err);
                            }
                          }}
                        />
                      </label>
                      {selectedExam.iconName &&
                        (selectedExam.iconName.startsWith('data:') ||
                          selectedExam.iconName.startsWith('http') ||
                          selectedExam.iconName.startsWith('/')) && (
                          <button
                            type="button"
                            onClick={() => handleQuickUploadExamLogo(selectedExam.id, 'Shield')}
                            className="text-[11px] text-slate-500 hover:text-rose-600 block transition-colors"
                          >
                            Reset to default emblem
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Exam Title
                  </label>
                  <input
                    type="text"
                    value={settingsTitle}
                    onChange={(e) => setSettingsTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={settingsCategory}
                    onChange={(e) => setSettingsCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white"
                  >
                    <option value="State Govt">State Govt</option>
                    <option value="Central Govt">Central Govt</option>
                    <option value="Other">Other</option>
                    {categories
                      .filter((c) => !['State Govt', 'Central Govt', 'Other'].includes(c))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={settingsStatus}
                    onChange={(e) => setSettingsStatus(e.target.value as 'Published' | 'Draft')}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white"
                  >
                    <option value="Published">Published (Active)</option>
                    <option value="Draft">Draft / Hidden (Inactive)</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={isSavingSettings}
                  onClick={handleSaveDrawerSettings}
                  className="w-full py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold transition-colors mt-2 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Categories Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#026BFC]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Manage Exam Categories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Manage examination categories for grouping target exams across the platform.
            </p>

            {/* Add Category Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      {
                        exams.filter((e) => e.category.toLowerCase().includes(cat.toLowerCase()))
                          .length
                      }{' '}
                      exams
                    </span>
                    <button
                      type="button"
                      title="Delete category"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingExam ? `Edit Exam — ${editingExam.title}` : 'Create Target Exam'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveExam} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WBP Constable"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!editingExam) {
                      setFormSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      );
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Short Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WBP"
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                  >
                    <option value="State Govt">State Govt</option>
                    <option value="Central Govt">Central Govt</option>
                    <option value="Other">Other</option>
                    {categories
                      .filter((c) => !['State Govt', 'Central Govt', 'Other'].includes(c))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Subtitle / Board Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. West Bengal Police Constable"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. wbp-constable"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                />
              </div>

              {/* Exam Logo / Emblem Upload */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      Exam Icon / Logo
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Upload a custom PNG, JPG, WebP, or SVG logo, or pick a preset emblem
                    </span>
                  </div>
                  {formIconName && (
                    <button
                      type="button"
                      onClick={() => setFormIconName('')}
                      className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                      title="Remove icon"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Icon
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3.5">
                  {/* Live Emblem Preview */}
                  <div className="relative group shrink-0">
                    <ExamEmblemBadge
                      title={formTitle || 'Exam Logo'}
                      slug={formSlug}
                      iconName={formIconName}
                      className="w-12 h-12 shadow-sm"
                    />
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="exam-modal-logo-file-input"
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                          isUploadingLogo
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                        )}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingLogo
                          ? 'Uploading...'
                          : formIconName
                            ? 'Change Icon'
                            : 'Upload Icon'}
                        <input
                          id="exam-modal-logo-file-input"
                          type="file"
                          accept="image/*"
                          disabled={isUploadingLogo}
                          className="hidden"
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            try {
                              setIsUploadingLogo(true);
                              const uploadedUrl = await handleUploadImageFile(file);
                              setFormIconName(uploadedUrl);
                            } catch (err) {
                              alert('Failed to upload image: ' + getErrorMessage(err, 'Error'));
                            } finally {
                              setIsUploadingLogo(false);
                            }
                          }}
                        />
                      </label>

                      {formIconName && (
                        <button
                          type="button"
                          onClick={() => setFormIconName('')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}

                      <span className="text-[11px] text-slate-400">or image URL:</span>
                    </div>

                    <input
                      type="text"
                      placeholder="https://... or data:image/..."
                      value={formIconName}
                      onChange={(e) => setFormIconName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder:font-sans"
                    />
                  </div>
                </div>

                {/* Preset Emblem Quick Selector */}
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Preset Emblems
                    </span>
                    <span className="text-[10px] text-slate-400">Click to apply</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {[
                      { name: 'Police Crest', icon: 'Shield', label: 'WBP' },
                      { name: 'SSC Crest', icon: 'ssc', label: 'SSC' },
                      { name: 'Railways Emblem', icon: 'railway', label: 'Rail' },
                      { name: 'WBPSC Seal', icon: 'wbpsc', label: 'WBPSC' },
                      { name: 'Kolkata Police Star', icon: 'kolkata', label: 'KP' },
                      { name: 'ICDS Rosette', icon: 'icds', label: 'ICDS' },
                      { name: 'Food SI Crest', icon: 'food', label: 'Food SI' },
                      { name: 'WBSSC Book', icon: 'wbssc', label: 'WBSSC' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormIconName(preset.icon)}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all shrink-0',
                          formIconName === preset.icon
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        )}
                        title={preset.name}
                      >
                        <ExamEmblemBadge
                          title={preset.icon}
                          slug={preset.icon}
                          iconName={preset.icon}
                          className="w-4 h-4"
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the exam, target vacancies and syllabus..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label
                  htmlFor="formIsActive"
                  className="font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Publish on platform (Visible to students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>,
    { label: 'Loading exams…', variant: 'table' }
  );
};
