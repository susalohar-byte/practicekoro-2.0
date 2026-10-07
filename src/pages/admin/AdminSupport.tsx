import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Hourglass,
  Star,
  ExternalLink,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MoreHorizontal,
  Phone,
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  Smile,
  Download,
  FileText,
  Check,
  X,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';

// ============================================================================
// DATA TYPES & INTERFACES
// ============================================================================

export type TicketCategory =
  | 'Payment Issue'
  | 'Subscription'
  | 'Technical Issue'
  | 'Content Related'
  | 'Account Related'
  | 'Refund Request'
  | 'Other';

export type TicketPriority = 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface ChatMessage {
  id: string;
  sender: 'student' | 'support' | 'internal_note';
  senderName: string;
  avatarText: string;
  avatarBgColor: string;
  time: string;
  message: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf';
  url?: string;
}

export interface TicketRecord {
  id: string;
  ticketNumber: string; // e.g. '#PKT-1048'
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  avatarText: string;
  avatarBgColor: string;
  subject: string;
  excerpt: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  dateStr: string;
  channel: string;
  attachments?: AttachmentItem[];
  messages: ChatMessage[];
}

// Initial 10 tickets strictly matching screenshot media_1791202466769.jpg
const INITIAL_TICKETS: TicketRecord[] = [
  {
    id: 'tkt-1',
    ticketNumber: '#PKT-1048',
    studentName: 'Rohit Kumar',
    studentEmail: 'rohitkumar@gmail.com',
    studentPhone: '+91 98765 43210',
    avatarText: 'RK',
    avatarBgColor: 'bg-[#2563EB] text-white',
    subject: 'Payment failed but amount deducted',
    excerpt: 'I tried to purchase the Pro plan but payment failed. Amount ...',
    message:
      'I tried to purchase the Pro plan but payment failed. Amount was deducted from my bank account. Transaction ID: UPI_1234567890. Please check and resolve this issue as soon as possible.',
    category: 'Payment Issue',
    priority: 'High',
    status: 'Open',
    dateStr: '12 Sep 2026, 10:30 AM',
    channel: 'via Website',
    attachments: [
      {
        id: 'att-1',
        name: 'payment_screenshot.png',
        size: '245 KB',
        type: 'image',
      },
      {
        id: 'att-2',
        name: 'txn_receipt.pdf',
        size: '320 KB',
        type: 'pdf',
      },
    ],
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Rohit Kumar',
        avatarText: 'RK',
        avatarBgColor: 'bg-blue-600 text-white',
        time: '12 Sep 2026, 10:30 AM',
        message:
          'I tried to purchase the Pro plan but payment failed. Amount was deducted from my bank account.',
      },
      {
        id: 'msg-2',
        sender: 'support',
        senderName: 'Support Team',
        avatarText: 'S',
        avatarBgColor: 'bg-blue-600 text-white',
        time: '12 Sep 2026, 11:05 AM',
        message:
          'Hi Rohit,\nThank you for contacting us. We have received your request and are checking the transaction details. We will get back to you shortly.',
      },
    ],
  },
  {
    id: 'tkt-2',
    ticketNumber: '#PKT-1047',
    studentName: 'Sneha Khatun',
    studentEmail: 'sneha.kt@gmail.com',
    studentPhone: '+91 98765 43211',
    avatarText: 'SK',
    avatarBgColor: 'bg-rose-100 text-rose-600',
    subject: 'How to access mock tests?',
    excerpt: 'I have purchased the Basic plan but I cannot see the mock t...',
    message:
      'I have purchased the Basic plan but I cannot see the mock tests for WBP SI exam. Please guide me where to find them.',
    category: 'Subscription',
    priority: 'Medium',
    status: 'Resolved',
    dateStr: '12 Sep 2026, 09:45 AM',
    channel: 'via Android App',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Sneha Khatun',
        avatarText: 'SK',
        avatarBgColor: 'bg-rose-100 text-rose-600',
        time: '12 Sep 2026, 09:45 AM',
        message: 'I have purchased the Basic plan but I cannot see the mock tests.',
      },
      {
        id: 'msg-2',
        sender: 'support',
        senderName: 'Support Team',
        avatarText: 'S',
        avatarBgColor: 'bg-blue-600 text-white',
        time: '12 Sep 2026, 10:00 AM',
        message: 'Hi Sneha, the mock tests are available under the "Test Series" tab on your dashboard.',
      },
    ],
  },
  {
    id: 'tkt-3',
    ticketNumber: '#PKT-1046',
    studentName: 'Arijit Pal',
    studentEmail: 'arijit.pal@gmail.com',
    studentPhone: '+91 98765 43212',
    avatarText: 'AP',
    avatarBgColor: 'bg-purple-100 text-purple-600',
    subject: 'Wrong answer in History question',
    excerpt: 'The answer for question ID 12345 is incorrect. Please check...',
    message:
      'The answer for question ID 12345 in WBP Constable Full Mock 3 is marked as Battle of Plassey 1764, but it happened in 1757. Please correct this.',
    category: 'Content Related',
    priority: 'Medium',
    status: 'In Progress',
    dateStr: '11 Sep 2026, 08:20 PM',
    channel: 'via Website',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Arijit Pal',
        avatarText: 'AP',
        avatarBgColor: 'bg-purple-100 text-purple-600',
        time: '11 Sep 2026, 08:20 PM',
        message: 'The answer for question ID 12345 is incorrect. Please check.',
      },
      {
        id: 'msg-2',
        sender: 'support',
        senderName: 'Support Team',
        avatarText: 'S',
        avatarBgColor: 'bg-blue-600 text-white',
        time: '11 Sep 2026, 08:45 PM',
        message: 'Our academic review team has received your query and is reviewing question #12345.',
      },
    ],
  },
  {
    id: 'tkt-4',
    ticketNumber: '#PKT-1045',
    studentName: 'Moumita Das',
    studentEmail: 'moumita.das@gmail.com',
    studentPhone: '+91 98765 43213',
    avatarText: 'MD',
    avatarBgColor: 'bg-emerald-100 text-emerald-700',
    subject: 'Unable to login to my account',
    excerpt: 'I am not able to login. It shows invalid OTP every time...',
    message:
      'I am not able to login to my account. It shows invalid OTP every time I request an SMS code on +91 98765 43213.',
    category: 'Account Related',
    priority: 'Medium',
    status: 'Open',
    dateStr: '11 Sep 2026, 06:15 PM',
    channel: 'via Android App',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Moumita Das',
        avatarText: 'MD',
        avatarBgColor: 'bg-emerald-100 text-emerald-700',
        time: '11 Sep 2026, 06:15 PM',
        message: 'I am not able to login. It shows invalid OTP every time.',
      },
    ],
  },
  {
    id: 'tkt-5',
    ticketNumber: '#PKT-1044',
    studentName: 'Subhankar Bera',
    studentEmail: 'subhankar.bera@gmail.com',
    studentPhone: '+91 98765 43214',
    avatarText: 'SB',
    avatarBgColor: 'bg-amber-100 text-amber-700',
    subject: 'Refund request for annual plan',
    excerpt: 'I want to cancel my plan and get a refund. I purchased by mi...',
    message:
      'I want to cancel my plan and get a refund. I purchased by mistake instead of the 6 Months plan. Please process the difference or full refund.',
    category: 'Refund Request',
    priority: 'High',
    status: 'Open',
    dateStr: '10 Sep 2026, 04:10 PM',
    channel: 'via Website',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Subhankar Bera',
        avatarText: 'SB',
        avatarBgColor: 'bg-amber-100 text-amber-700',
        time: '10 Sep 2026, 04:10 PM',
        message: 'I want to cancel my plan and get a refund. I purchased by mistake.',
      },
    ],
  },
  {
    id: 'tkt-6',
    ticketNumber: '#PKT-1043',
    studentName: 'Taniya Roy',
    studentEmail: 'taniya.roy@gmail.com',
    studentPhone: '+91 98765 43215',
    avatarText: 'TR',
    avatarBgColor: 'bg-rose-100 text-rose-600',
    subject: 'App not working on mobile',
    excerpt: 'The app keeps crashing on my Android phone...',
    message:
      'The app keeps crashing on my Android phone whenever I try to submit a mock test. My device is Redmi Note 12 running Android 13.',
    category: 'Technical Issue',
    priority: 'Medium',
    status: 'Open',
    dateStr: '10 Sep 2026, 02:30 PM',
    channel: 'via Android App',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Taniya Roy',
        avatarText: 'TR',
        avatarBgColor: 'bg-rose-100 text-rose-600',
        time: '10 Sep 2026, 02:30 PM',
        message: 'The app keeps crashing on my Android phone.',
      },
    ],
  },
  {
    id: 'tkt-7',
    ticketNumber: '#PKT-1042',
    studentName: 'Abhijit Sarkar',
    studentEmail: 'abhijit.sarkar@gmail.com',
    studentPhone: '+91 98765 43216',
    avatarText: 'AS',
    avatarBgColor: 'bg-sky-100 text-sky-700',
    subject: 'When will new WBP PYQ be added?',
    excerpt: 'Please add the 2025 WBP Constable question paper...',
    message:
      'Please add the 2025 WBP Constable question paper with detailed Bengali explanations. We need it for revision.',
    category: 'Content Related',
    priority: 'Low',
    status: 'Resolved',
    dateStr: '09 Sep 2026, 11:45 AM',
    channel: 'via Website',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Abhijit Sarkar',
        avatarText: 'AS',
        avatarBgColor: 'bg-sky-100 text-sky-700',
        time: '09 Sep 2026, 11:45 AM',
        message: 'Please add the 2025 WBP Constable question paper.',
      },
      {
        id: 'msg-2',
        sender: 'support',
        senderName: 'Support Team',
        avatarText: 'S',
        avatarBgColor: 'bg-blue-600 text-white',
        time: '09 Sep 2026, 12:15 PM',
        message: '2025 WBP Constable question paper has been added to Previous Years section.',
      },
    ],
  },
  {
    id: 'tkt-8',
    ticketNumber: '#PKT-1041',
    studentName: 'Puja Dey',
    studentEmail: 'puja.dey@gmail.com',
    studentPhone: '+91 98765 43217',
    avatarText: 'PD',
    avatarBgColor: 'bg-purple-100 text-purple-600',
    subject: 'Subscription renewal date',
    excerpt: 'Please tell me when my subscription will expire...',
    message:
      'Please tell me when my subscription will expire and how to renew with auto-renewal disabled.',
    category: 'Subscription',
    priority: 'Low',
    status: 'Resolved',
    dateStr: '09 Sep 2026, 09:20 AM',
    channel: 'via Website',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Puja Dey',
        avatarText: 'PD',
        avatarBgColor: 'bg-purple-100 text-purple-600',
        time: '09 Sep 2026, 09:20 AM',
        message: 'Please tell me when my subscription will expire.',
      },
      {
        id: 'msg-2',
        sender: 'support',
        senderName: 'Support Team',
        avatarText: 'S',
        avatarBgColor: 'bg-blue-600 text-white',
        time: '09 Sep 2026, 09:35 AM',
        message: 'Your 3 Months plan is valid until 10 Dec 2026.',
      },
    ],
  },
  {
    id: 'tkt-9',
    ticketNumber: '#PKT-1040',
    studentName: 'Bikash Mondal',
    studentEmail: 'bikash.mondal@gmail.com',
    studentPhone: '+91 98765 43218',
    avatarText: 'BM',
    avatarBgColor: 'bg-emerald-100 text-emerald-700',
    subject: 'Need help with district ranking',
    excerpt: 'How is district rank calculated? Please explain...',
    message:
      'How is district rank calculated? Please explain if negative markings are weighted differently by district.',
    category: 'Other',
    priority: 'Low',
    status: 'In Progress',
    dateStr: '08 Sep 2026, 07:55 PM',
    channel: 'via Android App',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Bikash Mondal',
        avatarText: 'BM',
        avatarBgColor: 'bg-emerald-100 text-emerald-700',
        time: '08 Sep 2026, 07:55 PM',
        message: 'How is district rank calculated? Please explain.',
      },
    ],
  },
  {
    id: 'tkt-10',
    ticketNumber: '#PKT-1039',
    studentName: 'Sayan Mondal',
    studentEmail: 'sayan.mondal@gmail.com',
    studentPhone: '+91 98765 43219',
    avatarText: 'SM',
    avatarBgColor: 'bg-rose-100 text-rose-600',
    subject: 'Payment method not available',
    excerpt: 'UPI option is not showing for me. Please help...',
    message:
      'UPI option is not showing for me during checkout on iOS Safari browser. Please help.',
    category: 'Payment Issue',
    priority: 'Medium',
    status: 'Open',
    dateStr: '08 Sep 2026, 05:10 PM',
    channel: 'via Website',
    messages: [
      {
        id: 'msg-1',
        sender: 'student',
        senderName: 'Sayan Mondal',
        avatarText: 'SM',
        avatarBgColor: 'bg-rose-100 text-rose-600',
        time: '08 Sep 2026, 05:10 PM',
        message: 'UPI option is not showing for me. Please help.',
      },
    ],
  },
];

