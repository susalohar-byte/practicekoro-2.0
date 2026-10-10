import DOMPurify from 'dompurify';
import { withAdminSkeleton, AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import type { BlogPost, BlogPostStatus } from '@/types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Copy,
  Users,
  Heart,
  MessageSquare,
  Share2,
  AlertCircle,
  FileCheck,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';

type ToastType = 'success' | 'error' | 'info';
let globalToastHandler: ((msg: string, type: ToastType) => void) | null = null;

const toast = {
  success: (msg: string) => globalToastHandler?.(msg, 'success'),
  error: (msg: string) => globalToastHandler?.(msg, 'error'),
  info: (msg: string) => globalToastHandler?.(msg, 'info'),
};

const PRESET_THUMBNAILS = [
  {
    name: 'WBP Exam',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Constitution',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Study Desk',
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'History Monument',
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Science Lab',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Railway Engine',
    url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Mathematics',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Current Affairs',
    url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'WBP Constable': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  'General Knowledge': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'Study Tips': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Indian Polity': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'General Science': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Railway: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  Mathematics: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  History: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Current Affairs': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Exam Strategy': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
};

function formatPublishedDate(
  dateStr: string | null | undefined
): { date: string; time: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return {
    date: `${day < 10 ? '0' + day : day} ${month} ${year}`,
    time: `${formattedHours}:${minutes} ${ampm}`,
  };
}

export const AdminBlog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'all' | 'published' | 'draft' | 'scheduled' | 'archived'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'views' | 'date' | 'title'>('views');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Selected Row Checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer (Neutral initial state - closed by default)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'content' | 'seo' | 'analytics'>(
    'overview'
  );

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  // Active Dropdown Action Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
    globalToastHandler = (message: string, type: ToastType) => {
      setToastNotification({ message, type });
      setTimeout(() => setToastNotification(null), 3200);
    };
    return () => {
      globalToastHandler = null;
    };
  }, []);

  // Load Posts from Service
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllBlogPosts();
      setPosts(data);
      setSelectedPostId((prev) => {
        if (!prev) return null;
        return data.some((p) => p.id === prev) ? prev : null;
      });
    } catch (err) {
      console.error('Failed to load blog posts:', err);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();

    const handleUpdate = () => {
      loadPosts();
    };
    window.addEventListener('pk_blog_posts_updated', handleUpdate);
    return () => {
      window.removeEventListener('pk_blog_posts_updated', handleUpdate);
    };
  }, [loadPosts]);

  // Click outside to close action menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Overall KPI Metrics
  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.status === 'published').length;
    const drafts = posts.filter((p) => p.status === 'draft').length;
    const scheduled = posts.filter((p) => p.status === 'scheduled').length;
    const archived = posts.filter((p) => p.status === 'archived').length;
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    return {
      total,
      published,
      drafts,
      scheduled,
      archived,
      totalViews,
    };
  }, [posts]);

  // Distinct Categories & Authors for Filters
  const { allCategories, allAuthors } = useMemo(() => {
    const cats = new Set<string>();
    const auths = new Set<string>();
    posts.forEach((p) => {
      if (p.category) cats.add(p.category);
      if (p.author) auths.add(p.author);
    });
    return {
      allCategories: Array.from(cats),
      allAuthors: Array.from(auths),
    };
  }, [posts]);

  // Filtering Logic
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Tab filter
        if (activeTab === 'published' && post.status !== 'published') return false;
        if (activeTab === 'draft' && post.status !== 'draft') return false;
        if (activeTab === 'scheduled' && post.status !== 'scheduled') return false;
        if (activeTab === 'archived' && post.status !== 'archived') return false;

        // Status dropdown filter
        if (statusFilter !== 'all' && post.status !== statusFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;

        // Author filter
        if (authorFilter !== 'all' && post.author !== authorFilter) return false;

        // Time filter
        if (timeFilter !== 'all') {
          const postDate = new Date(post.createdAt || post.publishedAt || Date.now());
          const now = new Date();
          if (timeFilter === 'today') {
            if (postDate.toDateString() !== now.toDateString()) return false;
          } else if (timeFilter === 'this_week') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (postDate < sevenDaysAgo) return false;
          } else if (timeFilter === 'this_month') {
            if (
              postDate.getMonth() !== now.getMonth() ||
              postDate.getFullYear() !== now.getFullYear()
            )
              return false;
          } else if (timeFilter === 'this_year') {
            if (postDate.getFullYear() !== now.getFullYear()) return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchCategory = post.category.toLowerCase().includes(q);
          const matchAuthor = post.author.toLowerCase().includes(q);
          const matchSlug = post.slug.toLowerCase().includes(q);
          const matchExcerpt = post.excerpt.toLowerCase().includes(q);
          if (!matchTitle && !matchCategory && !matchAuthor && !matchSlug && !matchExcerpt) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'views') {
          return sortOrder === 'desc' ? b.views - a.views : a.views - b.views;
        }
        if (sortField === 'title') {
          return sortOrder === 'desc'
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title);
        }
        if (sortField === 'date') {
          const timeA = new Date(a.publishedAt || a.createdAt).getTime();
          const timeB = new Date(b.publishedAt || b.createdAt).getTime();
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        return 0;
      });
  }, [
    posts,
    activeTab,
    statusFilter,
    categoryFilter,
    authorFilter,
    timeFilter,
    searchQuery,
    sortField,
    sortOrder,
  ]);

  // Paginated Posts
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // Keep currentPage within bounds when posts are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Selected Post for Drawer
  const selectedPost = useMemo(() => {
    if (!selectedPostId) return null;
    return posts.find((p) => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  // Featured Toggle Handler
  const handleToggleFeatured = async (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleBlogPostFeatured(post.id);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(updated.isFeatured ? 'Post marked as Featured' : 'Removed from Featured');
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  // Status Toggle Handler
  const handleToggleStatus = async (post: BlogPost) => {
    try {
      const updated = await api.toggleBlogPostStatus(post.id);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`Post status updated to ${updated.status}`);
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to change status');
    }
  };

  // Duplicate Handler
  const handleDuplicate = async (post: BlogPost) => {
    try {
      const dup = await api.duplicateBlogPost(post.id);
      setPosts((prev) => [dup, ...prev]);
      setSelectedPostId(dup.id);
      setIsDrawerOpen(true);
      toast.success('Blog post duplicated successfully');
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to duplicate post');
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteBlogPost(deleteCandidate.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
      if (selectedPostId === deleteCandidate.id) {
        setSelectedPostId(null);
        setIsDrawerOpen(false);
      }
      toast.success('Blog post deleted successfully');
      setDeleteCandidate(null);
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to delete post');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setAuthorFilter('all');
    setTimeFilter('all');
    setActiveTab('all');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  // Select All Checkbox Handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedPosts.map((p) => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // Row Select Checkbox Handler
  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk Status Update
  const handleBulkStatusChange = async (status: BlogPostStatus) => {
    const batch = await runConfirmedBatch(Array.from(selectedIds), (id) =>
      api.updateBlogPost(id, { status })
    );
    const saved = new Map(batch.results.map((r) => [r.input, r.value]));
    setPosts((prev) => prev.map((p) => saved.get(p.id) || p));
    setSelectedIds(new Set(batch.failures.map((f) => f.input)));
    if (batch.failures.length)
      toast.error(
        batch.results.length +
          ' saved; ' +
          batch.failures.length +
          ' failed: ' +
          batch.failures[0].error
      );
    else toast.success('Post statuses saved.');
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !window.confirm('Delete selected posts?')) return;
    const batch = await runConfirmedBatch(Array.from(selectedIds), (id) => api.deleteBlogPost(id));
    const gone = new Set(batch.results.map((r) => r.input));
    setPosts((prev) => prev.filter((p) => !gone.has(p.id)));
    setSelectedIds(new Set(batch.failures.map((f) => f.input)));
    if (batch.failures.length)
      toast.error(
        gone.size + ' deleted; ' + batch.failures.length + ' failed: ' + batch.failures[0].error
      );
    else toast.success(gone.size + ' deleted.');
  };

  return withAdminSkeleton(
    loading,
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header Row */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Blog</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, edit and manage blog posts for students and exam preparation content.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (selectedPost) {
                  setPreviewPost(selectedPost);
                } else {
                  window.open('/questions', '_blank');
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>View Website</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Import Posts</span>
            </button>
            <button
              onClick={() => {
                setEditingPost(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Blog Post</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Top 4 KPI Cards Matching Reference Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Posts */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span>↑ 24%</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Total Posts</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
              <p className="text-xs text-slate-400 mt-1">vs last month</p>
            </div>
          </div>

          {/* Card 2: Published */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span>↑ 32%</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Published</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.published}</h3>
              <p className="text-xs text-slate-400 mt-1">79% of total</p>
            </div>
          </div>

          {/* Card 3: Drafts */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span>↑ 9%</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Drafts</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.drafts}</h3>
              <p className="text-xs text-slate-400 mt-1">14% of total</p>
            </div>
          </div>

          {/* Card 4: Total Views */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span>↑ 46%</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Total Views</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats.totalViews > 0 ? stats.totalViews.toLocaleString('en-IN') : '1,24,580'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">+38,200 this month</p>
            </div>
          </div>
        </div>

        {/* Status Tabs Matching Reference */}
        <div className="border-b border-slate-200 bg-white px-2 rounded-t-xl">
          <div className="flex items-center gap-8 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              All Posts ({stats.total})
            </button>
            <button
              onClick={() => {
                setActiveTab('published');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'published'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Published ({stats.published})
            </button>
            <button
              onClick={() => {
                setActiveTab('draft');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'draft'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Drafts ({stats.drafts})
            </button>
            <button
              onClick={() => {
                setActiveTab('scheduled');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'scheduled'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Scheduled ({stats.scheduled})
            </button>
            <button
              onClick={() => {
                setActiveTab('archived');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'archived'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Archived ({stats.archived})
            </button>
          </div>
        </div>

        {/* Filter Toolbar Matching Reference */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Field */}
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search blog posts..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>

              {/* Author Dropdown */}
              <select
                value={authorFilter}
                onChange={(e) => {
                  setAuthorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Authors</option>
                {allAuthors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              {/* Time Dropdown */}
              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between bg-blue-50/50 p-2.5 rounded-lg">
              <span className="text-xs font-semibold text-blue-900">
                {selectedIds.size} posts selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusChange('published')}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Publish Selected
                </button>
                <button
                  onClick={() => handleBulkStatusChange('draft')}
                  className="px-2.5 py-1 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Draft Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 text-xs font-medium bg-rose-600 text-white rounded hover:bg-rose-700"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Layout: Table on Left + Details Drawer on Right */}
        <div className="flex items-start gap-6">
          {/* Main Table Container */}
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedPosts.length > 0 &&
                          paginatedPosts.every((p) => selectedIds.has(p.id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center text-slate-400">#</th>
                    <th className="py-3 px-3 text-center">Featured</th>
                    <th className="py-3 px-3">Thumbnail</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Author</th>
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:text-slate-800"
                      onClick={() => {
                        if (sortField === 'views') {
                          setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                        } else {
                          setSortField('views');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Views</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Published At</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? <tr><td colSpan={11} className="p-4"><AdminSectionSkeleton label="Loading blog posts..." variant="table" /></td></tr> : paginatedPosts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <BookOpen className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">No blog posts found</p>
                          <p className="text-xs text-slate-400">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPosts.map((post, index) => {
                      const rowNumber = (currentPage - 1) * pageSize + index + 1;
                      const isSelected = Boolean(isDrawerOpen && selectedPost?.id === post.id);
                      const pubDate = formatPublishedDate(post.publishedAt);
                      const catStyle = CATEGORY_COLORS[post.category] || {
                        bg: 'bg-slate-50',
                        text: 'text-slate-700',
                        border: 'border-slate-200',
                      };

                      return (
                        <tr
                          key={post.id}
                          onClick={() => {
                            setSelectedPostId(post.id);
                            setIsDrawerOpen(true);
                          }}
                          className={cn(
                            'hover:bg-slate-50/80 transition-colors cursor-pointer group',
                            isSelected && 'bg-blue-50/40'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3.5 px-3 text-center"
                            onClick={(e) => handleToggleSelectRow(post.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(post.id)}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Index # */}
                          <td className="py-3.5 px-2 text-center text-xs text-slate-400 font-medium">
                            {rowNumber}
                          </td>

                          {/* Featured Toggle */}
                          <td
                            className="py-3.5 px-3 text-center"
                            onClick={(e) => handleToggleFeatured(post, e)}
                          >
                            <div
                              className={cn(
                                'w-9 h-5 rounded-full transition-colors relative inline-block p-0.5 cursor-pointer',
                                post.isFeatured ? 'bg-blue-600' : 'bg-slate-200'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                                  post.isFeatured ? 'translate-x-4' : 'translate-x-0'
                                )}
                              />
                            </div>
                          </td>

                          {/* Thumbnail */}
                          <td className="py-3.5 px-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                              <img
                                src={post.thumbnail || PRESET_THUMBNAILS[0].url}
                                alt={post.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = PRESET_THUMBNAILS[0].url;
                                }}
                              />
                            </div>
                          </td>

                          {/* Title */}
                          <td className="py-3.5 px-3 max-w-[280px]">
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {post.title}
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-3">
                            <span
                              className={cn(
                                'inline-block text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap',
                                catStyle.bg,
                                catStyle.text,
                                catStyle.border
                              )}
                            >
                              {post.category}
                            </span>
                          </td>

                          {/* Author */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  post.authorAvatar ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                                }
                                alt={post.author}
                                className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                                }}
                              />
                              <span className="text-xs font-medium text-slate-700">
                                {post.author}
                              </span>
                            </div>
                          </td>

                          {/* Views */}
                          <td className="py-3.5 px-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {post.views.toLocaleString('en-IN')}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {post.status === 'published' && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                Published
                              </span>
                            )}
                            {post.status === 'draft' && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                Draft
                              </span>
                            )}
                            {post.status === 'scheduled' && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                Scheduled
                              </span>
                            )}
                            {post.status === 'archived' && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                Archived
                              </span>
                            )}
                          </td>

                          {/* Published At */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {pubDate ? (
                              <div>
                                <div className="text-xs font-medium text-slate-800">
                                  {pubDate.date}
                                </div>
                                <div className="text-[11px] text-slate-400">{pubDate.time}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Actions Three-Dot Menu */}
                          <td className="py-3.5 px-3 text-right relative action-menu-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === post.id ? null : post.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuId === post.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-3 top-10 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-left text-xs font-medium"
                              >
                                <button
                                  onClick={() => {
                                    setSelectedPostId(post.id);
                                    setIsDrawerOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPost(post);
                                    setIsCreateModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Edit Post</span>
                                </button>
                                <button
                                  onClick={() => handleDuplicate(post)}
                                  className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Duplicate Post</span>
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(post)}
                                  className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Toggle Status</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => {
                                    setDeleteCandidate(post);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Post</span>
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

            {/* Pagination Matching Reference */}
            <div className="py-4 px-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {filteredPosts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredPosts.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{filteredPosts.length}</span>{' '}
                posts
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        'min-w-7 h-7 px-2 rounded-md font-medium text-xs transition-colors cursor-pointer',
                        currentPage === item
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Details Drawer Matching Reference */}
          {isDrawerOpen && selectedPost && (
            <div className="w-96 shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Post Details</h2>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setSelectedPostId(null);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Top Post Card */}
              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/70">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img
                      src={selectedPost.thumbnail || PRESET_THUMBNAILS[0].url}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRESET_THUMBNAILS[0].url;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                      {selectedPost.title}
                    </h3>
                    <div className="mt-1.5">
                      {selectedPost.status === 'published' && (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Published
                        </span>
                      )}
                      {selectedPost.status === 'draft' && (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          Draft
                        </span>
                      )}
                      {selectedPost.status === 'scheduled' && (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60">
                  <button
                    onClick={() => setPreviewPost(selectedPost)}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-slate-50 shadow-2xs"
                  >
                    <span>View Post</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingPost(selectedPost);
                      setIsCreateModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-slate-50 shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="border-b border-slate-200">
                <div className="flex items-center justify-between text-xs font-medium">
                  <button
                    onClick={() => setDrawerTab('overview')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'overview'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setDrawerTab('content')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'content'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Content
                  </button>
                  <button
                    onClick={() => setDrawerTab('seo')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'seo'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    SEO
                  </button>
                  <button
                    onClick={() => setDrawerTab('analytics')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'analytics'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Analytics
                  </button>
                </div>
              </div>

              {/* Tab 1: Overview */}
              {drawerTab === 'overview' && (
                <div className="space-y-5">
                  {/* 6 Metric Grid in Drawer */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* 1. Total Views */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-purple-600">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedPost.views.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Total Views</p>
                    </div>

                    {/* 2. Unique Views */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedPost.uniqueViews.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Unique Views</p>
                    </div>

                    {/* 3. Likes */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedPost.likes.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Likes</p>
                    </div>

                    {/* 4. Comments */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedPost.comments.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Comments</p>
                    </div>

                    {/* 5. Shares */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedPost.shares.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Shares</p>
                    </div>

                    {/* 6. Avg Read Time */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-indigo-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedPost.readTime}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Avg. Read Time</p>
                    </div>
                  </div>

                  {/* Post Information Key-Value */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Post Information</h4>
                      <button
                        onClick={() => {
                          setEditingPost(selectedPost);
                          setIsCreateModalOpen(true);
                        }}
                        className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-600 divide-y divide-slate-100">
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Title</span>
                        <span className="font-medium text-slate-800 text-right">
                          {selectedPost.title}
                        </span>
                      </div>
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Slug</span>
                        <span className="font-mono text-[11px] text-slate-700 text-right">
                          {selectedPost.slug}
                        </span>
                      </div>
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Category</span>
                        <span className="font-medium text-slate-800 text-right">
                          {selectedPost.category}
                        </span>
                      </div>
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Author</span>
                        <span className="font-medium text-slate-800 text-right">
                          {selectedPost.author}
                        </span>
                      </div>
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Status</span>
                        <span className="font-semibold text-emerald-600 capitalize text-right">
                          {selectedPost.status}
                        </span>
                      </div>
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Featured</span>
                        <span className="font-medium text-slate-800 text-right">
                          {selectedPost.isFeatured ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Published At</span>
                        <span className="font-medium text-slate-800 text-right">
                          {selectedPost.publishedAt
                            ? formatPublishedDate(selectedPost.publishedAt)?.date +
                              ', ' +
                              formatPublishedDate(selectedPost.publishedAt)?.time
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between pt-1">
                        <span className="text-slate-400 w-24 shrink-0">Last Updated</span>
                        <span className="font-medium text-slate-800 text-right">
                          {formatPublishedDate(selectedPost.updatedAt)?.date +
                            ', ' +
                            formatPublishedDate(selectedPost.updatedAt)?.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900">Excerpt</h4>
                    <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 text-xs text-slate-600 leading-relaxed font-normal">
                      {selectedPost.excerpt || 'No excerpt provided.'}
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setDeleteCandidate(selectedPost)}
                      className="py-2 px-3 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Post</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(selectedPost)}
                      className="py-2 px-3 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate Post</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Content Tab */}
              {drawerTab === 'content' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Body Preview</span>
                    <button
                      onClick={() => {
                        setEditingPost(selectedPost);
                        setIsCreateModalOpen(true);
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Edit Content
                    </button>
                  </div>
                  <div
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed prose prose-sm max-h-80 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        selectedPost.content || '<p>No content written yet.</p>',
                        { USE_PROFILES: { html: true } }
                      ),
                    }}
                  />
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
                    <p className="font-semibold">Article Reading Analytics</p>
                    <p>Estimated reading time: {selectedPost.readTime}</p>
                    <p>
                      Word count: ~
                      {selectedPost.content ? selectedPost.content.split(/\s+/).length : 0} words
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: SEO Tab */}
              {drawerTab === 'seo' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      Search Engine Snippet
                    </span>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-500 font-mono">
                        practicekoro.com &gt; blog &gt; {selectedPost.slug}
                      </div>
                      <div className="text-sm font-semibold text-blue-700 hover:underline line-clamp-1">
                        {selectedPost.seoTitle || selectedPost.title}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {selectedPost.seoDescription || selectedPost.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Meta Title:</span>
                      <p className="font-medium text-slate-800">
                        {selectedPost.seoTitle || selectedPost.title}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Meta Description:</span>
                      <p className="text-slate-700">
                        {selectedPost.seoDescription || selectedPost.excerpt}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Keywords:</span>
                      <p className="font-mono text-[11px] text-slate-600">
                        {selectedPost.seoKeywords ||
                          'exam preparation, practicekoro, bengali education'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Analytics Tab */}
              {drawerTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">Total Pageviews</span>
                      <span className="font-bold text-slate-900">
                        {selectedPost.views.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-medium text-slate-600">Mobile Readers</span>
                      <span className="font-bold text-slate-900">82%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '82%' }} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-medium text-slate-600">Desktop Readers</span>
                      <span className="font-bold text-slate-900">18%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '18%' }} />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                    <p className="font-semibold text-slate-800">Traffic Acquisition</p>
                    <div className="flex justify-between text-slate-600">
                      <span>Organic Search (Google)</span>
                      <span className="font-medium text-slate-900">64%</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Direct / Bookmark</span>
                      <span className="font-medium text-slate-900">24%</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Social Media & Telegram</span>
                      <span className="font-medium text-slate-900">12%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT BLOG POST MODAL */}
      {isCreateModalOpen && (
        <CreateEditPostModal
          isOpen={isCreateModalOpen}
          initialData={editingPost}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPost(null);
          }}
          onSave={async (savedPost) => {
            if (editingPost) {
              setPosts((prev) => prev.map((p) => (p.id === savedPost.id ? savedPost : p)));
              toast.success('Blog post updated successfully');
            } else {
              setPosts((prev) => [savedPost, ...prev]);
              setSelectedPostId(savedPost.id);
              setIsDrawerOpen(true);
              toast.success('Blog post created successfully');
            }
            setIsCreateModalOpen(false);
            setEditingPost(null);
          }}
        />
      )}

      {/* IMPORT BLOG POSTS MODAL */}
      {isImportModalOpen && (
        <ImportPostsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={async (newPosts) => {
            try {
              const created = await api.importBlogPosts(newPosts);
              setPosts((prev) => [...created, ...prev]);
              toast.success(`Imported ${created.length} blog posts`);
              setIsImportModalOpen(false);
            } catch {
              toast.error('Import failed');
            }
          }}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Blog Post</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">"{deleteCandidate.title}"</span>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / PREVIEW BLOG POST MODAL */}
      {previewPost && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  {previewPost.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">/{previewPost.slug}</span>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={previewPost.thumbnail || PRESET_THUMBNAILS[0].url}
                alt={previewPost.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{previewPost.title}</h1>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-700">By {previewPost.author}</span>
                <span>•</span>
                <span>{previewPost.readTime} read</span>
                <span>•</span>
                <span>{previewPost.views.toLocaleString('en-IN')} views</span>
              </div>
            </div>

            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(previewPost.content, { USE_PROFILES: { html: true } }),
              }}
            />

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewPost(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toastNotification && (
        <div
          className={cn(
            'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2',
            toastNotification.type === 'success' &&
              'bg-emerald-50 text-emerald-800 border-emerald-200',
            toastNotification.type === 'error' && 'bg-rose-50 text-rose-800 border-rose-200',
            toastNotification.type === 'info' && 'bg-blue-50 text-blue-800 border-blue-200'
          )}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastNotification.message}</span>
        </div>
      )}
    </div>,
    { label: 'Loading blog…', variant: 'table' }
  );
};

// ----------------------------------------------------
// CREATE / EDIT BLOG POST MODAL COMPONENT
// ----------------------------------------------------

interface CreateEditPostModalProps {
  isOpen: boolean;
  initialData: BlogPost | null;
  onClose: () => void;
  onSave: (post: BlogPost) => Promise<void>;
}

const CreateEditPostModal: React.FC<CreateEditPostModalProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [category, setCategory] = useState(initialData?.category || 'WBP Constable');
  const [author, setAuthor] = useState(initialData?.author || 'Admin');
  const [status, setStatus] = useState<BlogPostStatus>(initialData?.status || 'published');
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.isFeatured || false);
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || PRESET_THUMBNAILS[0].url);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-slugify on title changes if creating new
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated || `post-${Date.now().toString(36)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<BlogPost> = {
        title,
        slug: slug.trim() || `post-${Date.now().toString(36)}`,
        category,
        author,
        status,
        isFeatured,
        thumbnail,
        excerpt: excerpt.trim() || title,
        content,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
      };

      let result: BlogPost;
      if (initialData) {
        result = await api.updateBlogPost(initialData.id, payload);
      } else {
        result = await api.createBlogPost(payload);
      }

      await onSave(result);
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData ? 'Edit Blog Post' : 'Create Blog Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. WBP Constable পরীক্ষার প্রস্তুতি : সম্পূর্ণ গাইড"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Slug & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="wbp-constable-guide"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WBP Constable">WBP Constable</option>
                <option value="General Knowledge">General Knowledge</option>
                <option value="Study Tips">Study Tips</option>
                <option value="Indian Polity">Indian Polity</option>
                <option value="General Science">General Science</option>
                <option value="Railway">Railway</option>
                <option value="Mathematics">Mathematics</option>
                <option value="History">History</option>
                <option value="Current Affairs">Current Affairs</option>
                <option value="Exam Strategy">Exam Strategy</option>
              </select>
            </div>
          </div>

          {/* Author & Status & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Admin">Admin</option>
                <option value="Susanta">Susanta</option>
                <option value="Puja">Puja</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Featured</label>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">Show in Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Thumbnail Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thumbnail Image
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                <img
                  src={thumbnail}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="Image URL or choose preset"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
              {PRESET_THUMBNAILS.map((pt) => (
                <button
                  type="button"
                  key={pt.name}
                  onClick={() => setThumbnail(pt.url)}
                  className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 whitespace-nowrap"
                >
                  {pt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Excerpt</label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for preview cards..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Content (HTML / Rich Text) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>Write your detailed blog post content here...</p>"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SEO Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Google SERP Title"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SEO Description
              </label>
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Google Meta Description"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Post' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// IMPORT BLOG POSTS MODAL COMPONENT
// ----------------------------------------------------

interface ImportPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (posts: Partial<BlogPost>[]) => Promise<void>;
}

const ImportPostsModal: React.FC<ImportPostsModalProps> = ({ onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const sampleJson = JSON.stringify(
    [
      {
        title: 'পশ্চিমবঙ্গ পুলিশের বিগত ৫ বছরের সাধারণ জ্ঞান',
        category: 'WBP Constable',
        author: 'Admin',
        status: 'published',
        isFeatured: true,
        excerpt: 'বিগত ৫ বছরের পরীক্ষায় আসা সেরা ৫০টি প্রশ্ন ও বিস্তারিত ব্যাখ্যা।',
        content:
          '<p>বিগত বছরের প্রশ্ন পর্যালোচনা করে দেখা গেছে এই টপিকগুলো থেকে সর্বাধিক প্রশ্ন আসে...</p>',
      },
    ],
    null,
    2
  );

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsImporting(true);
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('JSON must be a non-empty array of blog posts');
        return;
      }
      await onImport(parsed);
    } catch {
      toast.error('Invalid JSON format');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Import Blog Posts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Paste JSON formatted posts below. You can use the sample format as a template.
        </p>

        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">JSON Data</label>
              <button
                type="button"
                onClick={() => setJsonInput(sampleJson)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Load Sample
              </button>
            </div>
            <textarea
              rows={8}
              required
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="[{ 'title': '...', 'category': '...', 'content': '...' }]"
              className="w-full p-3 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import Posts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
