import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  ArrowUpDown,
  Trash2,
  Eye,
  Clock,
  Archive,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  MoreHorizontal,
  X,
  Upload,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { bannerService } from '@/services/bannerService';
import type { HeroBanner } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================================
// DATA MODELS & PRESETS
// ============================================================================

export type BannerType = 'Test Series' | 'Offer' | 'Subject' | 'Brand' | 'PYQ';
export type BannerStatus = 'Active' | 'Scheduled' | 'Archived' | 'Draft';
export type OpenInTarget = 'Same Tab' | 'New Tab';

export interface AdminBannerItem {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  bannerType: BannerType;
  linkUrl: string;
  openIn: OpenInTarget;
  devices: {
    desktop: boolean;
    mobile: boolean;
  };
  startDate: string; // "01 Sep 2026" or "01-09-2026"
  endDate: string;   // "30 Sep 2026" or "30-09-2026"
  hasDateRange: boolean;
  status: BannerStatus;
  imageUrl: string;
  fileName: string;
  clickCount: number;
  badgeText?: string;
  ctaText?: string;
}

// 12 Preset banners matching the exact data & screenshot structure
const INITIAL_BANNERS: AdminBannerItem[] = [
  {
    id: 'banner-1',
    order: 1,
    title: 'WBP Mock Test Banner',
    subtitle: 'Promote WBP mock tests',
    description: 'Promote WBP mock tests',
    bannerType: 'Test Series',
    linkUrl: '/test-series/wbp',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '01 Sep 2026',
    endDate: '30 Sep 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/exam_wbp_bg.png',
    fileName: 'banner-wbp.jpg',
    clickCount: 4820,
    badgeText: 'WBP CONSTABLE 2026',
    ctaText: 'এখনই শুরু করুন →',
  },
  {
    id: 'banner-2',
    order: 2,
    title: 'Special Offer Banner',
    subtitle: 'Offer for new students',
    description: 'Offer for new students',
    bannerType: 'Offer',
    linkUrl: '/pricing',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '05 Sep 2026',
    endDate: '20 Sep 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/promo_student.png',
    fileName: 'special-offer.jpg',
    clickCount: 3150,
    badgeText: 'SPECIAL 50% OFF',
    ctaText: 'অফার নিন →',
  },
  {
    id: 'banner-3',
    order: 3,
    title: 'General Science Banner',
    subtitle: 'Subject-wise topic test',
    description: 'Subject-wise topic test',
    bannerType: 'Subject',
    linkUrl: '/subject/general-science',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '01 Sep 2026',
    endDate: '31 Oct 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/exam_hero_banner.png',
    fileName: 'general-science.jpg',
    clickCount: 2280,
    badgeText: 'TOPIC MOCK',
    ctaText: 'প্র্যাকটিস শুরু →',
  },
  {
    id: 'banner-4',
    order: 4,
    title: 'Full Mock Series Banner',
    subtitle: 'Complete preparation',
    description: 'Complete preparation',
    bannerType: 'Test Series',
    linkUrl: '/test-series',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '',
    endDate: '',
    hasDateRange: false,
    status: 'Active',
    imageUrl: '/images/hero_student_illustration.png',
    fileName: 'full-mock.jpg',
    clickCount: 1940,
    badgeText: 'FULL SYLLABUS',
    ctaText: 'সিরিজ দেখুন →',
  },
  {
    id: 'banner-5',
    order: 5,
    title: 'Brand Banner',
    subtitle: 'General brand promotion',
    description: 'General brand promotion',
    bannerType: 'Brand',
    linkUrl: '/',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '',
    endDate: '',
    hasDateRange: false,
    status: 'Scheduled',
    imageUrl: '/images/student.png',
    fileName: 'brand-banner.jpg',
    clickCount: 860,
    badgeText: 'PRACTICEKORO #1',
    ctaText: 'বিস্তারিত জানুন →',
  },
  {
    id: 'banner-6',
    order: 6,
    title: 'PYQ Banner',
    subtitle: 'Official PYQ practice',
    description: 'Official PYQ practice',
    bannerType: 'PYQ',
    linkUrl: '/test-series/pyq',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '01 Sep 2026',
    endDate: '31 Dec 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/card_pyq.png',
    fileName: 'pyq-banner.jpg',
    clickCount: 1420,
    badgeText: 'PREVIOUS YEARS',
    ctaText: 'PYQ সলভ করুন →',
  },
  {
    id: 'banner-7',
    order: 7,
    title: 'KP Constable Mock Test Banner',
    subtitle: 'Kolkata Police Constable practice',
    description: 'Kolkata Police Constable practice',
    bannerType: 'Test Series',
    linkUrl: '/test-series/kp',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '01 Oct 2026',
    endDate: '30 Nov 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/exam_kp_card.png',
    fileName: 'banner-kp.jpg',
    clickCount: 2110,
    badgeText: 'KP CONSTABLE',
    ctaText: 'মক টেস্ট শুরু →',
  },
  {
    id: 'banner-8',
    order: 8,
    title: 'WBTET Primary TET Banner',
    subtitle: 'Teacher eligibility mock test',
    description: 'Teacher eligibility mock test',
    bannerType: 'Test Series',
    linkUrl: '/test-series/wbtet',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '',
    endDate: '',
    hasDateRange: false,
    status: 'Active',
    imageUrl: '/images/hero_wbtet_banner.png',
    fileName: 'banner-wbtet.jpg',
    clickCount: 1680,
    badgeText: 'PRIMARY TET',
    ctaText: 'পরীক্ষা দিন →',
  },
  {
    id: 'banner-9',
    order: 9,
    title: 'Daily 10 Topic Quiz Banner',
    subtitle: 'Daily rapid practice series',
    description: 'Daily rapid practice series',
    bannerType: 'Subject',
    linkUrl: '/practice',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '',
    endDate: '',
    hasDateRange: false,
    status: 'Active',
    imageUrl: '/images/daily_10_banner_exact.png',
    fileName: 'daily-10.jpg',
    clickCount: 3820,
    badgeText: 'DAILY RAPID',
    ctaText: '১০ টি প্রশ্ন →',
  },
  {
    id: 'banner-10',
    order: 10,
    title: 'Current Affairs 2026 Banner',
    subtitle: 'Monthly static & current affairs',
    description: 'Monthly static & current affairs',
    bannerType: 'Subject',
    linkUrl: '/practice/current-affairs',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '01 Sep 2026',
    endDate: '31 Dec 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/info_book_icon.png',
    fileName: 'current-affairs.jpg',
    clickCount: 2940,
    badgeText: 'CA & GK',
    ctaText: 'রিভিশন শুরু →',
  },
  {
    id: 'banner-11',
    order: 11,
    title: 'SSC CGL Prelims Banner',
    subtitle: 'Staff Selection Commission practice',
    description: 'Staff Selection Commission practice',
    bannerType: 'Test Series',
    linkUrl: '/test-series/ssc',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '15 Oct 2026',
    endDate: '15 Nov 2026',
    hasDateRange: true,
    status: 'Scheduled',
    imageUrl: '/images/exam_ssc_card.png',
    fileName: 'banner-ssc.jpg',
    clickCount: 540,
    badgeText: 'SSC CGL TIER 1',
    ctaText: 'মক দিন →',
  },
  {
    id: 'banner-12',
    order: 12,
    title: 'Holiday Mega Offer Banner',
    subtitle: 'Festival discount on pro pass',
    description: 'Festival discount on pro pass',
    bannerType: 'Offer',
    linkUrl: '/subscription',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '10 Oct 2026',
    endDate: '25 Oct 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/subscription_crown.png',
    fileName: 'mega-offer.jpg',
    clickCount: 4120,
    badgeText: 'PUJA SPECIAL',
    ctaText: 'পাস আনলক →',
  },
];