// Category Badge Helper
const getCategoryBadgeClass = (category: TicketCategory) => {
  switch (category) {
    case 'Payment Issue':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/80';
    case 'Subscription':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/80';
    case 'Content Related':
      return 'bg-[#EDE9FE] text-[#7C3AED] border border-purple-200/80';
    case 'Account Related':
      return 'bg-[#E0F2FE] text-[#0284C7] border border-sky-200/80';
    case 'Refund Request':
      return 'bg-[#F3E8FF] text-[#9333EA] border border-purple-200/80';
    case 'Technical Issue':
      return 'bg-[#E0F2FE] text-[#0284C7] border border-sky-200/80';
    case 'Other':
    default:
      return 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80';
  }
};

// Status Badge Helper
const getStatusBadgeClass = (status: TicketStatus) => {
  switch (status) {
    case 'Resolved':
      return 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80';
    case 'In Progress':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/80';
    case 'Open':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/80';
    case 'Closed':
      return 'bg-slate-100 text-slate-600 border border-slate-200/80';
  }
};

// Priority Badge Helper
const getPriorityBadgeClass = (priority: TicketPriority) => {
  switch (priority) {
    case 'High':
      return 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/80';
    case 'Medium':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/80';
    case 'Low':
      return 'bg-slate-100 text-slate-600 border border-slate-200/80';
  }
};

