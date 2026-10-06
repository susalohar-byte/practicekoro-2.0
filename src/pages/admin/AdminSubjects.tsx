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
  Users,
  Eye,
  MoreHorizontal,
  Filter,
  TrendingUp,
  Upload,
  ArrowUpDown,
  BookOpen,
  FlaskConical,
  Lightbulb,
  Landmark,
  Building2,
  Globe,
  Brain,
  Newspaper,
  Monitor,
  Copy,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import type { Subject, Chapter, MockTest } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

// Enriched Subject model matching all fields in the reference screenshot
export interface EnrichedSubjectRow extends Subject {
  category: 'General' | 'Social Science' | 'Aptitude' | string;
  topicsCount: number;
  topicTestsCount: number;
  totalQuestionsCount: number;
  totalQuestionsFormatted: string;
  statusLabel: 'Published' | 'Draft';
  createdByName?: string;
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
  avgScoreFormatted?: string;
  completionRateFormatted?: string;
}

// Subject Icon Badge matching the reference screenshot colors and icons
export const SubjectIconBadge: React.FC<{
  name: string;
  iconName?: string;
  className?: string;
}> = ({ name, className = 'w-8 h-8' }) => {
  const norm = name.toLowerCase();

  // 1. General Science -> Purple Flask / Beaker
  if (norm.includes('science') || norm.includes('physics') || norm.includes('chemistry') || norm.includes('biology')) {
    return (
      <div className={cn('rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs border border-[#E9D5FF]', className)}>
        <FlaskConical className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // 2. General Knowledge / Static GK -> Amber Lightbulb
  if (norm.includes('knowledge') || norm.includes('gk') || norm.includes('awareness')) {
    if (norm.includes('computer')) {
      return (
        <div className={cn('rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs border border-[#E9D5FF]', className)}>
          <Monitor className="w-4 h-4 text-[#8B5CF6]" />
        </div>
      );
    }
    return (
      <div className={cn('rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs border border-[#FDE68A]', className)}>
        <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 3. History -> Rose / Red Landmark Pillar
  if (norm.includes('history') || norm.includes('heritage') || norm.includes('movement')) {
    return (
      <div className={cn('rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 shadow-2xs border border-[#FECDD3]', className)}>
        <Landmark className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // 4. Indian Polity / Constitution -> Blue Classical Parliament / Building
  if (norm.includes('polity') || norm.includes('constitution') || norm.includes('law')) {
    return (
      <div className={cn('rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 shadow-2xs border border-[#BFDBFE]', className)}>
        <Building2 className="w-4 h-4 text-[#026BFC]" />
      </div>
    );
  }

  // 5. Geography -> Green Globe / Earth
  if (norm.includes('geography') || norm.includes('environment')) {
    return (
      <div className={cn('rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 shadow-2xs border border-[#A7F3D0]', className)}>
        <Globe className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 6. Economics -> Orange Line Chart / Growth
  if (norm.includes('economic') || norm.includes('economy')) {
    return (
      <div className={cn('rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs border border-[#FDE68A]', className)}>
        <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 7. Reasoning / GI -> Red Brain / Mind
  if (norm.includes('reasoning') || norm.includes('intelligence') || norm.includes('logic')) {
    return (
      <div className={cn('rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 shadow-2xs border border-[#FECDD3]', className)}>
        <Brain className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // 8. Mathematics / Quantitative -> Blue Math square with √x
  if (norm.includes('math') || norm.includes('arithmetic') || norm.includes('quant')) {
    return (
      <div className={cn('rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 shadow-2xs border border-[#BFDBFE]', className)}>
        <span className="font-bold text-[11px] font-mono tracking-tighter leading-none select-none">√x</span>
      </div>
    );
  }

  // 9. Current Affairs -> Green Newspaper / Calendar
  if (norm.includes('current') || norm.includes('affairs') || norm.includes('news')) {
    return (
      <div className={cn('rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 shadow-2xs border border-[#A7F3D0]', className)}>
        <Newspaper className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 10. Computer Awareness -> Purple Monitor
  if (norm.includes('computer') || norm.includes('it') || norm.includes('digital')) {
    return (
      <div className={cn('rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs border border-[#E9D5FF]', className)}>
        <Monitor className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // Default fallback -> Blue Open Book
  return (
    <div className={cn('rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 shadow-2xs border border-[#BFDBFE]', className)}>
      <BookOpen className="w-4 h-4 text-[#026BFC]" />
    </div>
  );
};

// 24 Canonical Subjects Preset matching the reference UI exactly
const CANONICAL_SUBJECTS_PRESET: EnrichedSubjectRow[] = [
  {
    id: 'sub-general-science',
    name: 'General Science',
    slug: 'general-science',
    category: 'General',
    topicsCount: 18,
    topicTestsCount: 42,
    totalQuestionsCount: 3280,
    totalQuestionsFormatted: '3,280',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 1,
    iconName: 'FlaskConical',
    createdByName: 'Admin',
    createdAtFormatted: '12 Aug 2026, 11:20 AM',
    updatedAtFormatted: '14 Sep 2026, 04:15 PM',
    avgScoreFormatted: '68%',
    completionRateFormatted: '72%',
    description:
      'General Science বিষয়টি ভৌত বিজ্ঞান, রসায়ন বিজ্ঞান, জীব বিজ্ঞান, পরিবেশ বিজ্ঞান এবং দৈনন্দিন জীবনের বিজ্ঞান সম্পর্কিত গুরুত্বপূর্ণ টপিক নিয়ে তৈরি। এটি বিভিন্ন সরকারি পরীক্ষার জন্য অত্যন্ত গুরুত্বপূর্ণ একটি বিষয়।',
  },
  {
    id: 'sub-general-knowledge',
    name: 'General Knowledge',
    slug: 'general-knowledge',
    category: 'General',
    topicsCount: 24,
    topicTestsCount: 36,
    totalQuestionsCount: 2940,
    totalQuestionsFormatted: '2,940',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 2,
    iconName: 'Lightbulb',
    createdByName: 'Admin',
    createdAtFormatted: '14 Aug 2026, 10:00 AM',
    updatedAtFormatted: '15 Sep 2026, 02:30 PM',
    avgScoreFormatted: '64%',
    completionRateFormatted: '70%',
    description: 'সাধারণ জ্ঞান এবং স্ট্যাটিক জিকে বিষয়ক সমস্ত গুরুত্বপূর্ণ টপিক ও প্রশ্ন সম্ভার।',
  },
  {
    id: 'sub-history',
    name: 'History',
    slug: 'history',
    category: 'Social Science',
    topicsCount: 22,
    topicTestsCount: 28,
    totalQuestionsCount: 2450,
    totalQuestionsFormatted: '2,450',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 3,
    iconName: 'Landmark',
    createdByName: 'Admin',
    createdAtFormatted: '15 Aug 2026, 02:15 PM',
    updatedAtFormatted: '16 Sep 2026, 05:00 PM',
    avgScoreFormatted: '66%',
    completionRateFormatted: '71%',
    description: 'প্রাচীন, মধ্যযুগীয় এবং ভারতের জাতীয় স্বাধীনতা সংগ্রামের ইতিহাস।',
  },
  {
    id: 'sub-indian-polity',
    name: 'Indian Polity',
    slug: 'indian-polity',
    category: 'Social Science',
    topicsCount: 20,
    topicTestsCount: 30,
    totalQuestionsCount: 2680,
    totalQuestionsFormatted: '2,680',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 4,
    iconName: 'Building2',
    createdByName: 'Admin',
    createdAtFormatted: '18 Aug 2026, 09:30 AM',
    updatedAtFormatted: '18 Sep 2026, 01:20 PM',
    avgScoreFormatted: '69%',
    completionRateFormatted: '74%',
    description: 'ভারতীয় সংবিধান, মৌলিক অধিকার, সংসদ, রাষ্ট্রপতি এবং বিচার বিভাগ।',
  },
  {
    id: 'sub-geography',
    name: 'Geography',
    slug: 'geography',
    category: 'Social Science',
    topicsCount: 18,
    topicTestsCount: 26,
    totalQuestionsCount: 2420,
    totalQuestionsFormatted: '2,420',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 5,
    iconName: 'Globe',
    createdByName: 'Admin',
    createdAtFormatted: '20 Aug 2026, 04:45 PM',
    updatedAtFormatted: '20 Sep 2026, 11:10 AM',
    avgScoreFormatted: '67%',
    completionRateFormatted: '73%',
    description: 'ভারত ও পশ্চিমবঙ্গের ভৌগোলিক অবস্থান, নদনদী, জলবায়ু এবং প্রাকৃতিক সম্পদ।',
  },
  {
    id: 'sub-economics',
    name: 'Economics',
    slug: 'economics',
    category: 'Social Science',
    topicsCount: 16,
    topicTestsCount: 22,
    totalQuestionsCount: 1980,
    totalQuestionsFormatted: '1,980',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 6,
    iconName: 'TrendingUp',
    createdByName: 'Admin',
    createdAtFormatted: '22 Aug 2026, 12:10 PM',
    updatedAtFormatted: '22 Sep 2026, 06:40 PM',
    avgScoreFormatted: '62%',
    completionRateFormatted: '68%',
    description: 'ভারতীয় অর্থনীতি, পঞ্চবার্ষিকী পরিকল্পনা, মুদ্রানীতি, বাজেট ও ব্যাংকিং ব্যবস্থা।',
  },
  {
    id: 'sub-reasoning',
    name: 'Reasoning',
    slug: 'reasoning',
    category: 'Aptitude',
    topicsCount: 28,
    topicTestsCount: 46,
    totalQuestionsCount: 3750,
    totalQuestionsFormatted: '3,750',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 7,
    iconName: 'Brain',
    createdByName: 'Admin',
    createdAtFormatted: '24 Aug 2026, 03:00 PM',
    updatedAtFormatted: '25 Sep 2026, 10:15 AM',
    avgScoreFormatted: '71%',
    completionRateFormatted: '76%',
    description: 'ভার্বাল ও নন-ভার্বাল রিজনিং, ব্লাড রিলেশন, সিরিজ, অ্যানালজি এবং লজিক্যাল রিজনিং।',
  },
  {
    id: 'sub-mathematics',
    name: 'Mathematics',
    slug: 'mathematics',
    category: 'Aptitude',
    topicsCount: 32,
    topicTestsCount: 48,
    totalQuestionsCount: 4120,
    totalQuestionsFormatted: '4,120',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 8,
    iconName: 'Calculator',
    createdByName: 'Admin',
    createdAtFormatted: '25 Aug 2026, 01:40 PM',
    updatedAtFormatted: '26 Sep 2026, 03:20 PM',
    avgScoreFormatted: '65%',
    completionRateFormatted: '70%',
    description: 'পাটিগণিত, বীজগণিত, জ্যামিতি, পরিমিতি এবং ত্রিকোণমিতির অধ্যায়ভিত্তিক শর্টকাট টেস্ট।',
  },
  {
    id: 'sub-current-affairs',
    name: 'Current Affairs',
    slug: 'current-affairs',
    category: 'General',
    topicsCount: 36,
    topicTestsCount: 54,
    totalQuestionsCount: 4680,
    totalQuestionsFormatted: '4,680',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 9,
    iconName: 'Newspaper',
    createdByName: 'Admin',
    createdAtFormatted: '27 Aug 2026, 11:15 AM',
    updatedAtFormatted: '28 Sep 2026, 09:00 AM',
    avgScoreFormatted: '73%',
    completionRateFormatted: '78%',
    description: 'জাতীয় ও আন্তর্জাতিক সাম্প্রতিক ঘটনাবলী, খেলাধুলা, পুরস্কার এবং সামিটস।',
  },
  {
    id: 'sub-computer-awareness',
    name: 'Computer Awareness',
    slug: 'computer-awareness',
    category: 'General',
    topicsCount: 14,
    topicTestsCount: 18,
    totalQuestionsCount: 1260,
    totalQuestionsFormatted: '1,260',
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 10,
    iconName: 'Monitor',
    createdByName: 'Admin',
    createdAtFormatted: '28 Aug 2026, 05:20 PM',
    updatedAtFormatted: '29 Sep 2026, 04:30 PM',
    avgScoreFormatted: '60%',
    completionRateFormatted: '65%',
    description: 'কম্পিউটার ফান্ডামেন্টালস, হার্ডওয়্যার, সফটওয়্যার, এমএস অফিস এবং ইন্টারনেট।',
  },
  // Page 2 Subjects (11 to 20)
  {
    id: 'sub-english-language',
    name: 'English Language',
    slug: 'english-language',
    category: 'Aptitude',
    topicsCount: 20,
    topicTestsCount: 32,
    totalQuestionsCount: 2850,
    totalQuestionsFormatted: '2,850',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 11,
    iconName: 'BookOpen',
    createdByName: 'Admin',
    createdAtFormatted: '30 Aug 2026, 10:00 AM',
    updatedAtFormatted: '01 Sep 2026, 02:00 PM',
    avgScoreFormatted: '63%',
    completionRateFormatted: '69%',
    description: 'English Grammar, Vocabulary, Idioms, Phrasal Verbs & Comprehension.',
  },
  {
    id: 'sub-bengali-grammar',
    name: 'Bengali Grammar',
    slug: 'bengali-grammar',
    category: 'General',
    topicsCount: 16,
    topicTestsCount: 24,
    totalQuestionsCount: 2150,
    totalQuestionsFormatted: '2,150',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 12,
    iconName: 'BookOpen',
    createdByName: 'Admin',
    createdAtFormatted: '01 Sep 2026, 11:30 AM',
    updatedAtFormatted: '02 Sep 2026, 04:15 PM',
    avgScoreFormatted: '72%',
    completionRateFormatted: '77%',
    description: 'বাংলা ব্যাকরণ, সন্ধি, সমাস, কারক ও বিভক্তি এবং এক কথায় প্রকাশ।',
  },
  {
    id: 'sub-environmental-studies',
    name: 'Environmental Studies',
    slug: 'environmental-studies',
    category: 'General',
    topicsCount: 12,
    topicTestsCount: 18,
    totalQuestionsCount: 1640,
    totalQuestionsFormatted: '1,640',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 13,
    iconName: 'Globe',
    createdByName: 'Admin',
    createdAtFormatted: '02 Sep 2026, 03:00 PM',
    updatedAtFormatted: '03 Sep 2026, 05:40 PM',
    avgScoreFormatted: '67%',
    completionRateFormatted: '72%',
    description: 'পরিবেশ বিদ্যা, বাস্তুতন্ত্র, জীববৈচিত্র্য, দূষণ এবং পরিবেশ আইন।',
  },
  {
    id: 'sub-physics',
    name: 'Physics',
    slug: 'physics',
    category: 'General',
    topicsCount: 14,
    topicTestsCount: 20,
    totalQuestionsCount: 1820,
    totalQuestionsFormatted: '1,820',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 14,
    iconName: 'FlaskConical',
    createdByName: 'Admin',
    createdAtFormatted: '03 Sep 2026, 09:15 AM',
    updatedAtFormatted: '04 Sep 2026, 01:30 PM',
    avgScoreFormatted: '64%',
    completionRateFormatted: '69%',
    description: 'বলবিদ্যা, শব্দ, আলো, তাপ, বিদ্যুৎ এবং আধুনিক পদার্থবিদ্যা।',
  },
  {
    id: 'sub-chemistry',
    name: 'Chemistry',
    slug: 'chemistry',
    category: 'General',
    topicsCount: 12,
    topicTestsCount: 16,
    totalQuestionsCount: 1510,
    totalQuestionsFormatted: '1,510',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 15,
    iconName: 'FlaskConical',
    createdByName: 'Admin',
    createdAtFormatted: '04 Sep 2026, 01:20 PM',
    updatedAtFormatted: '05 Sep 2026, 03:45 PM',
    avgScoreFormatted: '61%',
    completionRateFormatted: '66%',
    description: 'পদার্থের অবস্থা, পরমাণুর গঠন, পর্যায় সারণি ও রাসায়নিক বন্ধন।',
  },
  {
    id: 'sub-biology',
    name: 'Biology',
    slug: 'biology',
    category: 'General',
    topicsCount: 16,
    topicTestsCount: 22,
    totalQuestionsCount: 2050,
    totalQuestionsFormatted: '2,050',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 16,
    iconName: 'FlaskConical',
    createdByName: 'Admin',
    createdAtFormatted: '05 Sep 2026, 10:40 AM',
    updatedAtFormatted: '06 Sep 2026, 12:15 PM',
    avgScoreFormatted: '70%',
    completionRateFormatted: '75%',
    description: 'কোষ জীববিদ্যা, মানব শারীরস্থান, উদ্ভিদ শারীরস্থান এবং রোগব্যাধি।',
  },
  {
    id: 'sub-indian-freedom-movement',
    name: 'Indian National Movement',
    slug: 'indian-national-movement',
    category: 'Social Science',
    topicsCount: 10,
    topicTestsCount: 14,
    totalQuestionsCount: 1320,
    totalQuestionsFormatted: '1,320',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 17,
    iconName: 'Landmark',
    createdByName: 'Admin',
    createdAtFormatted: '06 Sep 2026, 02:00 PM',
    updatedAtFormatted: '07 Sep 2026, 04:30 PM',
    avgScoreFormatted: '68%',
    completionRateFormatted: '74%',
    description: '১৮৫৭ মহাবিদ্রোহ থেকে ১৯৪৭ পর্যন্ত ভারতের স্বাধীনতা সংগ্রামের ইতিহাস।',
  },
  {
    id: 'sub-wb-geography',
    name: 'West Bengal Geography',
    slug: 'west-bengal-geography',
    category: 'Social Science',
    topicsCount: 12,
    topicTestsCount: 16,
    totalQuestionsCount: 1450,
    totalQuestionsFormatted: '1,450',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 18,
    iconName: 'Globe',
    createdByName: 'Admin',
    createdAtFormatted: '07 Sep 2026, 11:20 AM',
    updatedAtFormatted: '08 Sep 2026, 02:10 PM',
    avgScoreFormatted: '69%',
    completionRateFormatted: '74%',
    description: 'পশ্চিমবঙ্গের জেলাভিত্তিক ভূগোল, ভূপ্রকৃতি, নদনদী ও অর্থনীতি।',
  },
  {
    id: 'sub-child-development',
    name: 'Child Development & Pedagogy',
    slug: 'child-development-pedagogy',
    category: 'General',
    topicsCount: 14,
    topicTestsCount: 18,
    totalQuestionsCount: 1780,
    totalQuestionsFormatted: '1,780',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 19,
    iconName: 'BookOpen',
    createdByName: 'Admin',
    createdAtFormatted: '08 Sep 2026, 01:30 PM',
    updatedAtFormatted: '09 Sep 2026, 03:20 PM',
    avgScoreFormatted: '65%',
    completionRateFormatted: '71%',
    description: 'শিশু বিকাশ ও শিক্ষাবিজ্ঞান সংক্রান্ত স্পেশাল টেট পরীক্ষার মক।',
  },
  {
    id: 'sub-static-gk',
    name: 'Static GK & Culture',
    slug: 'static-gk-culture',
    category: 'General',
    topicsCount: 18,
    topicTestsCount: 24,
    totalQuestionsCount: 2210,
    totalQuestionsFormatted: '2,210',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 20,
    iconName: 'Lightbulb',
    createdByName: 'Admin',
    createdAtFormatted: '09 Sep 2026, 10:15 AM',
    updatedAtFormatted: '10 Sep 2026, 01:00 PM',
    avgScoreFormatted: '67%',
    completionRateFormatted: '73%',
    description: 'ভারতের নৃত্য, উৎসব, জাতীয় উদ্যান, স্মৃতিস্তম্ভ ও গুরুত্বপূর্ণ দিন।',
  },
  // Page 3 Subjects (21 to 24)
  {
    id: 'sub-disaster-management',
    name: 'Disaster Management',
    slug: 'disaster-management',
    category: 'Social Science',
    topicsCount: 8,
    topicTestsCount: 10,
    totalQuestionsCount: 890,
    totalQuestionsFormatted: '890',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 21,
    iconName: 'Globe',
    createdByName: 'Admin',
    createdAtFormatted: '10 Sep 2026, 11:30 AM',
    updatedAtFormatted: '11 Sep 2026, 02:40 PM',
    avgScoreFormatted: '64%',
    completionRateFormatted: '69%',
    description: 'প্রাকৃতিক ও মানবসৃষ্ট দুর্যোগ ব্যবস্থাপনা ও উদ্ধারকাজ কৌশল।',
  },
  {
    id: 'sub-indian-art-heritage',
    name: 'Indian Art & Heritage',
    slug: 'indian-art-heritage',
    category: 'Social Science',
    topicsCount: 10,
    topicTestsCount: 12,
    totalQuestionsCount: 1100,
    totalQuestionsFormatted: '1,100',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 22,
    iconName: 'Landmark',
    createdByName: 'Admin',
    createdAtFormatted: '11 Sep 2026, 03:00 PM',
    updatedAtFormatted: '12 Sep 2026, 05:15 PM',
    avgScoreFormatted: '66%',
    completionRateFormatted: '72%',
    description: 'ভারতের স্থাপত্য, ভাস্কর্য, চিত্রশিল্প এবং সাংস্কৃতিক ঐতিহ্য।',
  },
  {
    id: 'sub-quantitative-aptitude-adv',
    name: 'Quantitative Aptitude Advanced',
    slug: 'quantitative-aptitude-advanced',
    category: 'Aptitude',
    topicsCount: 16,
    topicTestsCount: 20,
    totalQuestionsCount: 1950,
    totalQuestionsFormatted: '1,950',
    statusLabel: 'Published',
    isActive: true,
    orderIndex: 23,
    iconName: 'Calculator',
    createdByName: 'Admin',
    createdAtFormatted: '12 Sep 2026, 09:40 AM',
    updatedAtFormatted: '13 Sep 2026, 11:50 AM',
    avgScoreFormatted: '62%',
    completionRateFormatted: '68%',
    description: 'উচ্চতর গণিত, সম্ভাবনা, বিন্যাস ও সমাবেশ এবং ডাটা ইন্টারপ্রিটেশন।',
  },
  {
    id: 'sub-logical-puzzles',
    name: 'Logical Deduction & Puzzles',
    slug: 'logical-deduction-puzzles',
    category: 'Aptitude',
    topicsCount: 12,
    topicTestsCount: 14,
    totalQuestionsCount: 1420,
    totalQuestionsFormatted: '1,420',
    statusLabel: 'Draft',
    isActive: false,
    orderIndex: 24,
    iconName: 'Brain',
    createdByName: 'Admin',
    createdAtFormatted: '13 Sep 2026, 02:20 PM',
    updatedAtFormatted: '14 Sep 2026, 06:00 PM',
    avgScoreFormatted: '59%',
    completionRateFormatted: '63%',
    description: 'সিটিং অ্যারেঞ্জমেন্ট, পাজল এবং জটিল যুক্তিভিত্তিক সমস্যার সমাধান।',
  },
];

export const AdminSubjects: React.FC = () => {
  // Data States
  const [subjectsList, setSubjectsList] = useState<EnrichedSubjectRow[]>(CANONICAL_SUBJECTS_PRESET);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Selected Subject & Side Panel (Row 1 selected by default matching screenshot)
  const [selectedSubject, setSelectedSubject] = useState<EnrichedSubjectRow | null>(CANONICAL_SUBJECTS_PRESET[0]);
  const [showDetailsPanel, setShowDetailsPanel] = useState<boolean>(true);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'topics' | 'topic_tests'>('overview');

  // Row selection checkboxes (Row 1 checked by default matching screenshot)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set([CANONICAL_SUBJECTS_PRESET[0].id]));

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

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<EnrichedSubjectRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<'General' | 'Social Science' | 'Aptitude'>('General');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Import Modal & Order Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Load Data and merge with database
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rawSubs, rawChapters, rawTests] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getAllAdminChapters().catch(() => []),
        api.getAllAdminTests().catch(() => []),
      ]);

      setChapters(rawChapters || []);
      setTests(rawTests || []);

      const merged = [...CANONICAL_SUBJECTS_PRESET];
      if (rawSubs && rawSubs.length > 0) {
        rawSubs.forEach((dbSub) => {
          const idx = merged.findIndex(
            (s) => s.id === dbSub.id || s.slug === dbSub.slug || s.name.toLowerCase() === dbSub.name.toLowerCase()
          );
          if (idx !== -1) {
            merged[idx] = {
              ...merged[idx],
              ...dbSub,
              isActive: dbSub.isActive ?? true,
              statusLabel: dbSub.isActive ? 'Published' : 'Draft',
            };
          } else {
            merged.push({
              ...dbSub,
              category: 'General',
              topicsCount: dbSub.chaptersCount || 10,
              topicTestsCount: 15,
              totalQuestionsCount: 1200,
              totalQuestionsFormatted: '1,200',
              statusLabel: dbSub.isActive ? 'Published' : 'Draft',
              createdByName: 'Admin',
              createdAtFormatted: '10 Aug 2026, 10:00 AM',
              updatedAtFormatted: '12 Sep 2026, 03:00 PM',
              avgScoreFormatted: '68%',
              completionRateFormatted: '72%',
              description: dbSub.description || 'General Subject syllabus & questions.',
            });
          }
        });
      }

      setSubjectsList(merged);
      if (!selectedSubject && merged.length > 0) {
        setSelectedSubject(merged[0]);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss notification
  useEffect(() => {
    if (!actionSuccessMessage) return;
    const timer = setTimeout(() => setActionSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [actionSuccessMessage]);

  // Filter handlers
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

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjectsList.filter((s) => {
      const q = appliedFilters.search.toLowerCase().trim();
      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchCat = s.category.toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }

      if (appliedFilters.category !== 'all') {
        if (s.category.toLowerCase() !== appliedFilters.category.toLowerCase()) return false;
      }

      if (appliedFilters.status !== 'all') {
        if (appliedFilters.status === 'published' && (!s.isActive || s.statusLabel === 'Draft')) return false;
        if (appliedFilters.status === 'draft' && (s.isActive && s.statusLabel === 'Published')) return false;
      }

      return true;
    });
  }, [subjectsList, appliedFilters]);

  // Pagination calculation
  const totalItems = filteredSubjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedSubjects = filteredSubjects.slice(startIndex, endIndex);

  // Row selection
  const toggleSelectAll = () => {
    if (selectedSubjectIds.size === pagedSubjects.length) {
      setSelectedSubjectIds(new Set());
    } else {
      setSelectedSubjectIds(new Set(pagedSubjects.map((s) => s.id)));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectSubjectRow = (sub: EnrichedSubjectRow) => {
    setSelectedSubject(sub);
    setShowDetailsPanel(true);
    setSelectedSubjectIds(new Set([sub.id]));
  };

  // Create / Edit modal handlers
  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setFormName('');
    setFormSlug('');
    setFormCategory('General');
    setFormDescription('');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub: EnrichedSubjectRow) => {
    setEditingSubject(sub);
    setFormName(sub.name);
    setFormSlug(sub.slug);
    setFormCategory(sub.category as 'General' | 'Social Science' | 'Aptitude');
    setFormDescription(sub.description || '');
    setFormIsActive(sub.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Subject name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');

      const cleanSlug =
        formSlug.trim() ||
        formName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          name: formName.trim(),
          slug: cleanSlug,
          description: formDescription.trim(),
          isActive: formIsActive,
        });

        const updated: EnrichedSubjectRow = {
          ...editingSubject,
          name: formName.trim(),
          slug: cleanSlug,
          category: formCategory,
          description: formDescription.trim(),
          isActive: formIsActive,
          statusLabel: formIsActive ? 'Published' : 'Draft',
          updatedAtFormatted: 'Just now',
        };

        setSubjectsList((prev) => prev.map((s) => (s.id === editingSubject.id ? updated : s)));
        if (selectedSubject?.id === editingSubject.id) {
          setSelectedSubject(updated);
        }
        setActionSuccessMessage(`Subject "${formName.trim()}" updated successfully.`);
      } else {
        const created = await api.createSubject({
          name: formName.trim(),
          slug: cleanSlug,
          description: formDescription.trim(),
          orderIndex: subjectsList.length + 1,
          isActive: formIsActive,
          iconName: 'BookOpen',
        });

        const newRow: EnrichedSubjectRow = {
          ...created,
          category: formCategory,
          topicsCount: 12,
          topicTestsCount: 16,
          totalQuestionsCount: 1400,
          totalQuestionsFormatted: '1,400',
          statusLabel: formIsActive ? 'Published' : 'Draft',
          createdByName: 'Admin',
          createdAtFormatted: 'Today',
          updatedAtFormatted: 'Today',
          avgScoreFormatted: '68%',
          completionRateFormatted: '72%',
        };

        setSubjectsList((prev) => [newRow, ...prev]);
        setSelectedSubject(newRow);
        setShowDetailsPanel(true);
        setActionSuccessMessage(`Subject "${formName.trim()}" created successfully.`);
      }

      setIsModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save subject'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subId: string) => {
    try {
      await api.deleteSubject(subId);
      setSubjectsList((prev) => prev.filter((s) => s.id !== subId));
      if (selectedSubject?.id === subId) {
        setSelectedSubject(subjectsList.find((s) => s.id !== subId) || null);
      }
      setActionSuccessMessage('Subject deleted successfully.');
    } catch (err) {
      alert('Failed to delete subject: ' + getErrorMessage(err, 'Delete failed'));
    }
  };

  const handleDuplicateSubject = (sub: EnrichedSubjectRow) => {
    const duplicated: EnrichedSubjectRow = {
      ...sub,
      id: `${sub.id}-copy-${Date.now()}`,
      name: `${sub.name} (Copy)`,
      slug: `${sub.slug}-copy`,
      statusLabel: 'Draft',
      isActive: false,
    };
    setSubjectsList((prev) => [duplicated, ...prev]);
    setSelectedSubject(duplicated);
    setShowDetailsPanel(true);
    setActionSuccessMessage(`Subject "${sub.name}" duplicated as draft.`);
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-200">
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
            Subjects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage subjects. Add topics under each subject for topic tests.
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
            Import Subjects
          </button>

          <button
            type="button"
            onClick={() => setIsOrderModalOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowUpDown className="w-4 h-4 text-[#026BFC]" />
            Subject Order
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Subject
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards in Single Row matching screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Subjects */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Subjects
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {subjectsList.length || 24}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 14%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs last month</p>
          </div>
        </div>

        {/* Card 2: Total Topics */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/50 text-[#10B981] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Topics
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {chapters.length || 186}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 22%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Topic Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEF8E7] dark:bg-amber-950/50 text-[#F59E0B] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Topic Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {tests.filter((t) => t.testType === 'topic').length || 120}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 28%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Tests Taken */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] dark:bg-purple-950/50 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Tests Taken
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                1,24,860
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 36%
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Avg. Accuracy */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-[#FEECEC] dark:bg-rose-950/50 text-[#EF4444] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Avg. Accuracy
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                68%
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 5%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search subjects... */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
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
            <option value="General">General</option>
            <option value="Social Science">Social Science</option>
            <option value="Aptitude">Aptitude</option>
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
            className="text-[#026BFC] hover:underline font-semibold text-xs px-2.5 py-1.5 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. Main Split-Screen Container: Table on Left + Subject Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left Column: Table Container */}
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
                        checked={selectedSubjectIds.size > 0 && selectedSubjectIds.size === pagedSubjects.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Subject Name</th>
                    <th className="py-3 px-2.5 w-28">Category</th>
                    <th className="py-3 px-2 text-center w-20">Topics</th>
                    <th className="py-3 px-2 text-center w-24">Topic Tests</th>
                    <th className="py-3 px-3 text-center w-28">Total Questions</th>
                    <th className="py-3 px-2.5 text-center w-24">Status</th>
                    <th className="py-3 px-2.5 text-center w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pagedSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No subjects found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    pagedSubjects.map((s, index) => {
                      const rowNumber = startIndex + index + 1;
                      const isSelected = selectedSubject?.id === s.id;
                      const isChecked = selectedSubjectIds.has(s.id);
                      const isPublished = s.statusLabel === 'Published';

                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleSelectSubjectRow(s)}
                          className={cn(
                            'transition-colors cursor-pointer group',
                            isSelected
                              ? 'bg-blue-50/40 dark:bg-blue-950/20 outline outline-1 outline-[#026BFC] -outline-offset-1'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3 text-center" onClick={(evt) => evt.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(evt) => toggleSelectRow(s.id, evt as unknown as React.MouseEvent)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                          </td>

                          {/* Row Index */}
                          <td className={cn('py-3.5 px-2 text-center font-medium', isSelected ? 'text-[#026BFC] font-bold' : 'text-slate-400')}>
                            {rowNumber}
                          </td>

                          {/* Subject Name: Icon + Name */}
                          <td className="py-3.5 px-3 min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <SubjectIconBadge name={s.name} iconName={s.iconName} className="w-8 h-8 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                                {s.name}
                              </span>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-2.5">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap',
                                s.category === 'Social Science'
                                  ? 'bg-[#E8F8F0] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : s.category === 'Aptitude'
                                  ? 'bg-[#F6EEFD] text-[#8B5CF6] dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300'
                              )}
                            >
                              {s.category}
                            </span>
                          </td>

                          {/* Topics Count (Blue text) */}
                          <td className="py-3.5 px-2 text-center text-[#026BFC] font-semibold">
                            {s.topicsCount}
                          </td>

                          {/* Topic Tests Count (Blue text) */}
                          <td className="py-3.5 px-2 text-center text-[#026BFC] font-semibold">
                            {s.topicTestsCount}
                          </td>

                          {/* Total Questions */}
                          <td className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                            {s.totalQuestionsFormatted || s.totalQuestionsCount.toLocaleString('en-IN')}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-2.5 text-center">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-medium inline-block',
                                isPublished
                                  ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-[#FEF8E7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300'
                              )}
                            >
                              {s.statusLabel}
                            </span>
                          </td>

                          {/* Actions Menu */}
                          <td
                            className="py-3.5 px-2.5 text-center relative"
                            onClick={(evt) => evt.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(openActionMenuId === s.id ? null : s.id)
                              }
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </button>

                            {openActionMenuId === s.id && (
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
                                      handleSelectSubjectRow(s);
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
                                      handleOpenEditModal(s);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                    Edit Subject
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDuplicateSubject(s);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                    Duplicate Subject
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      if (confirm(`Permanently delete subject "${s.name}"? This cannot be undone.`)) {
                                        handleDeleteSubject(s.id);
                                      }
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Subject
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
                Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} subjects
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

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActivePage = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          'w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors',
                          isActivePage
                            ? 'bg-[#026BFC] text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p - 1)}
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

        {/* Right Column: Subject Details Card (Side-by-side with Table) */}
        {showDetailsPanel && selectedSubject && (
          <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5 animate-in fade-in-50 duration-200">
            {/* Header: Subject Details & Close X */}
            <div className="flex items-center justify-between pb-0.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Subject Details
              </h2>
              <button
                type="button"
                onClick={() => setShowDetailsPanel(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subject Summary Banner: Icon + Title + Badges + Edit */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <SubjectIconBadge
                  name={selectedSubject.name}
                  iconName={selectedSubject.iconName}
                  className="w-12 h-12 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {selectedSubject.name}
                  </h3>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                      selectedSubject.statusLabel === 'Published'
                        ? 'bg-[#E8F8F0] text-[#10B981] border border-[#A7F3D0]/60'
                        : 'bg-[#FEF8E7] text-[#D97706] border border-[#FDE68A]/60'
                    )}
                  >
                    {selectedSubject.statusLabel}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedSubject)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shrink-0 shadow-2xs transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#026BFC]" />
                Edit
              </button>
            </div>

            {/* Horizontal Tabs: Overview, Topics (18), Topic Tests (42) */}
            <div className="flex items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
              {(
                [
                  { key: 'overview', label: 'Overview' },
                  { key: 'topics', label: `Topics (${selectedSubject.topicsCount})` },
                  { key: 'topic_tests', label: `Topic Tests (${selectedSubject.topicTestsCount})` },
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
                <div className="grid grid-cols-3 gap-2">
                  {/* 1. Topics */}
                  <div className="p-2.5 rounded-xl bg-[#E8F8F0] dark:bg-emerald-950/30 border border-[#D1FAE5] dark:border-emerald-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedSubject.topicsCount}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">Topics</span>
                    </div>
                  </div>

                  {/* 2. Topic Tests */}
                  <div className="p-2.5 rounded-xl bg-[#EBF3FF] dark:bg-blue-950/30 border border-[#DBEAFE] dark:border-blue-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedSubject.topicTestsCount}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">Topic Tests</span>
                    </div>
                  </div>

                  {/* 3. Questions */}
                  <div className="p-2.5 rounded-xl bg-[#FEECEC] dark:bg-rose-950/30 border border-[#FFE4E6] dark:border-rose-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FCD4D4] text-[#EF4444] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedSubject.totalQuestionsFormatted}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">Questions</span>
                    </div>
                  </div>

                  {/* 4. Total Attempts */}
                  <div className="p-2.5 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 border border-[#F3E8FF] dark:border-purple-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        1,24,860
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">Total Attempts</span>
                    </div>
                  </div>

                  {/* 5. Avg. Score */}
                  <div className="p-2.5 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 border border-[#FEF3C7] dark:border-amber-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedSubject.avgScoreFormatted || '68%'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">Avg. Score</span>
                    </div>
                  </div>

                  {/* 6. Completion Rate */}
                  <div className="p-2.5 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 border border-[#D1FAE5] dark:border-emerald-900/40 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedSubject.completionRateFormatted || '72%'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">Completion Rate</span>
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
                      onClick={() => handleOpenEditModal(selectedSubject)}
                      className="text-xs font-semibold text-[#026BFC] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-[#026BFC]" />
                      Edit
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {selectedSubject.description ||
                      'General Science বিষয়টি ভৌত বিজ্ঞান, রসায়ন বিজ্ঞান, জীব বিজ্ঞান, পরিবেশ বিজ্ঞান এবং দৈনন্দিন জীবনের বিজ্ঞান সম্পর্কিত গুরুত্বপূর্ণ টপিক নিয়ে তৈরি। এটি বিভিন্ন সরকারি পরীক্ষার জন্য অত্যন্ত গুরুত্বপূর্ণ একটি বিষয়।'}
                  </div>
                </div>

                {/* Subject Information Key-Value Table matching screenshot */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Subject Information
                  </span>

                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-slate-400 font-medium">Subject Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.name}
                    </span>

                    <span className="text-slate-400 font-medium">Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.category}
                    </span>

                    <span className="text-slate-400 font-medium">Total Topics</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.topicsCount}
                    </span>

                    <span className="text-slate-400 font-medium">Total Topic Tests</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.topicTestsCount}
                    </span>

                    <span className="text-slate-400 font-medium">Total Questions</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.totalQuestionsFormatted}
                    </span>

                    <span className="text-slate-400 font-medium">Created By</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.createdByName || 'Admin'}
                    </span>

                    <span className="text-slate-400 font-medium">Created At</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.createdAtFormatted || '12 Aug 2026, 11:20 AM'}
                    </span>

                    <span className="text-slate-400 font-medium">Last Updated</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedSubject.updatedAtFormatted || '14 Sep 2026, 04:15 PM'}
                    </span>

                    <span className="text-slate-400 font-medium">Status</span>
                    <span
                      className={cn(
                        'font-semibold text-right',
                        selectedSubject.statusLabel === 'Published'
                          ? 'text-[#10B981]'
                          : 'text-[#D97706]'
                      )}
                    >
                      {selectedSubject.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Bottom 2 Action Buttons matching screenshot */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${selectedSubject.name}"?`)) {
                        handleDeleteSubject(selectedSubject.id);
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Subject
                  </button>

                  <a
                    href={`/practice?subject=${selectedSubject.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#BFDBFE] bg-white text-[#026BFC] hover:bg-blue-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#026BFC]" />
                    View on Website
                  </a>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TOPICS */}
            {detailsTab === 'topics' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Topics ({selectedSubject.topicsCount})
                  </span>
                  <a
                    href="/admin/topics"
                    className="text-xs text-[#026BFC] hover:underline font-semibold"
                  >
                    Manage Topics
                  </a>
                </div>
                <p className="text-[11px] text-slate-500">
                  Topics under {selectedSubject.name} used in Topic Practice & Chapter Tests:
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {[
                    'Heat & Temperature',
                    'Optics & Light',
                    'Mechanics & Motion',
                    'Electricity & Magnetism',
                    'Sound & Waves',
                    'Atomic Structure & Bonding',
                    'Acids, Bases & Salts',
                    'Metals & Non-metals',
                    'Cell Biology & Genetics',
                    'Human Physiology & Organ Systems',
                    'Plant Physiology & Botany',
                    'Ecology & Biodiversity',
                    'Nutrition & Vitamins',
                    'Common Diseases & Immunity',
                    'Pollution & Climate Science',
                    'Space & Astronomy',
                    'Nuclear Physics & Energy',
                    'Scientific Inventions & Discoveries',
                  ].slice(0, selectedSubject.topicsCount).map((topic, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {topic}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">120 Qs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: TOPIC TESTS */}
            {detailsTab === 'topic_tests' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Topic Tests ({selectedSubject.topicTestsCount})
                  </span>
                  <a
                    href="/admin/mock-tests"
                    className="text-xs text-[#026BFC] hover:underline font-semibold"
                  >
                    View in Mock Tests
                  </a>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {[
                    { id: 'tt-1', title: `${selectedSubject.name} — Heat & Temp Test 01`, questions: 30, duration: '25 min' },
                    { id: 'tt-2', title: `${selectedSubject.name} — Optics Test 01`, questions: 30, duration: '25 min' },
                    { id: 'tt-3', title: `${selectedSubject.name} — Mechanics Test 01`, questions: 30, duration: '25 min' },
                    { id: 'tt-4', title: `${selectedSubject.name} — Human Physiology Test 01`, questions: 30, duration: '25 min' },
                    { id: 'tt-5', title: `${selectedSubject.name} — Nutrition & Vitamins Test 01`, questions: 30, duration: '25 min' },
                  ].map((tt) => (
                    <div
                      key={tt.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                        {tt.title}
                      </span>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{tt.questions} Questions</span>
                        <span>{tt.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Import Subjects Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#026BFC]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Import Subjects
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload a CSV or JSON file containing subject titles, categories, and descriptions to bulk import into PracticeKoro.
            </p>

            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center space-y-2">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Drag and drop your file here, or browse
              </p>
              <p className="text-[11px] text-slate-400">Supports .csv, .json (max 5MB)</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => alert('Sample template downloaded.')}
                className="text-xs text-[#026BFC] hover:underline font-semibold"
              >
                Download CSV Template
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setActionSuccessMessage('Subjects imported successfully.');
                  }}
                  className="bg-[#026BFC] text-white text-xs"
                >
                  Import File
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Subject Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-[#026BFC]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Subject Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Adjust the display order of subjects shown in the Practice Hub and Student App.
            </p>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {subjectsList.slice(0, 10).map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      #{idx + 1} {sub.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{sub.category}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setActionSuccessMessage('Subject display order saved.');
                }}
                className="bg-[#026BFC] text-white text-xs"
              >
                Save Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingSubject ? `Edit Subject — ${editingSubject.name}` : 'Create Subject'}
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

            <form onSubmit={handleSaveSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Science"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingSubject) {
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
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as 'General' | 'Social Science' | 'Aptitude')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                  >
                    <option value="General">General</option>
                    <option value="Social Science">Social Science</option>
                    <option value="Aptitude">Aptitude</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. general-science"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed description of the subject and topics covered..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActiveSub"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="formIsActiveSub" className="font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
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
                  {isSaving ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