// Helper to map DB HeroBanner to AdminBannerItem
function mapHeroBannerToAdminItem(banner: HeroBanner, index: number): AdminBannerItem {
  let bType: BannerType = 'Test Series';
  if (banner.title.toLowerCase().includes('offer') || banner.title.toLowerCase().includes('discount')) {
    bType = 'Offer';
  } else if (banner.title.toLowerCase().includes('science') || banner.title.toLowerCase().includes('subject')) {
    bType = 'Subject';
  } else if (banner.title.toLowerCase().includes('brand') || banner.title.toLowerCase().includes('platform')) {
    bType = 'Brand';
  } else if (banner.title.toLowerCase().includes('pyq')) {
    bType = 'PYQ';
  }

  const hasRange = Boolean(banner.startsAt && banner.expiresAt);
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return {
    id: banner.id,
    order: banner.displayOrder || index + 1,
    title: banner.title,
    subtitle: banner.subtitle || 'Promote mock tests and courses',
    description: banner.subtitle || banner.title,
    bannerType: bType,
    linkUrl: banner.primaryCtaLink || '/test-series',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: formatDate(banner.startsAt),
    endDate: formatDate(banner.expiresAt),
    hasDateRange: hasRange,
    status: banner.isActive ? 'Active' : 'Draft',
    imageUrl: banner.imageUrl || '/images/exam_hero_banner.png',
    fileName: banner.imageUrl ? banner.imageUrl.split('/').pop() || 'banner.jpg' : 'banner.jpg',
    clickCount: banner.clickCount || 0,
    badgeText: banner.badgeText,
    ctaText: banner.primaryCtaText || 'এখনই শুরু করুন →',
  };
}

// ============================================================================
// HIGH-FIDELITY BANNER GRAPHIC COMPONENT (PROPER BACKGROUND PLACEMENT)
// ============================================================================

interface BannerVisualProps {
  banner: AdminBannerItem;
  className?: string;
  isHero?: boolean;
}