// ============================================================================
// MAIN COMPONENT: ADMIN SUPPORT
// ============================================================================

export const AdminSupport: React.FC = () => {
  const [ticketsList, setTicketsList] = useState<TicketRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_support_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_TICKETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_support_v2', JSON.stringify(ticketsList));
    } catch {
      // ignore
    }
  }, [ticketsList]);

  // Load live support tickets from Supabase database on mount
  useEffect(() => {
    let isMounted = true;
    api.getSupportTickets().then((remote) => {
      if (!isMounted) return;
      if (!remote || remote.length === 0) {
        if (isSupabaseConfigured) {
          setTicketsList([]);
          setSelectedTicketId('');
        }
        return;
      }
      const mapped: TicketRecord[] = remote.map((t, idx) => {
        let cat: TicketCategory = 'Payment Issue';
        const rawCat = String(t.category || '').toLowerCase();
        if (rawCat.includes('test') || rawCat.includes('tech')) cat = 'Technical Issue';
        else if (rawCat.includes('account')) cat = 'Account Related';
        else if (rawCat.includes('content')) cat = 'Content Related';
        else if (rawCat.includes('subscription')) cat = 'Subscription';
        else if (rawCat.includes('refund')) cat = 'Refund Request';
        else if (rawCat.includes('pay')) cat = 'Payment Issue';
        else cat = 'Other';

        let pri: TicketPriority = 'Medium';
        if (t.priority === 'urgent' || t.priority === 'high') pri = 'High';
        else if (t.priority === 'low') pri = 'Low';

        let st: TicketStatus = 'Open';
        const rawStatus = String(t.status || '').toLowerCase();
        if (rawStatus === 'resolved' || rawStatus === 'closed') st = 'Resolved';
        else if (rawStatus === 'in_progress') st = 'In Progress';

        const dDate = new Date(t.createdAt || Date.now());
        const dateStr = dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        return {
          id: t.id,
          ticketNumber: `#PKT-${1000 + idx}`,
          studentName: t.studentName || 'Student Aspirant',
          studentEmail: t.studentEmail || '',
          studentPhone: '+91 98765 43210',
          avatarText: (t.studentName || 'ST').slice(0, 2).toUpperCase(),
          avatarBgColor: 'bg-blue-100 text-blue-600',
          subject: t.subject,
          excerpt: t.issue ? (t.issue.length > 60 ? t.issue.slice(0, 60) + '...' : t.issue) : t.subject,
          message: t.issue || t.subject,
          category: cat,
          priority: pri,
          status: st,
          dateStr,
          channel: 'Portal',
          messages: [
            {
              id: `msg-${t.id}-1`,
              sender: 'student',
              senderName: t.studentName || 'Student Aspirant',
              avatarText: (t.studentName || 'ST').slice(0, 2).toUpperCase(),
              avatarBgColor: 'bg-blue-100 text-blue-600',
              time: dateStr,
              message: t.issue || t.subject,
            },
          ],
        };
      });
      setTicketsList(mapped);
      if (mapped.length > 0) setSelectedTicketId(mapped[0].id);
    }).catch((err) => {
      console.warn('Failed to load support tickets from database:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Selected Ticket in Right Panel
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    isSupabaseConfigured ? '' : 'tkt-1'
  );

  // Search in filters
  const [filterSearch, setFilterSearch] = useState('');

  // Status Checkbox filters
  const [filterStatus, setFilterStatus] = useState<string[]>(['All']);

  // Category Checkbox filters
  const [filterCategory, setFilterCategory] = useState<string[]>([]);

  // Priority Checkbox filters
  const [filterPriority, setFilterPriority] = useState<string[]>(['All']);

  // Sort order
  const [sortBy, setSortBy] = useState<'Latest' | 'Oldest' | 'High Priority'>('Latest');

  // Reply tab in details panel: 'Reply' | 'Internal Note'
  const [composerTab, setComposerTab] = useState<'Reply' | 'Internal Note'>('Reply');
  const [replyText, setReplyText] = useState('');

  // Status dropdown toggle in details header
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal: New Ticket
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Payment Issue');
  const [newPriority, setNewPriority] = useState<TicketPriority>('High');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setIsStatusDropdownOpen(false);
    if (isStatusDropdownOpen) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [isStatusDropdownOpen]);

  // Active selected ticket
  const activeTicket = useMemo(() => {
    return ticketsList.find((t) => t.id === selectedTicketId) || (ticketsList.length > 0 ? ticketsList[0] : null);
  }, [ticketsList, selectedTicketId]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let result = [...ticketsList];

    // Status filter
    if (!filterStatus.includes('All') && filterStatus.length > 0) {
      result = result.filter((t) => filterStatus.includes(t.status));
    }

    // Category filter
    if (filterCategory.length > 0) {
      result = result.filter((t) => filterCategory.includes(t.category));
    }

    // Priority filter
    if (!filterPriority.includes('All') && filterPriority.length > 0) {
      result = result.filter((t) => filterPriority.includes(t.priority));
    }

    // Search query
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q) ||
          t.studentEmail.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'Latest') {
      // keep original order or by id
    } else if (sortBy === 'Oldest') {
      result.reverse();
    } else if (sortBy === 'High Priority') {
      result.sort((a, b) => (a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0));
    }

    return result;
  }, [ticketsList, filterStatus, filterCategory, filterPriority, filterSearch, sortBy]);

  // Handle status checkbox toggle
  const toggleStatusCheckbox = (statusName: string) => {
    if (statusName === 'All') {
      setFilterStatus(['All']);
      return;
    }
    setFilterStatus((prev) => {
      const withoutAll = prev.filter((s) => s !== 'All');
      if (withoutAll.includes(statusName)) {
        const next = withoutAll.filter((s) => s !== statusName);
        return next.length === 0 ? ['All'] : next;
      } else {
        return [...withoutAll, statusName];
      }
    });
  };

  // Handle category checkbox toggle
  const toggleCategoryCheckbox = (catName: string) => {
    setFilterCategory((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  // Handle priority checkbox toggle
  const togglePriorityCheckbox = (prioName: string) => {
    if (prioName === 'All') {
      setFilterPriority(['All']);
      return;
    }
    setFilterPriority((prev) => {
      const withoutAll = prev.filter((p) => p !== 'All');
      if (withoutAll.includes(prioName)) {
        const next = withoutAll.filter((p) => p !== prioName);
        return next.length === 0 ? ['All'] : next;
      } else {
        return [...withoutAll, prioName];
      }
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterSearch('');
    setFilterStatus(['All']);
    setFilterCategory([]);
    setFilterPriority(['All']);
    showToast('Filters reset.');
  };

  // Update Status of active ticket
  const handleUpdateStatus = (newStatus: TicketStatus) => {
    if (!activeTicket) return;
    setTicketsList((prev) =>
      prev.map((t) => (t.id === activeTicket.id ? { ...t, status: newStatus } : t))
    );
    const backendStatus: 'open' | 'pending' | 'resolved' | 'closed' =
      newStatus === 'In Progress'
        ? 'pending'
        : (newStatus.toLowerCase() as 'open' | 'resolved' | 'closed');
    api.updateSupportTicket(activeTicket.id, { status: backendStatus }).catch(() => {});
    showToast(`Updated ticket ${activeTicket.ticketNumber} to ${newStatus}.`);
  };

  // Send Reply or Internal Note
  const handleSendReply = () => {
    if (!replyText.trim() || !activeTicket) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: composerTab === 'Internal Note' ? 'internal_note' : 'support',
      senderName: composerTab === 'Internal Note' ? 'Internal Note' : 'Support Team',
      avatarText: composerTab === 'Internal Note' ? 'N' : 'S',
      avatarBgColor:
        composerTab === 'Internal Note' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white',
      time: 'Just now',
      message: replyText.trim(),
    };

    setTicketsList((prev) =>
      prev.map((t) => {
        if (t.id === activeTicket.id) {
          return {
            ...t,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    setReplyText('');
    showToast(
      composerTab === 'Internal Note' ? 'Internal note added.' : 'Reply sent to student.'
    );
  };

  // Create new ticket submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newSubject.trim() || !newMessage.trim()) {
      showToast('Please fill all required fields.');
      return;
    }

    const newTktNumber = `#PKT-${1049 + ticketsList.length}`;
    const initials = newStudentName
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newTkt: TicketRecord = {
      id: `tkt-${Date.now()}`,
      ticketNumber: newTktNumber,
      studentName: newStudentName.trim(),
      studentEmail: newStudentEmail.trim() || 'student@practicekoro.online',
      studentPhone: '+91 98765 43220',
      avatarText: initials || 'ST',
      avatarBgColor: 'bg-blue-600 text-white',
      subject: newSubject.trim(),
      excerpt: newMessage.trim().slice(0, 60) + '...',
      message: newMessage.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      dateStr: 'Just now',
      channel: 'via Admin Panel',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'student',
          senderName: newStudentName.trim(),
          avatarText: initials || 'ST',
          avatarBgColor: 'bg-blue-600 text-white',
          time: 'Just now',
          message: newMessage.trim(),
        },
      ],
    };

    try {
      await api.createSupportTicket({
        studentName: newTkt.studentName,
        studentEmail: newTkt.studentEmail,
        subject: newTkt.subject,
        issue: newTkt.message,
        category: (newTkt.category === 'Subscription'
          ? 'Subscription Issue'
          : newTkt.category) as any,
        priority: newTkt.priority.toLowerCase() as 'high' | 'medium' | 'low',
        status: 'open',
      });
    } catch {
      // local fallback
    }

    setTicketsList([newTkt, ...ticketsList]);
    setSelectedTicketId(newTkt.id);
    setIsCreateModalOpen(false);
    setNewStudentName('');
    setNewStudentEmail('');
    setNewSubject('');
    setNewMessage('');
    showToast(`Created ticket ${newTktNumber} successfully!`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HEADER & TOP ACTIONS                                              */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Manage student support tickets, respond to queries and keep your students happy.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <a
            href="https://practicekoro.in/help"
            target="_blank"
            rel="noreferrer"
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Help Center</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FIVE SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Tickets */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Tickets</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">{ticketsList.length}</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">in system</span>
          </div>
        </div>

        {/* Card 2: Resolved */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Resolved</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {ticketsList.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {ticketsList.length > 0
                  ? `${Math.round((ticketsList.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length / ticketsList.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">resolution rate</span>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Pending</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {ticketsList.filter((t) => t.status === 'Open').length}
              </span>
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                Action req.
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">unassigned/open</span>
          </div>
        </div>

        {/* Card 4: In Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Hourglass className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">In Progress</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {ticketsList.filter((t) => t.status === 'In Progress').length}
              </span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">under review</span>
          </div>
        </div>

        {/* Card 5: Avg. Response Time */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Avg. Response Time</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {ticketsList.length > 0 ? '12m' : '—'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Optimal
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">sla response</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. THREE-COLUMN MAIN LAYOUT                                          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: FILTERS SIDEBAR (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900">Filters</h2>

          {/* Search tickets */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* STATUS SECTION */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 block">Status</span>
            <div className="space-y-1.5 text-xs">
              {[
                { name: 'All', count: ticketsList.length },
                { name: 'Open', count: ticketsList.filter((t) => t.status === 'Open').length },
                { name: 'In Progress', count: ticketsList.filter((t) => t.status === 'In Progress').length },
                { name: 'Resolved', count: ticketsList.filter((t) => t.status === 'Resolved').length },
                { name: 'Closed', count: ticketsList.filter((t) => t.status === 'Closed').length },
              ].map((item) => {
                const isChecked = filterStatus.includes(item.name);
                return (
                  <label
                    key={item.name}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-slate-600 hover:text-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStatusCheckbox(item.name)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span className={cn(isChecked && item.name === 'All' && 'font-medium')}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{item.count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* CATEGORY SECTION */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 block">Category</span>
            <div className="space-y-1.5 text-xs">
              {[
                { name: 'Payment Issue', count: ticketsList.filter((t) => t.category === 'Payment Issue').length },
                { name: 'Subscription', count: ticketsList.filter((t) => t.category === 'Subscription').length },
                { name: 'Technical Issue', count: ticketsList.filter((t) => t.category === 'Technical Issue').length },
                { name: 'Content Related', count: ticketsList.filter((t) => t.category === 'Content Related').length },
                { name: 'Account Related', count: ticketsList.filter((t) => t.category === 'Account Related').length },
                { name: 'Refund Request', count: ticketsList.filter((t) => t.category === 'Refund Request').length },
                { name: 'Other', count: ticketsList.filter((t) => t.category === 'Other').length },
              ].map((item) => {
                const isChecked = filterCategory.includes(item.name);
                return (
                  <label
                    key={item.name}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-slate-600 hover:text-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategoryCheckbox(item.name)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{item.count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* PRIORITY SECTION */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 block">Priority</span>
            <div className="space-y-1.5 text-xs">
              {[
                { name: 'All', count: null },
                { name: 'High', count: ticketsList.filter((t) => t.priority === 'High').length },
                { name: 'Medium', count: ticketsList.filter((t) => t.priority === 'Medium').length },
                { name: 'Low', count: ticketsList.filter((t) => t.priority === 'Low').length },
              ].map((item) => {
                const isChecked = filterPriority.includes(item.name);
                return (
                  <label
                    key={item.name}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-slate-600 hover:text-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePriorityCheckbox(item.name)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.count !== null && (
                      <span className="text-[11px] text-slate-400 font-mono">{item.count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* DATE RANGE SECTION */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 block">Date Range</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-600">
                01 Sep 2026 → 30 Sep 2026
              </span>
            </div>
          </div>

          {/* RESET FILTERS BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              className="w-full border border-slate-200 text-[#2563EB] hover:bg-slate-50 rounded-xl py-2 text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* COLUMN 2: TICKETS LIST (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Tickets ({filteredTickets.length})
            </h2>

            {/* Sort by dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white text-xs text-slate-600 font-medium pr-6 pl-2 py-1 rounded-lg cursor-pointer focus:outline-none"
              >
                <option value="Latest">Sort by: Latest</option>
                <option value="Oldest">Sort by: Oldest</option>
                <option value="High Priority">Sort by: High Priority</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tickets Cards List */}
          <div className="divide-y divide-slate-100/80">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No tickets found matching current filters
              </div>
            ) : (
              filteredTickets
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((tkt) => {
                  const isSelected = selectedTicketId === tkt.id;

                  return (
                    <div
                      key={tkt.id}
                      onClick={() => setSelectedTicketId(tkt.id)}
                      className={cn(
                        'p-3.5 flex items-start gap-3 transition-colors cursor-pointer group',
                        isSelected ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-slate-50/60'
                      )}
                    >
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </div>

                      {/* Avatar */}
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                          tkt.avatarBgColor
                        )}
                      >
                        {tkt.avatarText}
                      </div>

                      {/* Middle content */}
                      <div className="min-w-0 flex-1">
                        {/* Line 1: Name + Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {tkt.studentName}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-semibold',
                              getCategoryBadgeClass(tkt.category)
                            )}
                          >
                            {tkt.category}
                          </span>
                          {tkt.priority === 'High' ? (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-semibold',
                                getPriorityBadgeClass(tkt.priority)
                              )}
                            >
                              {tkt.priority}
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-semibold',
                                getStatusBadgeClass(tkt.status)
                              )}
                            >
                              {tkt.status}
                            </span>
                          )}
                        </div>

                        {/* Line 2: Subject */}
                        <span className="font-bold text-slate-800 text-xs block truncate mt-1">
                          {tkt.subject}
                        </span>

                        {/* Line 3: Excerpt */}
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {tkt.excerpt}
                        </p>
                      </div>

                      {/* Right side: Date & Ticket Number */}
                      <div className="text-right shrink-0 pt-0.5">
                        <span className="text-[10px] text-slate-400 block whitespace-nowrap">
                          {tkt.dateStr}
                        </span>
                        <span className="text-[11px] text-blue-600 font-mono font-medium block mt-1">
                          {tkt.ticketNumber}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Table / List Footer Pagination */}
          <div className="border-t border-slate-100 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 mt-auto">
            <div>
              Showing {filteredTickets.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
              {Math.min(filteredTickets.length, currentPage * rowsPerPage)} of {filteredTickets.length} tickets
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2563EB] text-white font-medium shadow-2xs"
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                2
              </button>
              <button
                onClick={() => setCurrentPage(3)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                3
              </button>
              <button
                onClick={() => setCurrentPage(4)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                4
              </button>
              <button
                onClick={() => setCurrentPage(5)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                5
              </button>
              <span className="px-1 text-slate-400">...</span>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="relative ml-2">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="appearance-none border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white pr-6 cursor-pointer focus:outline-none"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: TICKET DETAILS & CONVERSATION PANEL (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
          {!activeTicket ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Ticket Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {filteredTickets.length === 0
                  ? 'No support tickets found in system.'
                  : 'Select a support ticket from the list to view its messages and details.'}
              </p>
            </div>
          ) : (
            <>
              {/* Header Line */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-sm text-slate-900">{activeTicket.ticketNumber}</span>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                }}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors',
                  getStatusBadgeClass(activeTicket.status)
                )}
              >
                <span>{activeTicket.status}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {(['Open', 'In Progress', 'Resolved', 'Closed'] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        handleUpdateStatus(st);
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{st}</span>
                      {activeTicket.status === st && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Subject Title */}
          <h3 className="font-bold text-base text-slate-900 leading-snug">
            {activeTicket.subject}
          </h3>

          {/* Student Info Card */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                  activeTicket.avatarBgColor
                )}
              >
                {activeTicket.avatarText}
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block leading-tight">
                  {activeTicket.studentName}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {activeTicket.studentEmail}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{activeTicket.studentPhone}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{activeTicket.dateStr}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{activeTicket.channel}</span>
            </div>
          </div>

          {/* Badges line */}
          <div className="flex items-center gap-2 pt-1">
            <span
              className={cn(
                'px-2.5 py-0.5 rounded text-[11px] font-semibold',
                getCategoryBadgeClass(activeTicket.category)
              )}
            >
              {activeTicket.category}
            </span>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded text-[11px] font-semibold',
                getPriorityBadgeClass(activeTicket.priority)
              )}
            >
              {activeTicket.priority} Priority
            </span>
          </div>

          {/* Original Message Description */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-900 block">Message</span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              {activeTicket.message}
            </p>
          </div>

          {/* Attachments Section */}
          {activeTicket.attachments && activeTicket.attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {activeTicket.attachments.map((att) => (
                <div
                  key={att.id}
                  className="border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {att.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 block truncate">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{att.size}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast(`Downloaded ${att.name}`)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Conversation Thread */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {activeTicket.messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0',
                        msg.avatarBgColor
                      )}
                    >
                      {msg.avatarText}
                    </div>
                    <span className="font-bold text-slate-900">{msg.senderName}</span>
                    <span className="text-slate-400 text-[10px]">{msg.time}</span>
                  </div>

                  {msg.sender === 'support' && (
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div
                  className={cn(
                    'text-xs leading-relaxed p-3 rounded-xl border',
                    msg.sender === 'support'
                      ? 'bg-slate-50 border-slate-100 text-slate-700'
                      : msg.sender === 'internal_note'
                      ? 'bg-amber-50/70 border-amber-200/60 text-amber-900'
                      : 'bg-white border-slate-100 text-slate-700'
                  )}
                >
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Composer / Reply Section */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {/* Tabs: Reply | Internal Note */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComposerTab('Reply')}
                className={cn(
                  'px-3.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                  composerTab === 'Reply'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Reply
              </button>
              <button
                onClick={() => setComposerTab('Internal Note')}
                className={cn(
                  'px-3.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                  composerTab === 'Internal Note'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Internal Note
              </button>
            </div>

            {/* Input Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  composerTab === 'Reply'
                    ? 'Type your reply...'
                    : 'Type private note for admin team...'
                }
                className="w-full p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
              />

              {/* Bottom Toolbar */}
              <div className="bg-slate-50/60 border-t border-slate-100 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <button
                    type="button"
                    onClick={() => showToast('Attachment picker opened')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Image uploader opened')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Insert link')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Emoji picker')}
                    className="hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSendReply}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Send Reply</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MODAL: CREATE NEW TICKET                                          */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Create New Support Ticket</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Rahul Das"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Student Email
                </label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="rahul.das@gmail.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Content Related">Content Related</option>
                    <option value="Account Related">Account Related</option>
                    <option value="Refund Request">Refund Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Brief summary of the student issue"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Message / Issue Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs cursor-pointer"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
