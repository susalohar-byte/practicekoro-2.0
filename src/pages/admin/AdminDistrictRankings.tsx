import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Users,
  FileText,
  Target,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Info,
  UserCheck,
  Zap,
  Award,
  X,
  Crown,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

// ============================================================================
// DATA MODELS & PRESETS
// ============================================================================

export interface DistrictRankData {
  rank: number;
  name: string;
  landmarkImg: string;
  totalStudents: number;
  testsAttempted: number;
  avgScore: number;
  topScore: number;
  activeStudents: number;
  top100Count: number;
  colorClass: string;
  topStudents: {
    rank: number;
    name: string;
    avatar: string;
    testsAttempted: number;
    avgScore: number;
    bestScore: number;
    lastActive: string;
  }[];
}

// 23 Districts of West Bengal with realistic performance metrics
const INITIAL_DISTRICTS: DistrictRankData[] = [
  {
    rank: 1,
    name: 'Purulia',
    landmarkImg:
      'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=120&auto=format&fit=crop&q=80',
    totalStudents: 1240,
    testsAttempted: 28560,
    avgScore: 78,
    topScore: 98,
    activeStudents: 860,
    top100Count: 5,
    colorClass: 'bg-emerald-100 text-emerald-800',
    topStudents: [
      {
        rank: 1,
        name: 'Rohit Kumar',
        avatar: '/images/leaderboard_rohit.jpg',
        testsAttempted: 48,
        avgScore: 92,
        bestScore: 98,
        lastActive: '2 hours ago',
      },
      {
        rank: 2,
        name: 'Pritam Mahato',
        avatar: '/images/avatar_arindam.jpg',
        testsAttempted: 42,
        avgScore: 88,
        bestScore: 96,
        lastActive: '5 hours ago',
      },
      {
        rank: 3,
        name: 'Sneha Khatun',
        avatar: '/images/avatar_sneha.jpg',
        testsAttempted: 38,
        avgScore: 84,
        bestScore: 94,
        lastActive: '1 day ago',
      },
    ],
  },
  {
    rank: 2,
    name: 'Bardhaman',
    landmarkImg:
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=120&auto=format&fit=crop&q=80',
    totalStudents: 1120,
    testsAttempted: 25430,
    avgScore: 76,
    topScore: 96,
    activeStudents: 780,
    top100Count: 4,
    colorClass: 'bg-emerald-100 text-emerald-800',
    topStudents: [
      {
        rank: 1,
        name: 'Debasish Ghosh',
        avatar: '/images/avatar_koushik.jpg',
        testsAttempted: 45,
        avgScore: 90,
        bestScore: 96,
        lastActive: '3 hours ago',
      },
      {
        rank: 2,
        name: 'Riya Mukherjee',
        avatar: '/images/avatar_tania.jpg',
        testsAttempted: 40,
        avgScore: 87,
        bestScore: 95,
        lastActive: '6 hours ago',
      },
      {
        rank: 3,
        name: 'Sandip Roy',
        avatar: '/images/performer_suman.png',
        testsAttempted: 36,
        avgScore: 83,
        bestScore: 92,
        lastActive: '1 day ago',
      },
    ],
  },
  {
    rank: 3,
    name: 'Paschim Medinipur',
    landmarkImg:
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=120&auto=format&fit=crop&q=80',
    totalStudents: 980,
    testsAttempted: 22140,
    avgScore: 74,
    topScore: 95,
    activeStudents: 690,
    top100Count: 4,
    colorClass: 'bg-emerald-100 text-emerald-800',
    topStudents: [
      {
        rank: 1,
        name: 'Subhankar Pal',
        avatar: '/images/avatar_abhishek.jpg',
        testsAttempted: 42,
        avgScore: 87,
        bestScore: 95,
        lastActive: '1 day ago',
      },
      {
        rank: 2,
        name: 'Tanmoy Adhikary',
        avatar: '/images/avatar_sayon.jpg',
        testsAttempted: 39,
        avgScore: 85,
        bestScore: 94,
        lastActive: '1 day ago',
      },
      {
        rank: 3,
        name: 'Anushree Paul',
        avatar: '/images/avatar_tania.jpg',
        testsAttempted: 35,
        avgScore: 82,
        bestScore: 91,
        lastActive: '2 days ago',
      },
    ],
  },
  {
    rank: 4,
    name: 'Nadia',
    landmarkImg:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=120&auto=format&fit=crop&q=80',
    totalStudents: 860,
    testsAttempted: 20320,
    avgScore: 72,
    topScore: 92,
    activeStudents: 620,
    top100Count: 3,
    colorClass: 'bg-amber-100 text-amber-800',
    topStudents: [
      {
        rank: 1,
        name: 'Arijit Mondal',
        avatar: '/images/avatar_arindam.jpg',
        testsAttempted: 38,
        avgScore: 84,
        bestScore: 92,
        lastActive: '1 day ago',
      },
      {
        rank: 2,
        name: 'Moumita Banerjee',
        avatar: '/images/avatar_mousumi.jpg',
        testsAttempted: 35,
        avgScore: 81,
        bestScore: 90,
        lastActive: '2 days ago',
      },
      {
        rank: 3,
        name: 'Koushik Biswas',
        avatar: '/images/avatar_koushik.jpg',
        testsAttempted: 33,
        avgScore: 79,
        bestScore: 89,
        lastActive: '3 days ago',
      },
    ],
  },
  {
    rank: 5,
    name: 'North 24 Parganas',
    landmarkImg:
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=120&auto=format&fit=crop&q=80',
    totalStudents: 820,
    testsAttempted: 18950,
    avgScore: 70,
    topScore: 90,
    activeStudents: 580,
    top100Count: 3,
    colorClass: 'bg-amber-100 text-amber-800',
    topStudents: [
      {
        rank: 1,
        name: 'Rohan Das',
        avatar: '/images/leaderboard_rohit.jpg',
        testsAttempted: 44,
        avgScore: 86,
        bestScore: 90,
        lastActive: '4 hours ago',
      },
      {
        rank: 2,
        name: 'Priyanka Dey',
        avatar: '/images/avatar_sneha.jpg',
        testsAttempted: 37,
        avgScore: 82,
        bestScore: 88,
        lastActive: '1 day ago',
      },
      {
        rank: 3,
        name: 'Soumen Ghosh',
        avatar: '/images/performer_suman.png',
        testsAttempted: 34,
        avgScore: 79,
        bestScore: 86,
        lastActive: '2 days ago',
      },
    ],
  },
  {
    rank: 6,
    name: 'South 24 Parganas',
    landmarkImg:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&auto=format&fit=crop&q=80',
    totalStudents: 780,
    testsAttempted: 17480,
    avgScore: 68,
    topScore: 88,
    activeStudents: 540,
    top100Count: 2,
    colorClass: 'bg-amber-100 text-amber-800',
    topStudents: [
      {
        rank: 1,
        name: 'Suman Das',
        avatar: '/images/performer_suman.png',
        testsAttempted: 36,
        avgScore: 81,
        bestScore: 88,
        lastActive: '4 days ago',
      },
      {
        rank: 2,
        name: 'Priya Mondal',
        avatar: '/images/avatar_tania.jpg',
        testsAttempted: 33,
        avgScore: 78,
        bestScore: 86,
        lastActive: '2 days ago',
      },
      {
        rank: 3,
        name: 'Bappaditya Naskar',
        avatar: '/images/avatar_abhishek.jpg',
        testsAttempted: 30,
        avgScore: 75,
        bestScore: 84,
        lastActive: '3 days ago',
      },
    ],
  },
  {
    rank: 7,
    name: 'Howrah',
    landmarkImg:
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=120&auto=format&fit=crop&q=80',
    totalStudents: 720,
    testsAttempted: 16240,
    avgScore: 66,
    topScore: 86,
    activeStudents: 510,
    top100Count: 2,
    colorClass: 'bg-amber-100 text-amber-800',
    topStudents: [
      {
        rank: 1,
        name: 'Moumita Sarkar',
        avatar: '/images/avatar_mousumi.jpg',
        testsAttempted: 36,
        avgScore: 82,
        bestScore: 86,
        lastActive: '2 days ago',
      },
      {
        rank: 2,
        name: 'Sambit Roy',
        avatar: '/images/avatar_koushik.jpg',
        testsAttempted: 32,
        avgScore: 77,
        bestScore: 84,
        lastActive: '3 days ago',
      },
      {
        rank: 3,
        name: 'Avik Sen',
        avatar: '/images/avatar_sayon.jpg',
        testsAttempted: 29,
        avgScore: 73,
        bestScore: 82,
        lastActive: '4 days ago',
      },
    ],
  },
  {
    rank: 8,
    name: 'Hooghly',
    landmarkImg:
      'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=120&auto=format&fit=crop&q=80',
    totalStudents: 680,
    testsAttempted: 15730,
    avgScore: 64,
    topScore: 84,
    activeStudents: 480,
    top100Count: 2,
    colorClass: 'bg-orange-100 text-orange-800',
    topStudents: [
      {
        rank: 1,
        name: 'Abhijit Dey',
        avatar: '/images/leaderboard_rohit.jpg',
        testsAttempted: 28,
        avgScore: 72,
        bestScore: 84,
        lastActive: '4 days ago',
      },
      {
        rank: 2,
        name: 'Swati Mukherjee',
        avatar: '/images/avatar_sneha.jpg',
        testsAttempted: 26,
        avgScore: 70,
        bestScore: 82,
        lastActive: '5 days ago',
      },
      {
        rank: 3,
        name: 'Dipankar Das',
        avatar: '/images/avatar_arindam.jpg',
        testsAttempted: 25,
        avgScore: 68,
        bestScore: 80,
        lastActive: '5 days ago',
      },
    ],
  },
  {
    rank: 9,
    name: 'Bankura',
    landmarkImg:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=120&auto=format&fit=crop&q=80',
    totalStudents: 640,
    testsAttempted: 14980,
    avgScore: 62,
    topScore: 82,
    activeStudents: 450,
    top100Count: 1,
    colorClass: 'bg-orange-100 text-orange-800',
    topStudents: [
      {
        rank: 1,
        name: 'Puja Roy',
        avatar: '/images/avatar_tania.jpg',
        testsAttempted: 30,
        avgScore: 74,
        bestScore: 82,
        lastActive: '3 days ago',
      },
      {
        rank: 2,
        name: 'Sourav Karmakar',
        avatar: '/images/performer_suman.png',
        testsAttempted: 27,
        avgScore: 69,
        bestScore: 80,
        lastActive: '4 days ago',
      },
      {
        rank: 3,
        name: 'Subhajit Gorai',
        avatar: '/images/avatar_koushik.jpg',
        testsAttempted: 24,
        avgScore: 66,
        bestScore: 78,
        lastActive: '5 days ago',
      },
    ],
  },
  {
    rank: 10,
    name: 'Birbhum',
    landmarkImg:
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=120&auto=format&fit=crop&q=80',
    totalStudents: 620,
    testsAttempted: 14560,
    avgScore: 60,
    topScore: 80,
    activeStudents: 420,
    top100Count: 1,
    colorClass: 'bg-orange-100 text-orange-800',
    topStudents: [
      {
        rank: 1,
        name: 'Rakesh Shaw',
        avatar: '/images/avatar_koushik.jpg',
        testsAttempted: 34,
        avgScore: 79,
        bestScore: 80,
        lastActive: '2 days ago',
      },
      {
        rank: 2,
        name: 'Tanmoy Sinha',
        avatar: '/images/avatar_abhishek.jpg',
        testsAttempted: 26,
        avgScore: 68,
        bestScore: 79,
        lastActive: '4 days ago',
      },
      {
        rank: 3,
        name: 'Barnali Das',
        avatar: '/images/avatar_mousumi.jpg',
        testsAttempted: 23,
        avgScore: 65,
        bestScore: 76,
        lastActive: '6 days ago',
      },
    ],
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminDistrictRankings: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [selectedExam, setSelectedExam] = useState('WBP Constable');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedTestType, setSelectedTestType] = useState('All Types');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All Districts');
  const [timePeriod, setTimePeriod] = useState('Last 30 Days');

  // Active district for details & map (Neutral initial state - closed by default)
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Live districts ranking state
  const [districtsList, setDistrictsList] = useState<DistrictRankData[]>(INITIAL_DISTRICTS);

  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    api
      .getAppLeaderboard('all_india')
      .then((data) => {
      if (!isMounted || !data || data.length === 0) return;
        const districtStats: Record<string, { count: number; totalPerc: number; maxPerc: number }> =
          {};
      data.forEach((r) => {
        if (r.district) {
          const dName = r.district;
          if (!districtStats[dName]) {
            districtStats[dName] = { count: 0, totalPerc: 0, maxPerc: 0 };
          }
          districtStats[dName].count += r.tests_count || 1;
          districtStats[dName].totalPerc += Number(r.average_percentage || 0);
            districtStats[dName].maxPerc = Math.max(
              districtStats[dName].maxPerc,
              Number(r.average_percentage || 0)
            );
        }
      });

      if (Object.keys(districtStats).length > 0) {
        setDistrictsList((prev) =>
          prev.map((d) => {
            const stat = districtStats[d.name];
            if (!stat) return d;
            const avg = Math.round(stat.totalPerc / Math.max(1, stat.count));
            return {
              ...d,
              testsAttempted: stat.count * 12,
              avgScore: avg || d.avgScore,
              topScore: Math.round(stat.maxPerc) || d.topScore,
            };
          })
        );
      }
      })
      .catch((err) => {
      console.warn('Failed to load district leaderboard from database:', err);
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Popover menus & Modals
  const [openActionRank, setOpenActionRank] = useState<number | null>(null);
  const [isTop5ModalOpen, setIsTop5ModalOpen] = useState(false);
  const [isAllStudentsModalOpen, setIsAllStudentsModalOpen] = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic summary metrics
  const totalStudentsCount = useMemo(() => {
    return districtsList.reduce((sum, d) => sum + (d.totalStudents || 0), 0);
  }, [districtsList]);

  const totalTestsAttempted = useMemo(() => {
    return districtsList.reduce((sum, d) => sum + (d.testsAttempted || 0), 0);
  }, [districtsList]);

  const averageAccuracy = useMemo(() => {
    if (districtsList.length === 0) return 0;
    const sum = districtsList.reduce((acc, d) => acc + (d.avgScore || 0), 0);
    return Math.round(sum / districtsList.length);
  }, [districtsList]);

  const activeDistrictsCount = useMemo(() => {
    return districtsList.filter((d) => (d.testsAttempted || 0) > 0 || (d.activeStudents || 0) > 0)
      .length;
  }, [districtsList]);

  // Active district resolved
  const activeDistrict = useMemo(() => {
    if (!selectedDistrictName) return null;
    return districtsList.find((d) => d.name === selectedDistrictName) || null;
  }, [districtsList, selectedDistrictName]);

  // Outside click for row actions popover
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionRank(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    return districtsList.filter((d) => {
      if (selectedDistrictFilter !== 'All Districts' && d.name !== selectedDistrictFilter) {
        return false;
      }
      return true;
    });
  }, [districtsList, selectedDistrictFilter]);

  // CSV Export feature
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'District',
      'Total Students',
      'Tests Attempted',
      'Avg. Score %',
      'Top Score %',
      'Active Students',
      'Top 100 Count',
    ];

    const rows = filteredDistricts.map((d) => [
      d.rank,
      `"${d.name}"`,
      d.totalStudents,
      d.testsAttempted,
      `${d.avgScore}%`,
      `${d.topScore}%`,
      d.activeStudents,
      d.top100Count,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `practicekoro_district_rankings_${selectedExam.replace(/\s+/g, '_')}_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedExam('WBP Constable');
    setSelectedSubject('All Subjects');
    setSelectedTestType('All Types');
    setSelectedDistrictFilter('All Districts');
    setTimePeriod('Last 30 Days');
    setCurrentPage(1);
  };

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">District Rankings</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            View district-wise performance of students across exams. Compare participation, accuracy
            and top performers.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Export District Rankings</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (5 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Districts */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Districts</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">23</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">West Bengal</p>
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Students</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalStudentsCount.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 26%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total enrolled aspirants</p>
          </div>
        </div>

        {/* Card 3: Tests Attempted */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Tests Attempted</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalTestsAttempted.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 32%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Avg. Accuracy */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Avg. Accuracy</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {averageAccuracy}%
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 8%
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Active Districts */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Active Districts</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {activeDistrictsCount}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">with test attempts</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR (Single clean card) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-end gap-3">
        {/* Select Exam */}
        <div className="w-[140px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Select Exam</label>
          <div className="relative">
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="WBP Constable">WBP Constable</option>
              <option value="KP SI">KP SI</option>
              <option value="WBCS">WBCS</option>
              <option value="Railways Group D">Railways Group D</option>
              <option value="SSC CGL">SSC CGL</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select Subject */}
        <div className="w-[140px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Select Subject
          </label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Subjects">All Subjects</option>
              <option value="General Science">General Science</option>
              <option value="General Knowledge">General Knowledge</option>
              <option value="Indian Polity">Indian Polity</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select Test Type */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Select Test Type
          </label>
          <div className="relative">
            <select
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Types">All Types</option>
              <option value="Full Mock">Full Mock</option>
              <option value="Topic Test">Topic Test</option>
              <option value="Official PYQ">Official PYQ</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select District */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Select District
          </label>
          <div className="relative">
            <select
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Districts">All Districts</option>
              {districtsList.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Time Period */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Time Period</label>
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="All Time">All Time</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2 rounded-xl shadow-xs transition-colors cursor-pointer h-[34px]"
          >
            Apply
          </button>
          <button
            onClick={handleResetFilters}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2 py-2 cursor-pointer h-[34px] flex items-center"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN SPLIT CONTENT: TABLE (LEFT) + RIGHT WIDGETS */}
      {/* ==================================================================== */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        {/* ==================== LEFT COLUMN: DISTRICT TABLE + TOP STUDENTS ==================== */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* Main District Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
                      #
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[170px]">
                      District
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
                      Total Students
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
                      Tests Attempted
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[80px]">
                      Avg. Score
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[80px]">
                      Top Score
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[95px]">
                      Active Students
                    </th>
                    <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center w-12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredDistricts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No district rankings found.
                      </td>
                    </tr>
                  ) : (
                    filteredDistricts.map((district) => {
                      const isSelected = Boolean(
                        isDetailsOpen && selectedDistrictName === district.name
                      );

                    return (
                      <tr
                        key={district.rank}
                        onClick={() => {
                          setSelectedDistrictName(district.name);
                          setIsDetailsOpen(true);
                        }}
                        className={cn(
                          'hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs',
                          isSelected && 'bg-[#EFF6FF]'
                        )}
                      >
                        {/* Rank Badge */}
                        <td className="py-3 px-3.5 text-center">
                          {district.rank === 1 && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-amber-300">
                              1
                            </div>
                          )}
                          {district.rank === 2 && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-300 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-slate-200">
                              2
                            </div>
                          )}
                          {district.rank === 3 && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-orange-300">
                              3
                            </div>
                          )}
                          {district.rank > 3 && (
                              <span className="font-bold text-[#64748B]">{district.rank}</span>
                          )}
                        </td>

                        {/* District Landmark Thumbnail & Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={district.landmarkImg}
                              alt={district.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <span className="font-bold text-[#0F172A] leading-tight truncate">
                              {district.name}
                            </span>
                          </div>
                        </td>

                        {/* Total Students */}
                        <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                          {district.totalStudents.toLocaleString()}
                        </td>

                        {/* Tests Attempted */}
                        <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                          {district.testsAttempted.toLocaleString()}
                        </td>

                        {/* Avg. Score Badge */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={cn(
                              'text-[11px] font-bold px-2 py-0.5 rounded inline-block',
                              district.avgScore >= 74
                                ? 'bg-[#DCFCE7] text-[#16A34A]'
                                : district.avgScore >= 66
                                ? 'bg-[#FEF3C7] text-[#D97706]'
                                : 'bg-[#FFEDD5] text-[#EA580C]'
                            )}
                          >
                            {district.avgScore}%
                          </span>
                        </td>

                        {/* Top Score */}
                        <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                          {district.topScore}%
                        </td>

                        {/* Active Students */}
                        <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                          {district.activeStudents}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setOpenActionRank(
                                openActionRank === district.rank ? null : district.rank
                              )
                            }
                            className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Popover Menu */}
                          {openActionRank === district.rank && (
                            <div
                              ref={actionMenuRef}
                              className="absolute right-2 top-8 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 text-left text-xs animate-in fade-in duration-150"
                            >
                              <button
                                onClick={() => {
                                  setSelectedDistrictName(district.name);
                                  setIsDetailsOpen(true);
                                  setOpenActionRank(null);
                                }}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                <span>View District Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsAllStudentsModalOpen(true);
                                  setOpenActionRank(null);
                                }}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Users className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Top Students</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="py-3 px-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#64748B] font-medium">
                Showing{' '}
                {filteredDistricts.length === 0
                  ? '0'
                  : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredDistricts.length)}`}{' '}
                of {filteredDistricts.length} districts
              </span>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(1)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                    currentPage === 1
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                    currentPage === 2
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                    currentPage === 3
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  3
                </button>
                <button
                  onClick={() => setCurrentPage(4)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                    currentPage === 4
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  4
                </button>
                <button
                  onClick={() => setCurrentPage(5)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                    currentPage === 5
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-slate-100'
                  )}
                >
                  5
                </button>

                <span className="px-1 text-slate-400">...</span>

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Page Size Select */}
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ==================== SUB-SECTION: TOP STUDENTS BY DISTRICT ==================== */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <h2 className="text-sm font-bold text-[#0F172A]">Top Students by District</h2>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedDistrictName || ''}
                    onChange={(e) => setSelectedDistrictName(e.target.value)}
                    className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    {districtsList.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="WBP Constable">WBP Constable</option>
                    <option value="KP SI">KP SI</option>
                    <option value="WBCS">WBCS</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={() => setIsAllStudentsModalOpen(true)}
                  className="text-xs font-semibold text-[#2563EB] hover:underline ml-1 cursor-pointer"
                >
                  View All
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="py-2 px-3 w-8 text-center font-bold">#</th>
                    <th className="py-2 px-3 font-bold min-w-[150px]">Student</th>
                    <th className="py-2 px-3 text-center font-bold min-w-[90px]">
                      Tests Attempted
                    </th>
                    <th className="py-2 px-3 text-center font-bold min-w-[80px]">Avg. Score</th>
                    <th className="py-2 px-3 text-center font-bold min-w-[80px]">Best Score</th>
                    <th className="py-2 px-3 font-bold min-w-[90px]">Last Active</th>
                    <th className="py-2 px-3 text-center w-12 font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {!activeDistrict || activeDistrict.topStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                        No students data available for this district.
                      </td>
                    </tr>
                  ) : (
                    activeDistrict.topStudents.map((st) => (
                      <tr key={st.rank} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {st.rank === 1 && (
                            <Crown className="w-3.5 h-3.5 text-amber-500 inline mr-1" />
                          )}
                          {st.rank}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={st.avatar}
                              alt={st.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <span className="font-bold text-[#0F172A]">{st.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                          {st.testsAttempted}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold px-2 py-0.5 rounded">
                            {st.avgScore}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {st.bestScore}%
                        </td>
                        <td className="py-2.5 px-3 text-[#64748B] text-[11px]">{st.lastActive}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => navigate('/admin/students')}
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: 3 STACKED WIDGETS ==================== */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-4">
          {/* 1. DISTRICT PERFORMANCE MAP WIDGET */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-[#0F172A]">District Performance Map</h3>
                <Info className="w-3 h-3 text-[#94A3B8]" />
              </div>

              <div className="relative">
                <select className="appearance-none bg-white border border-[#E2E8F0] rounded-lg pl-2 pr-6 py-1 text-[11px] font-semibold text-[#1E293B] focus:outline-none cursor-pointer">
                  <option>Avg. Score</option>
                  <option>Total Students</option>
                  <option>Tests Attempted</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Map Canvas with Purulia Tooltip & Legend */}
            <div className="relative h-[220px] bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between p-3 overflow-hidden">
              {/* Silhouette SVG outline of West Bengal */}
              <div className="relative w-48 h-full flex items-center justify-center">
                <img
                  src="/images/west_bengal_silhouette.svg"
                  alt="West Bengal Map"
                  className="w-full h-full object-contain filter drop-shadow-sm opacity-85"
                />

                {/* Floating Tooltip positioned over Purulia */}
                {activeDistrict && (
                  <div className="absolute top-[85px] left-1 z-10 bg-[#0F172A] text-white rounded-xl p-2.5 shadow-xl text-[10px] space-y-0.5 border border-slate-700">
                    <p className="font-bold text-white text-[11px]">{activeDistrict.name}</p>
                    <p className="text-slate-300">
                      Students: {activeDistrict.totalStudents.toLocaleString()}
                    </p>
                    <p className="text-slate-300">Avg. Score: {activeDistrict.avgScore}%</p>
                    <p className="text-slate-300">
                      Tests: {activeDistrict.testsAttempted.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Legend on the right */}
              <div className="space-y-1.5 text-[10px] font-semibold text-[#475569] shrink-0 pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#1D4ED8]" />
                  <span>80% - 100%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#3B82F6]" />
                  <span>60% - 80%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#60A5FA]" />
                  <span>40% - 60%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#93C5FD]" />
                  <span>20% - 40%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#DBEAFE]" />
                  <span>&lt; 20%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. TOP 5 DISTRICTS WIDGET */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xs font-bold text-[#0F172A]">Top 5 Districts</h3>
              <button
                onClick={() => setIsTop5ModalOpen(true)}
                className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {districtsList.slice(0, 5).map((d) => (
                <div
                  key={d.rank}
                  onClick={() => setSelectedDistrictName(d.name)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <span className="w-3 text-center text-[11px] font-bold text-slate-500">
                    {d.rank}
                  </span>
                  <span className="w-28 text-[11px] font-semibold text-[#1E293B] group-hover:text-blue-600 truncate">
                    {d.name}
                  </span>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        d.avgScore >= 75
                          ? 'bg-emerald-500'
                          : d.avgScore >= 72
                          ? 'bg-lime-500'
                          : 'bg-amber-500'
                      )}
                      style={{ width: `${d.avgScore}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] font-bold text-[#0F172A]">
                    {d.avgScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. DISTRICT DETAILS WIDGET */}
          {isDetailsOpen && activeDistrict && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-4 animate-in fade-in duration-150">
              {/* Header: Title & Close */}
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold text-[#0F172A]">District Details</h3>
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedDistrictName(null);
                  }}
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition-colors"
                  title="Close district details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* District Profile Thumbnail & Rank */}
              <div className="flex items-center gap-3">
                <img
                  src={activeDistrict.landmarkImg}
                  alt={activeDistrict.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-[#0F172A] leading-tight">
                      {activeDistrict.name}
                    </h4>
                    <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                      Rank #{activeDistrict.rank}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">West Bengal</p>
                </div>
              </div>

              {/* 6 Metric Cards (2x3 Grid) */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* 1. Total Students */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2 flex flex-col items-start gap-1">
                  <div className="w-6 h-6 rounded-md bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-black text-[#0F172A] leading-none mt-1">
                    {activeDistrict.totalStudents.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-[#64748B] leading-none truncate w-full">
                    Total Students
                  </p>
                </div>

                {/* 2. Tests Attempted */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2 flex flex-col items-start gap-1">
                  <div className="w-6 h-6 rounded-md bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-black text-[#0F172A] leading-none mt-1">
                    {activeDistrict.testsAttempted.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-[#64748B] leading-none truncate w-full">
                    Tests Attempted
                  </p>
                </div>

                {/* 3. Avg. Score */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2 flex flex-col items-start gap-1">
                  <div className="w-6 h-6 rounded-md bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-black text-[#0F172A] leading-none mt-1">
                    {activeDistrict.avgScore}%
                  </p>
                  <p className="text-[9px] text-[#64748B] leading-none truncate w-full">
                    Avg. Score
                  </p>
                </div>

                {/* 4. Active Students */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2 flex flex-col items-start gap-1">
                  <div className="w-6 h-6 rounded-md bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-black text-[#0F172A] leading-none mt-1">
                    {activeDistrict.activeStudents}
                  </p>
                  <p className="text-[9px] text-[#64748B] leading-none truncate w-full">
                    Active Students
                  </p>
                </div>

                {/* 5. Top Score */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2 flex flex-col items-start gap-1">
                  <div className="w-6 h-6 rounded-md bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-black text-[#0F172A] leading-none mt-1">
                    {activeDistrict.topScore}%
                  </p>
                  <p className="text-[9px] text-[#64748B] leading-none truncate w-full">
                    Top Score
                  </p>
                </div>

                {/* 6. Top 100 Students */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2 flex flex-col items-start gap-1">
                  <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-black text-[#0F172A] leading-none mt-1">
                    {activeDistrict.top100Count}
                  </p>
                  <p className="text-[9px] text-[#64748B] leading-none truncate w-full">
                    Top 100 Students
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MODAL: TOP 5 DISTRICTS FULL VIEW */}
      {/* ==================================================================== */}
      {isTop5ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">All District Rankings</h3>
              </div>
              <button
                onClick={() => setIsTop5ModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {districtsList.map((d) => (
                <div
                  key={d.rank}
                  onClick={() => {
                    setSelectedDistrictName(d.name);
                    setIsTop5ModalOpen(false);
                  }}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-slate-700 text-xs">
                      #{d.rank}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">{d.totalStudents} Students</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      {d.avgScore}% Avg
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTop5ModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. MODAL: ALL DISTRICT TOP STUDENTS */}
      {/* ==================================================================== */}
      {isAllStudentsModalOpen && activeDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Top Performers in {activeDistrict.name}
                </h3>
              </div>
              <button
                onClick={() => setIsAllStudentsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {activeDistrict.topStudents.map((st) => (
                <div
                  key={st.rank}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-600 text-xs">Rank #{st.rank}</span>
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {st.testsAttempted} Tests Attempted
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      {st.avgScore}% Avg
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Best: {st.bestScore}%</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setIsAllStudentsModalOpen(false);
                  navigate('/admin/students');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Go to Students Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAllStudentsModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    { label: 'Loading district rankings…', variant: 'dashboard' }
  );
};