export const BannerVisual: React.FC<BannerVisualProps> = ({ banner, className = '', isHero = false }) => {
  // Check if image is an uploaded base64 data URL or custom URL
  const isCustomUploaded =
    banner.imageUrl &&
    (banner.imageUrl.startsWith('data:') ||
      banner.imageUrl.startsWith('blob:') ||
      banner.imageUrl.startsWith('http'));

  if (isCustomUploaded) {
    return (
      <div className={cn('relative w-full h-full overflow-hidden select-none bg-slate-900', className)}>
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  const normTitle = (banner.title || '').toLowerCase();

  // 1. WBP Mock Test Banner (Exact background image placement with Victoria Memorial & deep navy blue)
  if (normTitle.includes('wbp') || banner.id === 'banner-1') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 19, 45, 0.96) 0%, rgba(10, 32, 85, 0.88) 46%, rgba(6, 19, 45, 0.55) 100%), url('/images/exam_wbp_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#071630',
        }}
      >
        {/* Subtle background tech grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10">
          {/* Left Content */}
          <div className="flex flex-col justify-center max-w-[62%]">
            <div className="leading-tight">
              <span
                className={cn(
                  'font-black tracking-wider text-white block uppercase',
                  isHero ? 'text-2xl sm:text-3xl' : 'text-xs'
                )}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
              >
                WBP
              </span>
              <span
                className={cn(
                  'font-black tracking-wider text-white block uppercase',
                  isHero ? 'text-2xl sm:text-3xl' : 'text-xs'
                )}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
              >
                MOCK TEST
              </span>
            </div>

            <p
              className={cn(
                'text-[#FDE047] font-medium leading-none mt-1',
                isHero ? 'text-xs sm:text-sm' : 'text-[8.5px]'
              )}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              সম্পূর্ণ প্রস্তুতি এখন এক প্ল্যাটফর্মে
            </p>

            <div className="mt-2">
              <span
                className={cn(
                  'inline-flex items-center font-bold text-slate-900 bg-[#FACC15] rounded-full shadow-md',
                  isHero ? 'text-xs px-3.5 py-1' : 'text-[7.5px] px-2 py-0.5'
                )}
              >
                {banner.ctaText || 'এখনই শুরু করুন →'}
              </span>
            </div>
          </div>

          {/* Right Shield Badge */}
          <div className="relative flex items-center justify-center shrink-0 pr-1">
            <div
              className={cn(
                'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 text-slate-950 font-black rounded-lg border-2 border-yellow-200 shadow-xl flex items-center justify-center',
                isHero ? 'px-3 py-1.5 text-sm gap-1' : 'px-1.5 py-0.5 text-[7px] gap-0.5'
              )}
            >
              <span>★</span>
              <span>100+</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Special Offer Banner (Vibrant Coral/Orange)
  if (normTitle.includes('special offer') || banner.id === 'banner-2') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(217, 72, 15, 0.95) 0%, rgba(234, 88, 12, 0.85) 55%, rgba(225, 29, 72, 0.6) 100%), url('/images/promo_student.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#EA580C',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black block uppercase tracking-wide',
                isHero ? 'text-2xl sm:text-3xl' : 'text-xs'
              )}
            >
              এখনই শুরু
            </span>
            <span
              className={cn(
                'font-black text-[#FEF08A] block',
                isHero ? 'text-3xl' : 'text-sm'
              )}
            >
              99 টাকায়
            </span>
            <p className={cn('text-orange-100', isHero ? 'text-xs mt-1' : 'text-[8px]')}>
              অফার সীমিত সময়ের জন্য
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. General Science Banner (Emerald Green)
  if (normTitle.includes('science') || banner.id === 'banner-3') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 78, 59, 0.95) 0%, rgba(5, 150, 105, 0.85) 55%, rgba(4, 120, 87, 0.6) 100%), url('/images/exam_hero_banner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#059669',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black tracking-wide block',
                isHero ? 'text-2xl' : 'text-xs'
              )}
            >
              General Science
            </span>
            <span
              className={cn(
                'font-bold text-[#A7F3D0] block',
                isHero ? 'text-sm' : 'text-[9px]'
              )}
            >
              সম্পূর্ণ Topic Test
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Full Mock Series Banner (Indigo / Violet)
  if (normTitle.includes('full mock') || banner.id === 'banner-4') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.85) 55%, rgba(67, 56, 202, 0.6) 100%), url('/images/hero_student_illustration.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#312E81',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black tracking-wider block uppercase',
                isHero ? 'text-2xl' : 'text-xs'
              )}
            >
              FULL MOCK TEST
            </span>
            <span
              className={cn(
                'font-semibold text-indigo-200 block',
                isHero ? 'text-sm' : 'text-[9px]'
              )}
            >
              FULL MOCK TEST
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Brand Banner (Amber / Gold)
  if (normTitle.includes('brand') || banner.id === 'banner-5') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(120, 53, 15, 0.95) 0%, rgba(180, 83, 9, 0.85) 55%, rgba(217, 119, 6, 0.6) 100%), url('/images/student.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#B45309',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black block',
                isHero ? 'text-2xl' : 'text-xs'
              )}
            >
              সাফল্যের গল্প
            </span>
            <span
              className={cn(
                'font-bold text-[#FDE68A] block',
                isHero ? 'text-sm' : 'text-[9px]'
              )}
            >
              PracticeKoro
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 6. PYQ Banner (Crimson / Red)
  if (normTitle.includes('pyq') || banner.id === 'banner-6') {
    return (
      <div
        className={cn('relative w-full h-full overflow-hidden select-none', className)}
        style={{
          backgroundImage: `linear-gradient(to right, rgba(136, 19, 55, 0.95) 0%, rgba(190, 18, 60, 0.85) 55%, rgba(225, 29, 72, 0.6) 100%), url('/images/card_pyq.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#BE123C',
        }}
      >
        <div className="relative h-full flex items-center justify-between px-3.5 py-2 z-10 text-white">
          <div className="flex flex-col justify-center max-w-[65%]">
            <span
              className={cn(
                'font-black block uppercase tracking-wide',
                isHero ? 'text-2xl' : 'text-xs'
              )}
            >
              PYQ
            </span>
            <span
              className={cn(
                'font-semibold text-rose-100 block',
                isHero ? 'text-sm' : 'text-[9px]'
              )}
            >
              Previous Year Questions
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for custom or other banners
  if (banner.imageUrl) {
    return (
      <div className={cn('relative w-full h-full overflow-hidden select-none bg-slate-900', className)}>
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden select-none bg-gradient-to-r from-blue-900 to-indigo-800 text-white flex items-center justify-between px-3.5 py-2',
        className
      )}
    >
      <div className="z-10">
        <h4 className={cn('font-bold', isHero ? 'text-xl' : 'text-xs')}>{banner.title}</h4>
        <p className={cn('text-blue-200', isHero ? 'text-xs' : 'text-[8px]')}>{banner.subtitle}</p>
      </div>
      <div className="shrink-0">
        <ImageIcon className={cn('text-blue-300 opacity-60', isHero ? 'w-12 h-12' : 'w-5 h-5')} />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: ADMIN BANNERS
// ============================================================================

export const AdminBanners: React.FC = () => {
  const queryClient = useQueryClient();

  // Banners state
  const [banners, setBanners] = useState<AdminBannerItem[]>(INITIAL_BANNERS);
  const [selectedBannerId, setSelectedBannerId] = useState<string>('banner-1');
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState('All Devices');

  // Active filters applied
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    type: 'All Types',
    status: 'All Status',
    device: 'All Devices',
  });

  // Right Panel State (Active editing copy)
  const [activeTab, setActiveTab] = useState<'Details' | 'Settings' | 'Preview'>('Details');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [editFormData, setEditFormData] = useState<AdminBannerItem>(INITIAL_BANNERS[0]);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [reorderedList, setReorderedList] = useState<AdminBannerItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Banner Form state
  const [newBannerData, setNewBannerData] = useState<Omit<AdminBannerItem, 'id' | 'order' | 'clickCount'>>({
    title: '',
    subtitle: '',
    description: '',
    bannerType: 'Test Series',
    linkUrl: '/test-series',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '01 Oct 2026',
    endDate: '31 Oct 2026',
    hasDateRange: true,
    status: 'Active',
    imageUrl: '/images/exam_hero_banner.png',
    fileName: 'banner-new.jpg',
  });

  // Toast notifier
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync with service on load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await bannerService.getBanners();
        if (data && data.length > 0) {
          // Merge with presets so we have all 12 banners and correct visuals
          const mapped = data.map((b, i) => mapHeroBannerToAdminItem(b, i));
          const merged = [...mapped];
          for (const preset of INITIAL_BANNERS) {
            if (!merged.some((m) => m.title === preset.title)) {
              merged.push(preset);
            }
          }
          merged.sort((a, b) => a.order - b.order);
          setBanners(merged);
          setSelectedBannerId(merged[0]?.id || 'banner-1');
          setEditFormData(merged[0] || INITIAL_BANNERS[0]);
        } else {
          // Initialize storage with presets
          setBanners(INITIAL_BANNERS);
          setSelectedBannerId(INITIAL_BANNERS[0].id);
          setEditFormData(INITIAL_BANNERS[0]);

          // Seed banners into bannerService
          try {
            for (const preset of INITIAL_BANNERS) {
              await bannerService.createBanner({
                title: preset.title,
                subtitle: preset.subtitle,
                primaryCtaLink: preset.linkUrl,
                imageUrl: preset.imageUrl,
                isActive: preset.status === 'Active',
                displayOrder: preset.order,
              });
            }
          } catch {
            // Local fallback seeded
          }
        }
      } catch (err) {
        console.error('Failed to load banners from service:', err);
        setBanners(INITIAL_BANNERS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);


  // Handle Filter Button click
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      type: selectedTypeFilter,
      status: selectedStatusFilter,
      device: selectedDeviceFilter,
    });
    setCurrentPage(1);
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTypeFilter('All Types');
    setSelectedStatusFilter('All Status');
    setSelectedDeviceFilter('All Devices');
    setAppliedFilters({
      search: '',
      type: 'All Types',
      status: 'All Status',
      device: 'All Devices',
    });
    setCurrentPage(1);
  };

  // Filtered banners list
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      // Search
      if (appliedFilters.search.trim()) {
        const q = appliedFilters.search.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchSubtitle = b.subtitle.toLowerCase().includes(q);
        const matchLink = b.linkUrl.toLowerCase().includes(q);
        if (!matchTitle && !matchSubtitle && !matchLink) return false;
      }
      // Type
      if (appliedFilters.type !== 'All Types' && b.bannerType !== appliedFilters.type) {
        return false;
      }
      // Status
      if (appliedFilters.status !== 'All Status' && b.status !== appliedFilters.status) {
        return false;
      }
      // Device
      if (appliedFilters.device !== 'All Devices') {
        if (appliedFilters.device === 'Desktop Only' && (!b.devices.desktop || b.devices.mobile)) return false;
        if (appliedFilters.device === 'Mobile Only' && (!b.devices.mobile || b.devices.desktop)) return false;
        if (appliedFilters.device === 'Desktop & Mobile' && (!b.devices.desktop || !b.devices.mobile)) return false;
      }
      return true;
    });
  }, [banners, appliedFilters]);

  // Pagination calculations
  const totalItems = filteredBanners.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleBanners = filteredBanners.slice(startIndex, startIndex + itemsPerPage);

  // Statistics for KPI Cards
  const stats = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.status === 'Active').length;
    const scheduled = banners.filter((b) => b.status === 'Scheduled').length;
    const archived = banners.filter((b) => b.status === 'Archived').length;
    return { total, active, scheduled, archived };
  }, [banners]);

  // Save changes from Right Panel
  const handleUpdateBanner = async () => {
    try {
      setIsUpdating(true);
      // Update local state
      setBanners((prev) =>
        prev.map((item) => (item.id === editFormData.id ? { ...editFormData } : item))
      );

      // Call service update with ALL fields including imageUrl
      try {
        await bannerService.updateBanner(editFormData.id, {
          title: editFormData.title,
          subtitle: editFormData.description,
          primaryCtaLink: editFormData.linkUrl,
          imageUrl: editFormData.imageUrl,
          displayOrder: editFormData.order,
          isActive: editFormData.status === 'Active',
          startsAt: editFormData.startDate,
          expiresAt: editFormData.endDate,
        });
      } catch {
        // If not in database yet, create/upsert it
        await bannerService.createBanner({
          title: editFormData.title,
          subtitle: editFormData.description,
          primaryCtaLink: editFormData.linkUrl,
          imageUrl: editFormData.imageUrl,
          displayOrder: editFormData.order,
          isActive: editFormData.status === 'Active',
          startsAt: editFormData.startDate,
          expiresAt: editFormData.endDate,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', 'Banner updated successfully!');
    } catch (err) {
      console.error('Update banner error:', err);
      showToast('success', 'Banner updated locally.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete banner handler
  const handleDeleteConfirm = async () => {
    try {
      const idToDelete = editFormData.id;
      setBanners((prev) => prev.filter((b) => b.id !== idToDelete));
      await bannerService.deleteBanner(idToDelete);
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      setIsDeleteDialogOpen(false);

      // Select next available banner
      const remaining = banners.filter((b) => b.id !== idToDelete);
      if (remaining.length > 0) {
        setSelectedBannerId(remaining[0].id);
        setEditFormData(remaining[0]);
      }
      showToast('success', 'Banner deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      setIsDeleteDialogOpen(false);
      showToast('success', 'Banner deleted from list.');
    }
  };

  // Image upload with compression and live preview update
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    try {
      // Optimize image client-side via bannerService
      const { url } = await bannerService.uploadBannerImage(file);
      setEditFormData((prev) => ({
        ...prev,
        imageUrl: url,
        fileName: file.name,
      }));
      // Update in banners list immediately so table preview updates live
      setBanners((prev) =>
        prev.map((b) => (b.id === editFormData.id ? { ...b, imageUrl: url, fileName: file.name } : b))
      );
      showToast('success', `Selected image: ${file.name}`);
    } catch {
      // Fallback to FileReader
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setEditFormData((prev) => ({
          ...prev,
          imageUrl: result,
          fileName: file.name,
        }));
        setBanners((prev) =>
          prev.map((b) => (b.id === editFormData.id ? { ...b, imageUrl: result, fileName: file.name } : b))
        );
        showToast('success', `Selected image: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create Banner handler
  const handleCreateBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerData.title.trim()) {
      showToast('error', 'Banner title is required.');
      return;
    }

    try {
      setIsCreating(true);
      const newOrder = banners.length + 1;
      const createdItem: AdminBannerItem = {
        ...newBannerData,
        id: `banner-${Date.now()}`,
        order: newOrder,
        clickCount: 0,
      };

      setBanners((prev) => [createdItem, ...prev]);
      setSelectedBannerId(createdItem.id);
      setEditFormData(createdItem);
      setIsCreateModalOpen(false);

      // Call service
      await bannerService.createBanner({
        title: newBannerData.title,
        subtitle: newBannerData.subtitle,
        primaryCtaLink: newBannerData.linkUrl,
        imageUrl: newBannerData.imageUrl,
        isActive: newBannerData.status === 'Active',
        displayOrder: newOrder,
      });

      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', 'New banner created successfully!');
    } catch (err) {
      console.error('Create error:', err);
      showToast('success', 'Banner created and added to list.');
      setIsCreateModalOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  // Open Reorder Modal
  const handleOpenOrderModal = () => {
    setReorderedList([...banners].sort((a, b) => a.order - b.order));
    setIsOrderModalOpen(true);
  };

  // Move banner up in reorder modal
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setReorderedList((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Move banner down in reorder modal
  const handleMoveDown = (index: number) => {
    if (index === reorderedList.length - 1) return;
    setReorderedList((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Save new order
  const handleSaveOrder = async () => {
    try {
      const updatedList = reorderedList.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      setBanners(updatedList);
      setIsOrderModalOpen(false);

      const orderedIds = updatedList.map((b) => b.id);
      await bannerService.reorderBanners(orderedIds);
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', 'Banner order saved successfully!');
    } catch (err) {
      console.error('Reorder error:', err);
      setIsOrderModalOpen(false);
      showToast('success', 'Banner order updated.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5',
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          )}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden File Input for Image Replacement */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* PAGE CONTAINER */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">
        {/* ================================================================= */}
        {/* 1. PAGE HEADER                                                    */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Banners
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create and manage website and app banners. Use banners to promote test series, offers, announcements and more.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Banner Order Button */}
            <button
              onClick={handleOpenOrderModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#026BFC]" />
              <span>Banner Order</span>
            </button>

            {/* Create Banner Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Banner</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. SUMMARY KPI METRIC CARDS (Exact 4-Card Row)                    */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Banners */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <ImageIcon className="w-6 h-6 text-[#8B5CF6]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                Total Banners
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {stats.total}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 20%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                vs last month
              </span>
            </div>
          </div>

          {/* Card 2: Active Banners */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Eye className="w-6 h-6 text-[#10B981]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                Active Banners
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {stats.active}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 11%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                vs last month
              </span>
            </div>
          </div>

          {/* Card 3: Scheduled Banners */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                Scheduled Banners
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {stats.scheduled}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 100%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                vs last month
              </span>
            </div>
          </div>

          {/* Card 4: Archived Banners */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <Archive className="w-6 h-6 text-[#EF4444]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                Archived Banners
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {stats.archived}
                </span>
                <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  —
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                vs last month
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. FILTER TOOLBAR                                                 */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilters();
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026BFC] transition-colors"
            />
          </div>

          {/* All Types Dropdown */}
          <div className="w-[130px]">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value="All Types">All Types</option>
              <option value="Test Series">Test Series</option>
              <option value="Offer">Offer</option>
              <option value="Subject">Subject</option>
              <option value="Brand">Brand</option>
              <option value="PYQ">PYQ</option>
            </select>
          </div>

          {/* All Status Dropdown */}
          <div className="w-[125px]">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Archived">Archived</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* All Devices Dropdown */}
          <div className="w-[130px]">
            <select
              value={selectedDeviceFilter}
              onChange={(e) => setSelectedDeviceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value="All Devices">All Devices</option>
              <option value="Desktop & Mobile">Desktop & Mobile</option>
              <option value="Desktop Only">Desktop Only</option>
              <option value="Mobile Only">Mobile Only</option>
            </select>
          </div>

          {/* Solid Blue Filter Button */}
          <button
            onClick={handleApplyFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
            <span>Filter</span>
          </button>

          {/* Reset Link */}
          <button
            onClick={handleResetFilters}
            className="text-xs font-medium text-[#026BFC] hover:underline px-2 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* ================================================================= */}
        {/* 4. MAIN CONTENT AREA: TABLE (LEFT) + BANNER DETAILS (RIGHT)       */}
        {/* ================================================================= */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* =============================================================== */}
          {/* LEFT: BANNERS TABLE CARD                                        */}
          {/* =============================================================== */}
          <div
            className={cn(
              'bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-300',
              isPanelOpen ? 'flex-1 min-w-0' : 'w-full'
            )}
          >
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-slate-500 font-semibold">#</th>
                    <th className="py-3 px-3 w-36">Banner</th>
                    <th className="py-3 px-3 min-w-[170px]">Title</th>
                    <th className="py-3 px-2 w-24">Type</th>
                    <th className="py-3 px-3 min-w-[130px]">Link</th>
                    <th className="py-3 px-2 w-20">Devices</th>
                    <th className="py-3 px-3 min-w-[125px]">Date Range</th>
                    <th className="py-3 px-2 w-20">Status</th>
                    <th className="py-3 px-2 w-12 text-center">Order</th>
                    <th className="py-3 px-3 w-10 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#026BFC] mb-2" />
                        <span>Loading banners...</span>
                      </td>
                    </tr>
                  ) : visibleBanners.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No banners match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    visibleBanners.map((banner) => {
                      const isSelected = banner.id === selectedBannerId;

                      // Badge Color mapping
                      let badgeClasses = 'bg-[#EBF3FE] text-[#026BFC]';
                      if (banner.bannerType === 'Offer') {
                        badgeClasses = 'bg-[#FFF1EE] text-[#EA580C]';
                      } else if (banner.bannerType === 'Subject') {
                        badgeClasses = 'bg-[#ECFDF5] text-[#059669]';
                      } else if (banner.bannerType === 'Brand') {
                        badgeClasses = 'bg-[#F5F3FF] text-[#7C3AED]';
                      } else if (banner.bannerType === 'PYQ') {
                        badgeClasses = 'bg-[#FFF1EE] text-[#E11D48]';
                      }

                      return (
                        <tr
                          key={banner.id}
                          onClick={() => {
                            setSelectedBannerId(banner.id);
                            setEditFormData({ ...banner });
                            if (!isPanelOpen) setIsPanelOpen(true);
                          }}
                          className={cn(
                            'group cursor-pointer transition-colors duration-150',
                            isSelected
                              ? 'bg-[#F4F8FF] border-l-4 border-l-[#026BFC]'
                              : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
                            />
                          </td>

                          {/* Order Number */}
                          <td className="py-3 px-2 text-slate-600 font-medium">
                            {banner.order}
                          </td>

                          {/* Banner Thumbnail */}
                          <td className="py-3 px-3">
                            <div className="w-[110px] h-[44px] rounded-lg overflow-hidden border border-slate-200/90 shadow-2xs relative shrink-0">
                              <BannerVisual banner={banner} />
                            </div>
                          </td>

                          {/* Title & Subtitle */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 group-hover:text-[#026BFC] transition-colors leading-snug">
                              {banner.title}
                            </div>
                            <div className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate max-w-[200px]">
                              {banner.subtitle}
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="py-3 px-2">
                            <span
                              className={cn(
                                'inline-block px-2 py-0.5 rounded text-[11px] font-medium leading-tight whitespace-nowrap',
                                badgeClasses
                              )}
                            >
                              {banner.bannerType}
                            </span>
                          </td>

                          {/* Link */}
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] text-slate-600 hover:text-[#026BFC] transition-colors truncate block max-w-[140px]">
                              {banner.linkUrl}
                            </span>
                          </td>

                          {/* Devices */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1.5 text-[#026BFC]">
                              {banner.devices.desktop && (
                                <span title="Desktop">
                                  <Monitor className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {banner.devices.mobile && (
                                <span title="Mobile">
                                  <Smartphone className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date Range (Stacked) */}
                          <td className="py-3 px-3">
                            {banner.hasDateRange ? (
                              <div className="text-[11px] text-slate-600 leading-tight">
                                <div>{banner.startDate}</div>
                                <div className="text-slate-500">{banner.endDate}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-2">
                            {banner.status === 'Active' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F8EE] text-[#15803D]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                                Active
                              </span>
                            ) : banner.status === 'Scheduled' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#D97706]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                Scheduled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                {banner.status}
                              </span>
                            )}
                          </td>

                          {/* Order Index */}
                          <td className="py-3 px-2 text-center font-medium text-slate-600">
                            {banner.order}
                          </td>

                          {/* Actions (•••) */}
                          <td
                            className="py-3 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setSelectedBannerId(banner.id);
                                setEditFormData({ ...banner });
                                setIsPanelOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Edit Banner"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="py-3 px-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {totalItems === 0 ? 0 : startIndex + 1}–
                  {Math.min(startIndex + itemsPerPage, totalItems)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{totalItems}</span>{' '}
                banners
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page 1 */}
                <button
                  onClick={() => setCurrentPage(1)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                    currentPage === 1
                      ? 'bg-[#026BFC] text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  1
                </button>

                {/* Page 2 (if exists) */}
                {totalPages > 1 && (
                  <button
                    onClick={() => setCurrentPage(2)}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                      currentPage === 2
                        ? 'bg-[#026BFC] text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    2
                  </button>
                )}

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Page Size Select */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
                >
                  <option value={6}>6 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* RIGHT: BANNER DETAILS PANEL                                     */}
          {/* =============================================================== */}
          {isPanelOpen && (
            <div className="w-full lg:w-[410px] shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 transition-all">
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Banner Details
                </h3>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Top Hero Banner Graphic Preview with PROPER BACKGROUND PLACEMENT */}
              <div className="w-full h-[145px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs mb-4 relative">
                <BannerVisual banner={editFormData} isHero={true} />
              </div>

              {/* 3 Tabs: Details | Settings | Preview */}
              <div className="flex items-center gap-6 border-b border-slate-100 mb-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('Details')}
                  className={cn(
                    'pb-2 transition-colors relative',
                    activeTab === 'Details'
                      ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('Settings')}
                  className={cn(
                    'pb-2 transition-colors relative',
                    activeTab === 'Settings'
                      ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Settings
                </button>
                <button
                  onClick={() => setActiveTab('Preview')}
                  className={cn(
                    'pb-2 transition-colors relative',
                    activeTab === 'Preview'
                      ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Preview
                </button>
              </div>

              {/* TAB 1: DETAILS */}
              {activeTab === 'Details' && (
                <div className="space-y-3.5 text-xs">
                  {/* Title */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC] transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                          subtitle: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC] transition-colors"
                    />
                  </div>

                  {/* Banner Image Row */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Banner Image
                    </label>
                    <div className="flex items-center justify-between p-2 bg-slate-50/70 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-10 h-7 rounded overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                          <BannerVisual banner={editFormData} />
                        </div>
                        <span className="font-mono text-slate-700 text-[11px] truncate max-w-[170px]">
                          {editFormData.fileName}
                        </span>
                      </div>

                      <button
                        onClick={() => fileUploadInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#026BFC] bg-white border border-blue-200 hover:bg-blue-50/60 rounded transition-colors shrink-0"
                      >
                        <Upload className="w-3 h-3 text-[#026BFC]" />
                        <span>Replace</span>
                      </button>
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Type
                    </label>
                    <select
                      value={editFormData.bannerType}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          bannerType: e.target.value as BannerType,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer focus:outline-none focus:border-[#026BFC]"
                    >
                      <option value="Test Series">Test Series</option>
                      <option value="Offer">Offer</option>
                      <option value="Subject">Subject</option>
                      <option value="Brand">Brand</option>
                      <option value="PYQ">PYQ</option>
                    </select>
                  </div>

                  {/* Link URL */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Link URL
                    </label>
                    <input
                      type="text"
                      value={editFormData.linkUrl}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, linkUrl: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-[#026BFC] transition-colors"
                    />
                  </div>

                  {/* Open In */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Open In
                    </label>
                    <select
                      value={editFormData.openIn}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          openIn: e.target.value as OpenInTarget,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer focus:outline-none focus:border-[#026BFC]"
                    >
                      <option value="Same Tab">Same Tab</option>
                      <option value="New Tab">New Tab</option>
                    </select>
                  </div>

                  {/* Devices Checkboxes */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Devices
                    </label>
                    <div className="flex items-center gap-5 py-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={editFormData.devices.desktop}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              devices: { ...prev.devices, desktop: e.target.checked },
                            }))
                          }
                          className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
                        />
                        <span>Desktop</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={editFormData.devices.mobile}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              devices: { ...prev.devices, mobile: e.target.checked },
                            }))
                          }
                          className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
                        />
                        <span>Mobile</span>
                      </label>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          status: e.target.value as BannerStatus,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer focus:outline-none focus:border-[#026BFC]"
                    >
                      <option value="Active">Active</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Archived">Archived</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editFormData.order}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          order: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC] transition-colors"
                    />
                  </div>

                  {/* Schedule (Optional) */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Schedule (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={editFormData.startDate || '01-09-2026'}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                              hasDateRange: true,
                            }))
                          }
                          placeholder="DD-MM-YYYY"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-[#026BFC]"
                        />
                      </div>
                      <span className="text-slate-400 font-medium">➔</span>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={editFormData.endDate || '30-09-2026'}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                              hasDateRange: true,
                            }))
                          }
                          placeholder="DD-MM-YYYY"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-[#026BFC]"
                        />
                      </div>
                      <div className="p-1.5 text-slate-400">
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SETTINGS */}
              {activeTab === 'Settings' && (
                <div className="space-y-4 text-xs py-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 font-medium block">Lifetime Clicks</span>
                    <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                      {editFormData.clickCount.toLocaleString()} clicks
                    </span>
                    <span className="text-[11px] text-emerald-600 mt-1 block">
                      High engagement banner (Top 10%)
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Target Audience
                    </label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800">
                      <option>All Students (Free & Pro)</option>
                      <option>Free Users Only</option>
                      <option>Pro Pass Subscribers Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Banner Placement
                    </label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800">
                      <option>Home Page Hero Carousel</option>
                      <option>Test Series Catalog Top</option>
                      <option>Subject Practice Top</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 text-[#026BFC]"
                      />
                      <span>Auto-archive after end date</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: PREVIEW */}
              {activeTab === 'Preview' && (
                <div className="space-y-4 text-xs py-2">
                  <div>
                    <span className="text-slate-500 font-medium block mb-2">
                      Live Student Home Preview:
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-300 shadow-md h-[160px]">
                      <BannerVisual banner={editFormData} isHero={true} />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                    <p className="text-blue-800 text-[11px] leading-relaxed">
                      💡 Banners are displayed in the hero carousel at 16:9 on mobile and 24:9 on desktop. The background image adapts with cover positioning for maximum visual clarity.
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons: Delete + Update */}
              <div className="flex items-center gap-2.5 pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50/60 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Banner</span>
                </button>

                <button
                  type="button"
                  onClick={handleUpdateBanner}
                  disabled={isUpdating}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-60"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>Update Banner</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: BANNER ORDER MODAL (Reorder)                                */}
      {/* =================================================================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#026BFC]" />
                  <span>Banner Display Order</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reorder banners to change their carousel priority on website and app.
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-2 flex-1">
              {reorderedList.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-14 h-8 rounded overflow-hidden border border-slate-200 shrink-0">
                      <BannerVisual banner={item} />
                    </div>

                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-slate-800 block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {item.bannerType} • {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === reorderedList.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CREATE BANNER MODAL                                        */}
      {/* =================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#026BFC]" />
                  <span>Create New Banner</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in the details to publish a new promotional banner.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateBannerSubmit} className="p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WBP Constable Special Mock Series"
                  value={newBannerData.title}
                  onChange={(e) =>
                    setNewBannerData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50+ Full Mock Tests with Instant Rank"
                  value={newBannerData.subtitle}
                  onChange={(e) =>
                    setNewBannerData((prev) => ({
                      ...prev,
                      subtitle: e.target.value,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Type</label>
                  <select
                    value={newBannerData.bannerType}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({
                        ...prev,
                        bannerType: e.target.value as BannerType,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Test Series">Test Series</option>
                    <option value="Offer">Offer</option>
                    <option value="Subject">Subject</option>
                    <option value="Brand">Brand</option>
                    <option value="PYQ">PYQ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Status</label>
                  <select
                    value={newBannerData.status}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({
                        ...prev,
                        status: e.target.value as BannerStatus,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Active">Active</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Link URL</label>
                <input
                  type="text"
                  placeholder="/test-series/wbp"
                  value={newBannerData.linkUrl}
                  onChange={(e) =>
                    setNewBannerData((prev) => ({ ...prev, linkUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Start Date</label>
                  <input
                    type="text"
                    placeholder="01 Oct 2026"
                    value={newBannerData.startDate}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">End Date</label>
                  <input
                    type="text"
                    placeholder="31 Oct 2026"
                    value={newBannerData.endDate}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-60"
                >
                  {isCreating ? 'Creating...' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL                                  */}
      {/* =================================================================== */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Banner</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-800">
                "{editFormData.title}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminBanners;
