import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, DEFAULT_POPULAR_EXAMS } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  X,
  Layers,
  LayoutGrid,
  List,
  FileText,
  Check,
  Copy,
  SlidersHorizontal,
  BookOpen,
  Award,
  GraduationCap,
  FileCheck,
  Trophy,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Upload,
  GripVertical,
  Flame,
  Palette,
  ArrowRight,
  ArrowLeft,
  Calendar,
  RotateCcw,
  Eye,
} from 'lucide-react';
import type { Exam, MockTest, PopularExamCard } from '@/types';
import { cn } from '@/lib/utils';
import { PopularExamEditModal } from '@/pages/admin/PopularExamEditModal';
import { getErrorMessage } from '@/lib/errors';
import {
  normalizeLegacyExamCategory,
  LEGACY_EXAM_CATEGORY_NAMES,
} from '@/services/domains/admin.examCategories';

const STORAGE_KEY_CATEGORIES = 'practicekoro_exam_categories';
const DEFAULT_EXAM_CATEGORIES = [
  'WB Police (WBP / KP)',
  'WBPSC (Clerkship / WBCS)',
  'Teaching (TET / SLST)',
  'SSC & Central Govt.',
  'Railways (RRB)',
];

export const AdminExams: React.FC = () => {
  // Data States
  const [exams, setExams] = useState<Exam[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedSlugId, setCopiedSlugId] = useState<string | null>(null);

  // Tab State: 'all' = Target Exams table, 'popular' = Popular Exams Showcase
  const [activeTab, setActiveTab] = useState<'all' | 'popular'>('all');

  // Popular Exams Showcase States
  const [popularExams, setPopularExams] = useState<PopularExamCard[]>([]);
  const [isPopularSaving, setIsPopularSaving] = useState(false);
  const [editingPopularCard, setEditingPopularCard] = useState<PopularExamCard | null>(null);
  const [isPopularModalOpen, setIsPopularModalOpen] = useState(false);

  // Success Feedback
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Category Management States
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasLegacy = parsed.some(
            (c: string) => typeof c === 'string' && LEGACY_EXAM_CATEGORY_NAMES.has(c.toLowerCase())
          );
          if (!hasLegacy) return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading categories:', e);
    }
    return DEFAULT_EXAM_CATEGORIES;
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalInput, setCategoryModalInput] = useState('');
  const [categoryModalError, setCategoryModalError] = useState('');
  const [isInlineCreatingCategory, setIsInlineCreatingCategory] = useState(false);
  const [inlineCategoryInput, setInlineCategoryInput] = useState('');

  // Editing Category States
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [isRenamingCategory, setIsRenamingCategory] = useState(false);

  // Drag & Drop Category Reordering States
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);
  const [modalDraggedIndex, setModalDraggedIndex] = useState<number | null>(null);
  const [modalDragOverIndex, setModalDragOverIndex] = useState<number | null>(null);

  // Deleting Category States (when linked to exams)
  const [categoryToDelete, setCategoryToDelete] = useState<{
    name: string;
    examCount: number;
  } | null>(null);
  const [reassignCategoryTarget, setReassignCategoryTarget] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Auto-dismiss success notification
  useEffect(() => {
    if (!actionSuccessMessage) return;
    const timer = setTimeout(() => setActionSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [actionSuccessMessage]);

  // Load Initial Data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rawExams, allTests, dbCats, popCards] = await Promise.all([
        api.getAllAdminExams(),
        api.getAllAdminTests(),
        api.getExamCategories().catch(() => []),
        api.getPopularExams().catch(() => DEFAULT_POPULAR_EXAMS),
      ]);
      const allExams = (rawExams || []).map((e) => ({
        ...e,
        category: normalizeLegacyExamCategory(e.category),
      }));
      setExams(allExams);
      setTests(allTests);
      setPopularExams(popCards && popCards.length > 0 ? popCards : DEFAULT_POPULAR_EXAMS);
      if (dbCats && dbCats.length > 0) {
        const catNames = dbCats
          .map((c) => c.name)
          .filter((name) => !LEGACY_EXAM_CATEGORY_NAMES.has(name.toLowerCase()));
        const finalCats = catNames.length > 0 ? catNames : DEFAULT_EXAM_CATEGORIES;
        setCategories(finalCats);
        try {
          localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(finalCats));
        } catch (e) {
          console.error('Error saving categories:', e);
        }
      }
    } catch (err) {
      console.error('Error loading exams data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Popular Exams Handlers
  const handleSavePopularExams = async (updatedCards: PopularExamCard[]) => {
    try {
      setIsPopularSaving(true);
      await api.savePopularExams(updatedCards);
      setPopularExams(updatedCards);
      setActionSuccessMessage('🔥 Popular Exams showcase updated and published successfully!');
    } catch (err) {
      console.error('Failed to save popular exams:', err);
    } finally {
      setIsPopularSaving(false);
    }
  };

  const handleResetPopularExams = async () => {
    if (!window.confirm('Reset Popular Exams showcase to standard default cards?')) return;
    await handleSavePopularExams(DEFAULT_POPULAR_EXAMS);
  };

  const handleMovePopularCard = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= popularExams.length) return;
    const reordered = [...popularExams];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const updated = reordered.map((card, idx) => ({ ...card, orderIndex: idx + 1 }));
    await handleSavePopularExams(updated);
  };

  const handleTogglePopularActive = async (index: number) => {
    const updated = popularExams.map((c, i) =>
      i === index ? { ...c, isActive: c.isActive === false ? true : false } : c
    );
    await handleSavePopularExams(updated);
  };

  const handleDeletePopularCard = async (index: number) => {
    if (!window.confirm('Remove this exam from the Popular Exams showcase?')) return;
    const updated = popularExams.filter((_, i) => i !== index);
    await handleSavePopularExams(updated);
  };

  const openCreatePopularCard = () => {
    setEditingPopularCard({
      id: `popular-${Date.now()}`,
      title: 'New Exam',
      testsCount: '50+ Tests',
      cardBadge: '50+ Tests',
      cardGradientStart: '#0084FF',
      cardGradientEnd: '#0048C6',
      cardBgImage: '/images/exam_wbp_bg.png',
      cardEmblemUrl: '/images/exams/emblem_wbp.png',
      cardArrowColor: '#0066FF',
      orderIndex: popularExams.length + 1,
      route: '/test-series',
      isActive: true,
    });
    setIsPopularModalOpen(true);
  };

  const openEditPopularCard = (card: PopularExamCard) => {
    setEditingPopularCard({ ...card });
    setIsPopularModalOpen(true);
  };

  const handleSavePopularModal = async (cardData: PopularExamCard) => {
    let updated: PopularExamCard[];
    const existingIndex = popularExams.findIndex((c) => c.id === cardData.id);
    if (existingIndex >= 0) {
      updated = popularExams.map((c) => (c.id === cardData.id ? cardData : c));
    } else {
      updated = [...popularExams, { ...cardData, orderIndex: popularExams.length + 1 }];
    }
    await handleSavePopularExams(updated);
    setIsPopularModalOpen(false);
    setEditingPopularCard(null);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute test counts per exam
  const examTestCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (tests || []).forEach((t) => {
      if (t.examId) {
        counts[t.examId] = (counts[t.examId] || 0) + 1;
      }
    });
    return counts;
  }, [tests]);

  // Ensure any category from existing exams is registered in categories list
  useEffect(() => {
    if (exams.length > 0) {
      setCategories((prev) => {
        const set = new Set<string>(prev);
        const newCats: string[] = [];
        exams.forEach((e) => {
          const cat = e.category?.trim();
          if (cat && !set.has(cat) && !LEGACY_EXAM_CATEGORY_NAMES.has(cat.toLowerCase())) {
            set.add(cat);
            newCats.push(cat);
          }
        });
        if (newCats.length > 0) {
          const updated = [...prev, ...newCats];
          try {
            localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
          } catch (err) {
            console.error('Error saving updated categories:', err);
          }
          return updated;
        }
        return prev;
      });
    }
  }, [exams]);

  // Category helpers
  const addCategoryItem = async (catName: string): Promise<boolean> => {
    const trimmed = catName.trim();
    if (!trimmed) return false;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving custom category:', e);
    }
    try {
      await api.createExamCategory(trimmed, updated.length);
    } catch (e) {
      console.warn('Failed to save category to DB, using local fallback:', e);
    }
    return true;
  };

  const handleReorderCategories = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setCategories(reordered);
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(reordered));
    } catch (e) {
      console.error('Error saving reordered categories:', e);
    }

    try {
      const payload = reordered.map((cat, idx) => ({
        name: cat,
        orderIndex: idx + 1,
      }));
      await api.reorderExamCategories(payload);
    } catch (err) {
      console.warn('Failed to sync reordered categories with backend:', err);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      setCategoryModalError('Category name cannot be empty.');
      return;
    }
    if (trimmedNew.toLowerCase() === oldName.toLowerCase()) {
      setEditingCategoryKey(null);
      setEditingCategoryValue('');
      return;
    }
    if (
      categories.some(
        (c) =>
          c.toLowerCase() === trimmedNew.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase()
      )
    ) {
      setCategoryModalError(`Category "${trimmedNew}" already exists.`);
      return;
    }

    try {
      setIsRenamingCategory(true);
      setCategoryModalError('');

      // 1. Update exams in database if any are linked
      const linkedExams = exams.filter(
        (e) => (e.category || '').toLowerCase() === oldName.toLowerCase()
      );
      if (linkedExams.length > 0) {
        await Promise.all(linkedExams.map((e) => api.updateExam(e.id, { category: trimmedNew })));
        setExams((prev) =>
          prev.map((e) =>
            (e.category || '').toLowerCase() === oldName.toLowerCase()
              ? { ...e, category: trimmedNew }
              : e
          )
        );
      }

      // 2. Update category in database
      try {
        await api.updateExamCategory(oldName, trimmedNew);
      } catch (err) {
        console.warn('Failed to update category in DB:', err);
      }

      // 3. Update category list in state & localStorage (preserving current order)
      const updated = categories.map((c) =>
        c.toLowerCase() === oldName.toLowerCase() ? trimmedNew : c
      );
      setCategories(updated);
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving renamed category:', e);
      }

      // 4. Update active form / filter states if applicable
      if (category.toLowerCase() === oldName.toLowerCase()) {
        setCategory(trimmedNew);
      }
      if (selectedCategory.toLowerCase() === oldName.toLowerCase()) {
        setSelectedCategory(trimmedNew);
      }

      setEditingCategoryKey(null);
      setEditingCategoryValue('');
      setActionSuccessMessage(
        linkedExams.length > 0
          ? `Category renamed to "${trimmedNew}" and updated ${linkedExams.length} linked exam(s).`
          : `Category renamed to "${trimmedNew}".`
      );
    } catch (err) {
      setCategoryModalError(getErrorMessage(err, 'Failed to rename category'));
    } finally {
      setIsRenamingCategory(false);
    }
  };

  const handleDeleteCategory = async (catName: string, reassignTo?: string) => {
    try {
      setIsRenamingCategory(true);
      setCategoryModalError('');

      const linkedExams = exams.filter(
        (e) => (e.category || '').toLowerCase() === catName.toLowerCase()
      );

      // If exams are linked, reassign them to the chosen target
      if (linkedExams.length > 0) {
        const target = reassignTo && reassignTo.trim() ? reassignTo.trim() : 'General';
        await Promise.all(linkedExams.map((e) => api.updateExam(e.id, { category: target })));
        setExams((prev) =>
          prev.map((e) =>
            (e.category || '').toLowerCase() === catName.toLowerCase()
              ? { ...e, category: target }
              : e
          )
        );
      }

      // Delete category in database & API
      await api.deleteExamCategory(catName);

      // Remove from categories list (preserving order)
      const updated = categories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
      if (reassignTo && !updated.some((c) => c.toLowerCase() === reassignTo.toLowerCase())) {
        updated.push(reassignTo);
      }

      setCategories(updated);
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error removing category:', e);
      }

      if (category.toLowerCase() === catName.toLowerCase()) {
        setCategory(updated[0] || '');
      }
      if (selectedCategory.toLowerCase() === catName.toLowerCase()) {
        setSelectedCategory('all');
      }

      setCategoryToDelete(null);
      setReassignCategoryTarget('');

      // Refresh data from API/database to confirm removal and refresh UI
      await loadData();

      setActionSuccessMessage(
        linkedExams.length > 0
          ? `Category "${catName}" deleted and ${linkedExams.length} exam(s) reassigned to "${reassignTo || 'General'}".`
          : `Category "${catName}" deleted successfully.`
      );
    } catch (err) {
      setCategoryModalError(getErrorMessage(err, 'Failed to delete category'));
    } finally {
      setIsRenamingCategory(false);
    }
  };

  // Icon upload handlers
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError('Icon file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setIconPreview(result);
      setIconName(result);
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveIcon = () => {
    setIconPreview('');
    setIconName('');
  };

  // Summary Metrics
  const stats = useMemo(() => {
    const total = exams.length;
    const active = exams.filter((e) => e.isActive).length;
    const inactive = total - active;
    const testsCount = tests.filter((t) => !!t.examId).length;
    const catCount = categories.length;
    return { total, active, inactive, testsCount, catCount };
  }, [exams, tests, categories]);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams
      .filter((e) => {
        const matchesSearch =
          searchTerm.trim() === '' ||
          e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'all' || e.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'active' && e.isActive) ||
          (selectedStatus === 'inactive' && !e.isActive);

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [exams, searchTerm, selectedCategory, selectedStatus]);

  // Modal Handlers
  const openCreateModal = () => {
    setEditingExam(null);
    setTitle('');
    setSlug('');
    setCategory(categories[0] || '');
    setDescription('');
    setIconName('');
    setIconPreview('');
    setIsInlineCreatingCategory(categories.length === 0);
    setInlineCategoryInput('');
    setOrderIndex(exams.length + 1);
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setTitle(exam.title);
    setSlug(exam.slug);
    setCategory(exam.category || categories[0] || '');
    setDescription(exam.description || '');
    setIconName(exam.iconName || '');
    setIconPreview(exam.iconName || '');
    setIsInlineCreatingCategory(false);
    setInlineCategoryInput('');
    setOrderIndex(exam.orderIndex);
    setIsActive(exam.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingExam) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Exam title is required.');
      return;
    }
    if (!category.trim()) {
      setFormError('Please select or create an Exam Category.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');
      const finalIcon = iconName.trim() || 'Shield';

      if (editingExam) {
        await api.updateExam(editingExam.id, {
          title: title.trim(),
          slug: slug.trim() || undefined,
          category: category.trim(),
          description: description.trim() || undefined,
          iconName: finalIcon,
          orderIndex: Number(orderIndex),
          isActive,
        });
        setActionSuccessMessage(`Exam "${title.trim()}" updated successfully.`);
      } else {
        await api.createExam({
          title: title.trim(),
          slug:
            slug.trim() ||
            title
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
          category: category.trim(),
          description: description.trim() || undefined,
          iconName: finalIcon,
          orderIndex: Number(orderIndex),
          isActive,
        });
        setActionSuccessMessage(`Exam "${title.trim()}" created successfully.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save exam'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (exam: Exam) => {
    try {
      await api.updateExam(exam.id, { isActive: !exam.isActive });
      setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, isActive: !e.isActive } : e)));
      setActionSuccessMessage(
        `Exam "${exam.title}" is now ${!exam.isActive ? 'Active' : 'Inactive'}.`
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleConfirmDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      await api.deleteExam(examToDelete.id);
      setExams((prev) => prev.filter((e) => e.id !== examToDelete.id));
      setActionSuccessMessage(`Exam "${examToDelete.title}" deleted successfully.`);
      setExamToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete exam'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySlug = (slugText: string, examId: string) => {
    navigator.clipboard.writeText(slugText);
    setCopiedSlugId(examId);
    setTimeout(() => setCopiedSlugId(null), 2000);
  };

  // Category Badge Colors
  const getCategoryBadgeColor = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('police')) {
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    }
    if (lower.includes('civil') || lower.includes('wbcs')) {
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    }
    if (lower.includes('clerk') || lower.includes('state govt')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    }
    if (lower.includes('ssc') || lower.includes('staff')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    }
    if (lower.includes('rail') || lower.includes('rrb')) {
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  // Render Icon helper (supports uploaded image data URLs or legacy icon strings)
  const renderExamIcon = (icon?: string, className: string = 'w-5 h-5') => {
    if (!icon) return <Shield className={className} />;
    if (
      icon.startsWith('data:image') ||
      icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('/') ||
      icon.startsWith('blob:')
    ) {
      return (
        <img src={icon} alt="Exam Icon" className={`${className} object-contain rounded-md`} />
      );
    }
    switch (icon) {
      case 'Award':
        return <Award className={className} />;
      case 'FileCheck':
        return <FileCheck className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      default:
        return <Shield className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast / Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Competitive Exams Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {stats.total} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Create and manage target recruitment exams, categories, and active platform availability.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            leftIcon={<Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Exam Categories
          </Button>

          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Add Target Exam
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Target Exams</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          <p className="text-[11px] text-slate-400">Total recruitment exams</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Active on Platform</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </div>
          <p className="text-[11px] text-slate-400">Live for student practice</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Inactive / Draft</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.inactive}
          </div>
          <p className="text-[11px] text-slate-400">Hidden from students</p>
        </div>

        <div
          onClick={() => setIsCategoryModalOpen(true)}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-colors"
          title="Click to view and manage categories"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Exam Categories</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.catCount}</div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
            <span>Manage categories</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* View Switcher: All Target Exams vs Popular Exams Showcase */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          )}
        >
          <Shield className="w-4 h-4" />
          <span>All Target Exams</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] font-black',
              activeTab === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            )}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('popular')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'popular'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          )}
        >
          <Flame className="w-4 h-4 text-amber-300" />
          <span>🔥 Popular Exams Showcase</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] font-black',
              activeTab === 'popular'
                ? 'bg-white/20 text-white'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            )}
          >
            {popularExams.filter((c) => c.isActive !== false).length} Live
          </span>
        </button>
      </div>

      {activeTab === 'popular' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header Action Bar */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200/80 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Student Homepage — Popular Exams Showcase
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider">
                  Live on Homepage
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Configure the prominent cards shown under "🔥 Popular Exams" on the student dashboard. All titles, tests count badges, background artwork, center emblems, and gradient colors are 100% dynamic, vector-sharp, and configurable.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
                onClick={handleResetPopularExams}
                disabled={isPopularSaving}
              >
                Reset Defaults
              </Button>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={openCreatePopularCard}
                disabled={isPopularSaving}
              >
                Add Showcase Card
              </Button>
            </div>
          </div>

          {/* Cards Showcase Preview & Manager */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>Live Student Homepage Preview ({popularExams.length} Cards)</span>
              </h4>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click "Edit Styling" on any card to customize its text, colors, backdrop art, or emblem
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {popularExams.map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  {/* Card Order Badge & Active Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {card.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePopularActive(idx)}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors',
                        card.isActive !== false
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      )}
                    >
                      {card.isActive !== false ? '● Live' : 'Hidden'}
                    </button>
                  </div>

                  {/* 1:1 Live Interactive Visual Card */}
                  <div
                    className="relative aspect-[3/2] w-full rounded-[18px] overflow-hidden shadow-md group block select-none"
                    style={{
                      background: `linear-gradient(135deg, ${card.cardGradientStart || '#0084FF'}, ${card.cardGradientEnd || '#0048C6'})`,
                    }}
                  >
                    {card.cardBgImage && (
                      <img
                        src={card.cardBgImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/16 via-white/5 to-transparent pointer-events-none" />
                    {card.cardEmblemUrl && (
                      <div className="absolute top-[33%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none">
                        <img
                          src={card.cardEmblemUrl}
                          alt={card.title}
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 p-3.5 flex flex-col justify-end text-white pointer-events-none">
                      <h3 className="text-base font-black tracking-tight text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight mb-2">
                        {card.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                          <Calendar className="w-3.5 h-3.5 text-white" />
                          <span>{card.cardBadge || card.testsCount}</span>
                        </div>
                        <div
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md pointer-events-auto"
                          style={{ color: card.cardArrowColor || '#0066FF' }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Meta & Color Preview */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3 h-3 text-slate-400" />
                      <span className="font-mono text-[10px]">{card.cardGradientStart}</span>
                      <span>→</span>
                      <span className="font-mono text-[10px]">{card.cardGradientEnd}</span>
                    </div>
                    <span className="truncate max-w-[120px] text-[10px] font-mono">{card.route}</span>
                  </div>

                  {/* Card Action Controls */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMovePopularCard(idx, 'left')}
                        disabled={idx === 0 || isPopularSaving}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Card Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePopularCard(idx, 'right')}
                        disabled={idx === popularExams.length - 1 || isPopularSaving}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Card Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Edit2 className="w-3 h-3 text-indigo-500" />}
                        onClick={() => openEditPopularCard(card)}
                        className="text-xs font-semibold"
                      >
                        Edit Styling
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDeletePopularCard(idx)}
                        disabled={isPopularSaving}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filter / Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search exams by title, category, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Toolbar Controls: Status Filter & View Mode */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
              {(['all', 'active', 'inactive'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                    selectedStatus === st
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3 h-3" />
            Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            All Categories ({exams.length})
          </button>
          {categories.map((cat, idx) => {
            const count = exams.filter((e) => e.category === cat).length;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const isDragged = draggedCategoryIndex === idx;
            const isDragOver = dragOverCategoryIndex === idx;
            return (
              <button
                key={cat}
                type="button"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', idx.toString());
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedCategoryIndex(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragEnter={() => {
                  if (draggedCategoryIndex !== null && draggedCategoryIndex !== idx) {
                    setDragOverCategoryIndex(idx);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverCategoryIndex === idx) {
                    setDragOverCategoryIndex(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedCategoryIndex !== null && draggedCategoryIndex !== idx) {
                    handleReorderCategories(draggedCategoryIndex, idx);
                  }
                  setDraggedCategoryIndex(null);
                  setDragOverCategoryIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedCategoryIndex(null);
                  setDragOverCategoryIndex(null);
                }}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80'
                } ${isDragged ? 'opacity-40 scale-95' : ''} ${
                  isDragOver
                    ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-500 scale-105'
                    : ''
                }`}
                title={`Drag to reorder "${cat}" or click to filter`}
              >
                {cat} ({count})
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-dashed border-indigo-300 dark:border-indigo-700 flex items-center gap-1 ml-auto sm:ml-0"
            title="Create and manage categories"
          >
            <Plus className="w-3 h-3" />
            <span>+ Category</span>
          </button>
        </div>
      </div>

      {/* Main Content: Loading, Empty, Grid, or Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="w-12 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-6 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-16 h-4 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Competitive Exams Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'No exams match your active search and filter criteria. Try resetting filters.'
              : 'Get started by creating your first target recruitment examination category.'}
          </p>
          {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Target Exam
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* =================================================================== */
        /* CARD GRID VIEW                                                      */
        /* =================================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const testCount = examTestCounts[exam.id] || 0;
            return (
              <div
                key={exam.id}
                className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
              >
                {/* Accent Top Border Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                    exam.isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-sky-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />

                <div className="space-y-3.5">
                  {/* Card Header: Category Badge, Order Index, Status Toggle */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${getCategoryBadgeColor(
                        exam.category
                      )}`}
                    >
                      {exam.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        #{exam.orderIndex}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(exam)}
                        title={exam.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          exam.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            exam.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  {/* Exam Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 overflow-hidden">
                      {renderExamIcon(exam.iconName, 'w-5 h-5')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                        {exam.title}
                      </h3>
                      {/* Monospace Slug with Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopySlug(exam.slug, exam.id)}
                        title="Copy Exam URL Slug"
                        className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <span>/{exam.slug}</span>
                        {copiedSlugId === exam.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {exam.description || 'No detailed description provided for this exam.'}
                  </p>

                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-[11px]">
                      {testCount} {testCount === 1 ? 'Mock Test' : 'Mock Tests'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(exam)}
                      title="Edit Exam"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamToDelete(exam)}
                      title="Delete Exam"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =================================================================== */
        /* TABLE VIEW                                                          */
        /* =================================================================== */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Exam Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Slug / Route</th>
                  <th className="p-4 text-center">Tests</th>
                  <th className="p-4 text-center">Order</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredExams.map((exam) => {
                  const testCount = examTestCounts[exam.id] || 0;
                  return (
                    <tr
                      key={exam.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Exam Title & Description */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 overflow-hidden">
                            {renderExamIcon(exam.iconName, 'w-4 h-4')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {exam.title}
                            </p>
                            {exam.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">
                                {exam.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeColor(
                            exam.category
                          )}`}
                        >
                          {exam.category}
                        </span>
                      </td>

                      {/* Slug */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleCopySlug(exam.slug, exam.id)}
                          className="font-mono text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                          title="Copy slug"
                        >
                          <span>/{exam.slug}</span>
                          {copiedSlugId === exam.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-40" />
                          )}
                        </button>
                      </td>

                      {/* Associated Tests */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{testCount}</span>
                        </span>
                      </td>

                      {/* Order Index */}
                      <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        #{exam.orderIndex}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(exam)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            exam.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              exam.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(exam)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Exam"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExamToDelete(exam)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* =================================================================== */}
      {/* MODAL: Add / Edit Exam                                              */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingExam ? 'Edit Target Exam' : 'Add Target Recruitment Exam'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure exam title, category, URL slug, and icon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WBP Constable 2025"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  URL Slug / ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. wbp-constable"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Icon Upload (Replacing Icon Theme) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Exam Icon / Logo
                </label>
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  {/* Icon Thumbnail Preview */}
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    {iconPreview ? (
                      <img
                        src={iconPreview}
                        alt="Exam Icon Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Shield className="w-7 h-7 text-indigo-400 opacity-60" />
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{iconPreview ? 'Change Icon' : 'Upload Icon'}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleIconUpload}
                          className="hidden"
                        />
                      </label>

                      {iconPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveIcon}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Upload custom exam badge or logo (PNG, SVG, JPG under 2MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Exam Category (Dynamic with Create Option) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Exam Category *
                  </label>
                  {!isInlineCreatingCategory && (
                    <button
                      type="button"
                      onClick={() => setIsInlineCreatingCategory(true)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Category</span>
                    </button>
                  )}
                </div>

                {isInlineCreatingCategory ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                      <input
                        type="text"
                        placeholder="Enter category name (e.g. Police, Defence, WBPSC)..."
                        value={inlineCategoryInput}
                        onChange={(e) => setInlineCategoryInput(e.target.value)}
                        autoFocus
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (inlineCategoryInput.trim()) {
                              await addCategoryItem(inlineCategoryInput.trim());
                              setCategory(inlineCategoryInput.trim());
                              setInlineCategoryInput('');
                              setIsInlineCreatingCategory(false);
                            }
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (inlineCategoryInput.trim()) {
                            await addCategoryItem(inlineCategoryInput.trim());
                            setCategory(inlineCategoryInput.trim());
                            setInlineCategoryInput('');
                            setIsInlineCreatingCategory(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInlineCreatingCategory(false);
                          setInlineCategoryInput('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Press Enter or click Save to create and select this category.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__CREATE_NEW__') {
                          setIsInlineCreatingCategory(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Exam Category --</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__CREATE_NEW__" className="text-indigo-600 font-bold">
                        + Create New Category...
                      </option>
                    </select>

                    {categories.length === 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        No categories exist yet. Click &quot;Create Category&quot; above or select
                        it from the dropdown to add your first category.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description shown on student cards and catalogs..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Active on Platform
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs"
                >
                  {isSaving ? 'Saving...' : editingExam ? 'Save Changes' : 'Create Exam'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: Manage Exam Categories                                       */}
      {/* =================================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Manage Exam Categories
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create and organize categories for recruitment exams
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryModalInput('');
                  setCategoryModalError('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryModalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{categoryModalError}</span>
              </div>
            )}

            {/* Add Category Form */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Create New Category
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Police, Defence, WBPSC, SSC..."
                  value={categoryModalInput}
                  onChange={(e) => {
                    setCategoryModalInput(e.target.value);
                    setCategoryModalError('');
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!categoryModalInput.trim()) {
                        setCategoryModalError('Category name is required.');
                        return;
                      }
                      const added = await addCategoryItem(categoryModalInput.trim());
                      if (!added) {
                        setCategoryModalError('This category already exists.');
                        return;
                      }
                      setCategoryModalInput('');
                      setCategoryModalError('');
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    if (!categoryModalInput.trim()) {
                      setCategoryModalError('Category name is required.');
                      return;
                    }
                    const added = await addCategoryItem(categoryModalInput.trim());
                    if (!added) {
                      setCategoryModalError('This category already exists.');
                      return;
                    }
                    setCategoryModalInput('');
                    setCategoryModalError('');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 shadow-xs"
                >
                  Create
                </Button>
              </div>
            </div>

            {/* Category Deletion Confirmation Card (When Linked Exams Exist) */}
            {categoryToDelete && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Delete &ldquo;{categoryToDelete.name}&rdquo;?
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                      This category is currently linked to{' '}
                      <strong>{categoryToDelete.examCount}</strong> exam(s). Choose a category to
                      reassign them to:
                    </p>
                  </div>
                </div>

                <div>
                  <select
                    value={reassignCategoryTarget}
                    onChange={(e) => setReassignCategoryTarget(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    {categories
                      .filter((c) => c.toLowerCase() !== categoryToDelete.name.toLowerCase())
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryToDelete(null);
                      setReassignCategoryTarget('');
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isRenamingCategory}
                    onClick={() =>
                      handleDeleteCategory(
                        categoryToDelete.name,
                        reassignCategoryTarget ||
                          categories.filter(
                            (c) => c.toLowerCase() !== categoryToDelete.name.toLowerCase()
                          )[0] ||
                          'General'
                      )
                    }
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-1 h-7 px-3 shadow-xs"
                  >
                    {isRenamingCategory ? 'Deleting...' : 'Reassign & Delete'}
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Categories List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Available Categories ({categories.length})
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {categories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No categories created yet. Type above and click Create!
                  </div>
                ) : (
                  categories.map((cat, idx) => {
                    const examCount = exams.filter(
                      (e) => (e.category || '').toLowerCase() === cat.toLowerCase()
                    ).length;
                    const isEditing = editingCategoryKey === cat;

                    if (isEditing) {
                      return (
                        <div
                          key={cat}
                          className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs animate-fade-in"
                        >
                          <input
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameCategory(cat, editingCategoryValue);
                              } else if (e.key === 'Escape') {
                                setEditingCategoryKey(null);
                                setEditingCategoryValue('');
                              }
                            }}
                            disabled={isRenamingCategory}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameCategory(cat, editingCategoryValue)}
                            disabled={isRenamingCategory}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                            title="Save Changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryKey(null);
                              setEditingCategoryValue('');
                            }}
                            disabled={isRenamingCategory}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    const isModalDragged = modalDraggedIndex === idx;
                    const isModalDragOver = modalDragOverIndex === idx;

                    return (
                      <div
                        key={cat}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', idx.toString());
                          e.dataTransfer.effectAllowed = 'move';
                          setModalDraggedIndex(idx);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragEnter={() => {
                          if (modalDraggedIndex !== null && modalDraggedIndex !== idx) {
                            setModalDragOverIndex(idx);
                          }
                        }}
                        onDragLeave={() => {
                          if (modalDragOverIndex === idx) {
                            setModalDragOverIndex(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (modalDraggedIndex !== null && modalDraggedIndex !== idx) {
                            handleReorderCategories(modalDraggedIndex, idx);
                          }
                          setModalDraggedIndex(null);
                          setModalDragOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setModalDraggedIndex(null);
                          setModalDragOverIndex(null);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs transition-all ${
                          isModalDragged ? 'opacity-40 scale-98' : ''
                        } ${
                          isModalDragOver
                            ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                            : 'hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span title="Drag to reorder">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing shrink-0" />
                          </span>
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {cat}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 shrink-0">
                            {examCount} {examCount === 1 ? 'exam' : 'exams'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryKey(cat);
                              setEditingCategoryValue(cat);
                              setCategoryModalError('');
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title="Edit Category Name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryModalError('');
                              if (examCount > 0) {
                                setCategoryToDelete({ name: cat, examCount });
                                const other =
                                  categories.find((c) => c.toLowerCase() !== cat.toLowerCase()) ||
                                  'General';
                                setReassignCategoryTarget(other);
                              } else {
                                handleDeleteCategory(cat);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryModalInput('');
                  setCategoryModalError('');
                }}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: Delete Exam Confirmation                                    */}
      {/* =================================================================== */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Target Exam?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent Removal Confirmation
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                {deleteError}
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {examToDelete.title}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Category: {examToDelete.category}</span>
                <span>•</span>
                <span>Slug: /{examToDelete.slug}</span>
                <span>•</span>
                <span>Tests: {examTestCounts[examToDelete.id] || 0}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this exam? Mock tests and syllabus mappings linked to
              this exam may be affected.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setExamToDelete(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDeleteExam}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Exam'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Popular Exam Card Styling & Content */}
      <PopularExamEditModal
        isOpen={isPopularModalOpen}
        onClose={() => {
          setIsPopularModalOpen(false);
          setEditingPopularCard(null);
        }}
        card={editingPopularCard}
        onSave={handleSavePopularModal}
        existingExams={exams}
      />
    </div>
  );
};
