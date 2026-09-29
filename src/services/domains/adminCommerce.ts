import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/authPolicy';
import { MOCK_SUBSCRIPTION_PLANS } from '@/services/mockData';
import type {
  AdminSubscriptionRow,
  AdminPaymentRow,
  AdminDashboardStats,
  AdminDashboardV2Stats,
  AdminStudentRow,
  AdminStudentDetails,
  AdminBatch,
  SubscriptionPlan,
  TestAttempt,
  CouponItem,
  CouponValidationResult,
  DateRangePreset,
  DateRangeRevenueStats,
  DateRangeDailyPoint,
  StudentRankRow,
  QuestionInsightRow,
  TopicInsightRow,
  SubjectInsightRow,
  PerformanceTrendPoint,
  PlatformAnalyticsData,
} from '@/types';
import {
  localExams,
  localSubjects,
  localChapters,
  localTestSeries,
  localTests,
  localQuestions,
  localCoupons,
  localPayments,
  localStudents,
} from '@/services/domains/localStore';

/**
 * Admin subscriptions, payments & dashboard statistics API.
 */

export const adminCommerceApi = {
  async getAdminSubscriptions(
    status?: string,
    search?: string,
    limit = 50,
    offset = 0
  ): Promise<AdminSubscriptionRow[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_admin_subscriptions', {
          p_status: status || null,
          p_search: search || null,
          p_limit: limit,
          p_offset: offset,
        });

        if (!error && Array.isArray(data)) {
          return data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            studentName: d.student_name || 'Student Aspirant',
            studentEmail: d.student_email || '',
            studentPhone: d.student_phone || undefined,
            planId: d.plan_id,
            planTitle: d.plan_title || 'Pro Pass',
            status: d.status,
            startsAt: d.starts_at,
            expiresAt: d.expires_at,
            paymentId: d.payment_id || undefined,
            daysRemaining: Number(d.days_remaining || 0),
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch admin subscriptions from RPC, trying direct query:', err);
      }

      // Direct fallback query against Supabase subscriptions table
      try {
        let query = supabase
          .from('subscriptions')
          .select(
            `
            id,
            user_id,
            plan_id,
            status,
            starts_at,
            expires_at,
            payment_id,
            created_at,
            profiles:user_id(full_name, email, phone),
            subscription_plans:plan_id(title)
          `
          )
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data
            .filter((d: any) => {
              if (!search) return true;
              const s = search.toLowerCase();
              const name = d.profiles?.full_name?.toLowerCase() || '';
              const email = d.profiles?.email?.toLowerCase() || '';
              return name.includes(s) || email.includes(s);
            })
            .map((d: any) => {
              const now = Date.now();
              const exp = new Date(d.expires_at).getTime();
              const daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
              return {
                id: d.id,
                userId: d.user_id,
                studentName: d.profiles?.full_name || 'Registered Student',
                studentEmail: d.profiles?.email || '',
                studentPhone: d.profiles?.phone || undefined,
                planId: d.plan_id,
                planTitle: d.subscription_plans?.title || 'Pro Pass',
                status: d.status,
                startsAt: d.starts_at,
                expiresAt: d.expires_at,
                paymentId: d.payment_id || undefined,
                daysRemaining,
                createdAt: d.created_at,
              };
            });
        }
      } catch (err) {
        console.warn('Direct query on subscriptions failed:', err);
      }
    }

    // Return empty list when no real database subscriptions exist
    return [];
  },

  async getAdminPayments(
    status?: string,
    search?: string,
    limit = 50,
    offset = 0
  ): Promise<AdminPaymentRow[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_admin_payments', {
          p_status: status || null,
          p_search: search || null,
          p_limit: limit,
          p_offset: offset,
        });

        if (!error && Array.isArray(data)) {
          return data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            studentName: d.student_name || 'Student Aspirant',
            studentEmail: d.student_email || '',
            planId: d.plan_id || undefined,
            planTitle: d.plan_title || 'Pro Pass',
            amount: Number(d.amount),
            currency: d.currency || 'INR',
            gateway: d.gateway || 'razorpay',
            orderId: d.order_id || undefined,
            razorpayOrderId: d.razorpay_order_id || undefined,
            transactionId: d.transaction_id || undefined,
            razorpayPaymentId: d.razorpay_payment_id || undefined,
            status: d.status,
            refundId: d.refund_id || undefined,
            refundAmount: d.refund_amount == null ? undefined : Number(d.refund_amount),
            refundReason: d.refund_reason || undefined,
            refundedAt: d.refunded_at || undefined,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch admin payments from RPC, trying direct query:', err);
      }

      // Direct fallback query against Supabase payments table
      try {
        let query = supabase
          .from('payments')
          .select(
            `
            id,
            user_id,
            plan_id,
            amount,
            currency,
            gateway,
            order_id,
            razorpay_order_id,
            transaction_id,
            razorpay_payment_id,
            status,
            refund_id,
            refund_amount,
            refund_reason,
            refunded_at,
            created_at,
            profiles:user_id(full_name, email),
            subscription_plans:plan_id(title)
          `
          )
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data
            .filter((d: any) => {
              if (!search) return true;
              const s = search.toLowerCase();
              const name = d.profiles?.full_name?.toLowerCase() || '';
              const email = d.profiles?.email?.toLowerCase() || '';
              const orderId = (d.order_id || d.razorpay_order_id || '').toLowerCase();
              return name.includes(s) || email.includes(s) || orderId.includes(s);
            })
            .map((d: any) => ({
              id: d.id,
              userId: d.user_id,
              studentName: d.profiles?.full_name || 'Registered Student',
              studentEmail: d.profiles?.email || '',
              planId: d.plan_id || undefined,
              planTitle: d.subscription_plans?.title || 'Pro Pass',
              amount: Number(d.amount || 0),
              currency: d.currency || 'INR',
              gateway: d.gateway || 'razorpay',
              orderId: d.order_id || undefined,
              razorpayOrderId: d.razorpay_order_id || undefined,
              transactionId: d.transaction_id || undefined,
              razorpayPaymentId: d.razorpay_payment_id || undefined,
              status: d.status,
              refundId: d.refund_id || undefined,
              refundAmount: d.refund_amount == null ? undefined : Number(d.refund_amount),
              refundReason: d.refund_reason || undefined,
              refundedAt: d.refunded_at || undefined,
              createdAt: d.created_at,
            }));
        }
      } catch (err) {
        console.warn('Direct query on payments failed:', err);
      }
    }

    // Return empty list when no real database payments exist
    return [];
  },

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const studentCount = 0;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_counts');
        if (!error && data) {
          return {
            totalExams: Number(data.total_exams || 0),
            activeExams: Number(data.total_exams || 0),
            totalSubjects: Number(data.total_subjects || 0),
            totalChapters: Number(data.total_chapters || 0),
            totalTestSeries: Number(data.total_test_series || 0),
            totalTests: Number(data.total_tests || 0),
            publishedTests: Number(data.published_tests || 0),
            draftTests: Number(data.draft_tests || 0),
            archivedTests: Number(data.archived_tests || 0),
            totalQuestions: Number(data.total_questions || 0),
            activeQuestions: Number(data.total_questions || 0),
            totalAttempts: Number(data.total_attempts || 0),
            completedAttempts: Number(data.completed_attempts || 0),
            totalStudents: Number(data.total_students || 0),
          };
        }
      } catch (err) {
        console.warn('Fallback to local stats calculation', err);
      }

      try {
        const [
          examsRes,
          subjectsRes,
          chaptersRes,
          testSeriesRes,
          testsRes,
          questionsRes,
          attemptsRes,
          profilesRes,
        ] = await Promise.all([
          supabase.from('exams').select('*', { count: 'exact', head: true }),
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('chapters').select('*', { count: 'exact', head: true }),
          supabase.from('test_series').select('*', { count: 'exact', head: true }),
          supabase.from('tests').select('status'),
          supabase.from('questions').select('is_active, status'),
          supabase.from('test_attempts').select('status'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
        ]);

        const tests = Array.isArray(testsRes.data) ? testsRes.data : [];
        const questions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
        const attempts = Array.isArray(attemptsRes.data) ? attemptsRes.data : [];

        return {
          totalExams: examsRes.count ?? 0,
          activeExams: examsRes.count ?? 0,
          totalSubjects: subjectsRes.count ?? 0,
          totalChapters: chaptersRes.count ?? 0,
          totalTestSeries: testSeriesRes.count ?? 0,
          totalTests: tests.length,
          publishedTests: tests.filter((t: any) => t.status === 'published').length,
          draftTests: tests.filter((t: any) => t.status === 'draft').length,
          archivedTests: tests.filter((t: any) => t.status === 'archived').length,
          totalQuestions: questions.length,
          activeQuestions: questions.filter((q: any) => q.is_active && q.status !== 'archived')
            .length,
          totalAttempts: attempts.length,
          completedAttempts: attempts.filter((a: any) => a.status === 'completed').length,
          totalStudents: profilesRes.count ?? 0,
        };
      } catch (err) {
        console.warn('Fallback direct stats calculation failed:', err);
        return {
          totalExams: 0,
          activeExams: 0,
          totalSubjects: 0,
          totalChapters: 0,
          totalTestSeries: 0,
          totalTests: 0,
          publishedTests: 0,
          draftTests: 0,
          archivedTests: 0,
          totalQuestions: 0,
          activeQuestions: 0,
          totalAttempts: 0,
          completedAttempts: 0,
          totalStudents: 0,
        };
      }
    }

    return {
      totalExams: localExams.length,
      activeExams: localExams.filter((e) => e.isActive).length,
      totalSubjects: localSubjects.length,
      totalChapters: localChapters.length,
      totalTestSeries: localTestSeries.length,
      totalTests: localTests.length,
      publishedTests: localTests.filter((t) => t.status === 'published').length,
      draftTests: localTests.filter((t) => t.status === 'draft').length,
      archivedTests: localTests.filter((t) => t.status === 'archived').length,
      totalQuestions: localQuestions.length,
      activeQuestions: localQuestions.filter((q) => q.isActive && q.status !== 'archived').length,
      totalAttempts: 0,
      completedAttempts: 0,
      totalStudents: studentCount,
    };
  },

  async getAdminDashboardV2Stats(): Promise<AdminDashboardV2Stats> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_v2_stats');
        if (!error && data) {
          return {
            totalRevenue: Number(data.totalRevenue || 0),
            todayRevenue: Number(data.todayRevenue || 0),
            monthRevenue: Number(data.monthRevenue || 0),
            yearRevenue: Number(data.yearRevenue || 0),
            revenueTrend: Array.isArray(data.revenueTrend) ? data.revenueTrend : [],
            totalStudents: Number(data.totalStudents || 0),
            newStudents: Number(data.newStudents || 0),
            activeStudents: Number(data.activeStudents || 0),
            freeStudents: Number(data.freeStudents || 0),
            proStudents: Number(data.proStudents || 0),
            activeSubscriptions: Number(data.activeSubscriptions || 0),
            totalExams: Number(data.totalExams || 0),
            totalTests: Number(data.totalTests || 0),
            topicTests: Number(data.topicTests || 0),
            fullMockTests: Number(data.fullMockTests || 0),
            pyqTests: Number(data.pyqTests || 0),
            totalQuestions: Number(data.totalQuestions || 0),
            topicQuestions: Number(data.topicQuestions || 0),
            fullMockQuestions: Number(data.fullMockQuestions || 0),
            pyqQuestions: Number(data.pyqQuestions || 0),
            recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
          };
        }
      } catch (err) {
        console.warn('Fallback computing dashboard v2 stats from database tables:', err);
      }

      // Query real metrics directly from tables
      try {
        const [profilesRes, proSubRes, paymentsRes, examsRes, testsRes, questionsRes] =
          await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase
              .from('subscriptions')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active'),
            supabase.from('payments').select('amount, created_at').eq('status', 'completed'),
            supabase.from('exams').select('*', { count: 'exact', head: true }),
            supabase.from('tests').select('test_type'),
            supabase.from('questions').select('chapter_id, exam_id'),
          ]);

        const totalStudents = profilesRes.count || 0;
        const activeSubscriptions = proSubRes.count || 0;
        const proStudents = activeSubscriptions;
        const freeStudents = Math.max(0, totalStudents - proStudents);

        let totalRevenue = 0;
        let todayRevenue = 0;
        let monthRevenue = 0;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        if (Array.isArray(paymentsRes.data)) {
          for (const p of paymentsRes.data) {
            const amt = Number(p.amount || 0);
            totalRevenue += amt;
            const pTime = new Date(p.created_at).getTime();
            if (pTime >= startOfToday) todayRevenue += amt;
            if (pTime >= startOfMonth) monthRevenue += amt;
          }
        }

        const tests = Array.isArray(testsRes.data) ? testsRes.data : [];
        const fullMockTests = tests.filter((t: any) => t.test_type === 'full_mock').length;
        const pyqTests = tests.filter((t: any) => t.test_type === 'pyq').length;
        const topicTests = tests.filter(
          (t: any) => t.test_type !== 'full_mock' && t.test_type !== 'pyq'
        ).length;

        const questions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
        const topicQuestions = questions.filter((q: any) => q.chapter_id).length;
        const fullMockQuestions = questions.filter((q: any) => !q.chapter_id && q.exam_id).length;
        const pyqQuestions = Math.max(0, questions.length - topicQuestions - fullMockQuestions);

        return {
          totalRevenue,
          todayRevenue,
          monthRevenue,
          yearRevenue: totalRevenue,
          revenueTrend: [],
          totalStudents,
          newStudents: totalStudents,
          activeStudents: totalStudents,
          freeStudents,
          proStudents,
          activeSubscriptions,
          totalExams: examsRes.count ?? 0,
          totalTests: tests.length,
          topicTests,
          fullMockTests,
          pyqTests,
          totalQuestions: questions.length,
          topicQuestions,
          fullMockQuestions,
          pyqQuestions,
          recentActivity: [],
        };
      } catch (err) {
        console.warn('Direct computation of stats failed:', err);
        return {
          totalRevenue: 0,
          todayRevenue: 0,
          monthRevenue: 0,
          yearRevenue: 0,
          revenueTrend: [],
          totalStudents: 0,
          newStudents: 0,
          activeStudents: 0,
          freeStudents: 0,
          proStudents: 0,
          activeSubscriptions: 0,
          totalExams: 0,
          totalTests: 0,
          topicTests: 0,
          fullMockTests: 0,
          pyqTests: 0,
          totalQuestions: 0,
          topicQuestions: 0,
          fullMockQuestions: 0,
          pyqQuestions: 0,
          recentActivity: [],
        };
      }
    }

    return {
      totalRevenue: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      yearRevenue: 0,
      revenueTrend: [],
      totalStudents: 0,
      newStudents: 0,
      activeStudents: 0,
      freeStudents: 0,
      proStudents: 0,
      activeSubscriptions: 0,
      totalExams: localExams.length,
      totalTests: localTests.length,
      topicTests: localTests.filter((t) => t.testType === 'chapter_mock' || t.testType === 'topic')
        .length,
      fullMockTests: localTests.filter((t) => t.testType === 'full_mock').length,
      pyqTests: localTests.filter((t) => t.testType === 'pyq').length,
      totalQuestions: localQuestions.length,
      topicQuestions: localQuestions.filter((q) => q.chapterId).length,
      fullMockQuestions: localQuestions.filter((q) => !q.chapterId && q.id.includes('fm')).length,
      pyqQuestions: localQuestions.filter((q) => !q.chapterId && q.id.includes('pyq')).length,
      recentActivity: [],
    };
  },

  async getAdminStudents(
    search?: string,
    filterPlan?: string,
    filterStatus?: string,
    limit = 200,
    offset = 0
  ): Promise<AdminStudentRow[]> {
    if (isSupabaseConfigured) {
      // Attempt 1: RPC function (most complete data)
      try {
        const { data, error } = await supabase.rpc('get_admin_students', {
          p_search: search || null,
          p_plan: filterPlan === 'all' ? null : filterPlan || null,
          p_status: filterStatus === 'all' ? null : filterStatus || null,
          p_limit: limit,
          p_offset: offset,
        });

        if (!error && Array.isArray(data)) {
          return data
            .filter((d) => {
              const email = (d.email || '').toLowerCase().trim();
              return !isAdminEmail(email);
            })
            .map((d) => ({
              id: d.id,
              fullName: d.full_name || 'Aspirant',
              email: d.email || '',
              phone: d.phone || undefined,
              avatarUrl: d.avatar_url || undefined,
              createdAt: d.created_at,
              planTitle: d.plan_title || 'Free Plan',
              planId: d.plan_id || 'plan_free',
              subscriptionStatus: d.subscription_status || 'none',
              isPro: Boolean(d.is_pro),
              expiresAt: d.expires_at || undefined,
              totalAttempts: Number(d.total_attempts || 0),
              lastActive: d.last_active || d.created_at,
            }));
        }
        if (error) {
          console.warn('RPC get_admin_students failed:', error.message, error.code);
        }
      } catch (err) {
        console.warn('RPC get_admin_students exception:', err);
      }

      // Attempt 2: Direct query on profiles (simple, no nested join)
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url, role, created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: profileData, error: profileError } = await query;
        if (profileError) {
          console.warn('Direct profiles query failed:', profileError.message);
        }

        if (!profileError && Array.isArray(profileData) && profileData.length > 0) {
          // Filter out admins
          const studentProfiles = profileData.filter((d: any) => {
            const email = (d.email || '').toLowerCase().trim();
            if (isAdminEmail(email)) {
              return false;
            }
            if (d.role === 'admin') return false;
            return true;
          });

          // Fetch subscriptions separately to avoid ambiguous FK join issues
          const userIds = studentProfiles.map((p: any) => p.id);
          const subsMap: Record<string, any> = {};

          if (userIds.length > 0) {
            try {
              const { data: subsData } = await supabase
                .from('subscriptions')
                .select('user_id, plan_id, status, expires_at, subscription_plans(title)')
                .in('user_id', userIds)
                .order('created_at', { ascending: false });

              if (Array.isArray(subsData)) {
                for (const s of subsData) {
                  // Keep only the most recent subscription per user
                  if (!subsMap[s.user_id]) {
                    subsMap[s.user_id] = s;
                  }
                }
              }
            } catch {
              // Subscriptions lookup is optional - students still show without it
            }
          }

          return studentProfiles
            .map((d: any) => {
              const sub = subsMap[d.id];
              const isPro = sub?.status === 'active';
              const planTitle =
                (sub?.subscription_plans as any)?.title || (isPro ? 'Pro Pass' : 'Free Aspirant');

              return {
                id: d.id,
                fullName: d.full_name || 'Registered Aspirant',
                email: d.email || '',
                phone: d.phone || undefined,
                avatarUrl: d.avatar_url || undefined,
                createdAt: d.created_at,
                planTitle,
                planId: sub?.plan_id || 'plan_free',
                subscriptionStatus: sub?.status || 'none',
                isPro,
                expiresAt: sub?.expires_at || undefined,
                totalAttempts: 0,
                lastActive: d.created_at,
              };
            })
            .filter((st) => {
              if (filterPlan === 'pro' && !st.isPro) return false;
              if (filterPlan === 'free' && st.isPro) return false;
              if (filterStatus === 'active' && !st.isPro) return false;
              if (filterStatus === 'expired' && st.subscriptionStatus !== 'expired') return false;
              return true;
            });
        }
      } catch (err) {
        console.warn('Direct profiles query exception:', err);
      }
    }

    // Return empty list when no real registered students exist in database
    return [];
  },

  async getAdminStudentDetails(userId: string): Promise<AdminStudentDetails | null> {
    const students = await this.getAdminStudents();
    const student = students.find((s) => s.id === userId);
    if (!student) return null;

    let attempts: TestAttempt[] = [];
    let payments: AdminPaymentRow[] = [];
    let subscriptions: AdminSubscriptionRow[] = [];

    if (isSupabaseConfigured) {
      try {
        const [attRes, payRes, subRes] = await Promise.all([
          supabase
            .from('test_attempts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('subscriptions')
            .select('*, subscription_plans(title)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        ]);

        if (attRes.data && attRes.data.length > 0) {
          attempts = attRes.data.map((a) => ({
            id: a.id,
            userId: a.user_id,
            testId: a.test_id,
            status: a.status,
            startTime: a.start_time,
            endTime: a.end_time,
            timeSpentSeconds: a.time_spent_seconds,
            score: Number(a.score),
            totalMarks: Number(a.total_marks),
            correctCount: a.correct_count,
            wrongCount: a.wrong_count,
            skippedCount: a.skipped_count,
            accuracy: Number(a.accuracy),
            rank: a.rank,
            percentile: Number(a.percentile),
            createdAt: a.created_at,
          }));
        }

        if (payRes.data) {
          payments = payRes.data.map((p) => ({
            id: p.id,
            userId: p.user_id,
            studentName: student.fullName,
            studentEmail: student.email,
            amount: Number(p.amount),
            currency: p.currency,
            gateway: p.gateway,
            orderId: p.order_id,
            transactionId: p.transaction_id,
            status: p.status,
            refundId: p.refund_id || undefined,
            refundAmount: p.refund_amount == null ? undefined : Number(p.refund_amount),
            refundReason: p.refund_reason || undefined,
            refundedAt: p.refunded_at || undefined,
            createdAt: p.created_at,
          }));
        }

        if (subRes.data) {
          subscriptions = subRes.data.map((s) => ({
            id: s.id,
            userId: s.user_id,
            studentName: student.fullName,
            studentEmail: student.email,
            planId: s.plan_id,
            planTitle: (s.subscription_plans as { title?: string })?.title || 'Pro Pass',
            status: s.status,
            startsAt: s.starts_at,
            expiresAt: s.expires_at,
            daysRemaining: Math.max(
              0,
              Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / (24 * 3600 * 1000))
            ),
            createdAt: s.created_at,
          }));
        }
      } catch (err) {
        console.warn('Error loading student details:', err);
      }
    }

    return {
      ...student,
      recentAttempts: attempts,
      paymentHistory: payments,
      subscriptionHistory: subscriptions,
    };
  },

  async updateSubscriptionPlan(
    id: string,
    updates: Partial<SubscriptionPlan>
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.originalPrice !== undefined) payload.original_price = updates.originalPrice;
        if (updates.durationDays !== undefined) payload.duration_days = updates.durationDays;
        if (updates.features !== undefined) payload.features = updates.features;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.currency !== undefined) payload.currency = updates.currency;

        const { error } = await supabase.from('subscription_plans').update(payload).eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
      }
    }
    const idx = MOCK_SUBSCRIPTION_PLANS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      MOCK_SUBSCRIPTION_PLANS[idx] = { ...MOCK_SUBSCRIPTION_PLANS[idx], ...updates };
    }
    return { success: true };
  },

  async createSubscriptionPlan(
    plan: SubscriptionPlan
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('subscription_plans').insert({
          id: plan.id,
          name: plan.name || plan.title,
          title: plan.title,
          description: plan.description,
          duration_days: plan.durationDays,
          price: plan.price,
          original_price: plan.originalPrice,
          currency: plan.currency || 'INR',
          features: plan.features,
          is_active: plan.isActive,
          order_index: plan.orderIndex || 1,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Creation failed' };
      }
    }
    const existingIdx = MOCK_SUBSCRIPTION_PLANS.findIndex((p) => p.id === plan.id);
    if (existingIdx !== -1) {
      MOCK_SUBSCRIPTION_PLANS[existingIdx] = plan;
    } else {
      MOCK_SUBSCRIPTION_PLANS.push(plan);
    }
    return { success: true };
  },

  async deleteSubscriptionPlan(
    id: string
  ): Promise<{ success: boolean; archived?: boolean; error?: string; message?: string }> {
    if (id === 'plan_free') {
      return {
        success: false,
        error: 'The Free Starter plan (plan_free) cannot be deleted as it is a core system tier.',
      };
    }

    if (isSupabaseConfigured) {
      try {
        // 1. Check if any student subscriptions are linked to this plan
        const { count: subCount, error: subErr } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', id);

        if (subErr) {
          console.warn('Could not verify subscriptions for plan deletion:', subErr);
        }

        // 2. Check if any payments are linked to this plan
        const { count: payCount, error: payErr } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', id);

        if (payErr) {
          console.warn('Could not verify payments for plan deletion:', payErr);
        }

        const hasExistingUsage = Boolean((subCount && subCount > 0) || (payCount && payCount > 0));

        if (hasExistingUsage) {
          // Deactivate / Archive to preserve relational integrity & student billing records
          const { error: archiveErr } = await supabase
            .from('subscription_plans')
            .update({ is_active: false })
            .eq('id', id);

          if (archiveErr) {
            return { success: false, error: archiveErr.message };
          }

          return {
            success: true,
            archived: true,
            message:
              'This plan is linked to active or historical subscriptions/payments. To preserve user accounts and financial records, it has been deactivated and archived rather than permanently deleted.',
          };
        }

        // If no subscriptions or payments reference it, we can safely hard-delete
        const { error: deleteErr } = await supabase
          .from('subscription_plans')
          .delete()
          .eq('id', id);

        if (deleteErr) {
          // If foreign key constraint still blocks it (e.g. coupons or other tables)
          if (deleteErr.code === '23503' || deleteErr.message.includes('foreign key')) {
            const { error: fallbackArchiveErr } = await supabase
              .from('subscription_plans')
              .update({ is_active: false })
              .eq('id', id);

            if (!fallbackArchiveErr) {
              return {
                success: true,
                archived: true,
                message:
                  'Plan is referenced in historical records. It has been deactivated and archived.',
              };
            }
          }
          return { success: false, error: deleteErr.message };
        }

        return {
          success: true,
          archived: false,
          message: 'Subscription plan was permanently deleted.',
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Deletion failed' };
      }
    }

    const idx = MOCK_SUBSCRIPTION_PLANS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      MOCK_SUBSCRIPTION_PLANS.splice(idx, 1);
    }
    return { success: true, archived: false, message: 'Plan deleted.' };
  },

  async grantStudentSubscription(
    userId: string,
    planId: string,
    durationDays: number
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const startsAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase.from('subscriptions').insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          starts_at: startsAt,
          expires_at: expiresAt,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Grant subscription failed',
        };
      }
    }
    return { success: true };
  },

  async revokeStudentSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            expires_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('status', 'active');
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Revoke subscription failed',
        };
      }
    }
    return { success: true };
  },

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            expires_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Cancel subscription failed',
        };
      }
    }
    return { success: true };
  },

  async bulkGrantStudentSubscription(
    userIds: string[],
    planId: string,
    durationDays: number
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    if (userIds.length === 0) return { success: true, count: 0 };
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('bulk_grant_student_subscription', {
          p_user_ids: userIds,
          p_plan_id: planId,
          p_duration_days: durationDays,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, count: Number(data || userIds.length) };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Bulk subscription assignment failed',
        };
      }
    }
    return { success: true, count: userIds.length };
  },

  async getAdminBatches(): Promise<AdminBatch[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('student_batches')
      .select('id, name, description, is_active, created_at, student_batch_members(count)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((batch: any) => ({
      id: batch.id,
      name: batch.name,
      description: batch.description || undefined,
      memberCount: Number(batch.student_batch_members?.[0]?.count || 0),
      isActive: Boolean(batch.is_active),
      createdAt: batch.created_at,
    }));
  },

  async createAdminBatch(
    name: string,
    description?: string
  ): Promise<{ success: boolean; batchId?: string; error?: string }> {
    if (!isSupabaseConfigured) return { success: true, batchId: `local-${Date.now()}` };
    const { data, error } = await supabase
      .from('student_batches')
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select('id')
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, batchId: data?.id };
  },

  async bulkAssignStudentsToBatch(
    batchId: string,
    userIds: string[]
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    if (userIds.length === 0) return { success: true, count: 0 };
    if (!isSupabaseConfigured) return { success: true, count: userIds.length };
    try {
      const { data, error } = await supabase.rpc('bulk_assign_students_to_batch', {
        p_batch_id: batchId,
        p_user_ids: userIds,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, count: Number(data || userIds.length) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Bulk batch assignment failed',
      };
    }
  },

  async markPaymentRefunded(
    paymentId: string,
    refundAmount: number,
    refundId?: string,
    refundReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) return { success: true };
    try {
      const { error } = await supabase.rpc('mark_payment_refunded', {
        p_payment_id: paymentId,
        p_refund_amount: refundAmount,
        p_refund_id: refundId || null,
        p_refund_reason: refundReason?.trim() || null,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Refund tracking update failed',
      };
    }
  },

  // --------------------------------------------------------------------------
  // COUPONS & DISCOUNTS API
  // --------------------------------------------------------------------------
  async getAdminCoupons(): Promise<CouponItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Failed to fetch coupons from database:', error);
          return [];
        }

        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            code: d.code,
            description: d.description || undefined,
            discountType: d.discount_type,
            discountValue: Number(d.discount_value),
            maxDiscountAmount: d.max_discount_amount ? Number(d.max_discount_amount) : undefined,
            minOrderAmount: Number(d.min_order_amount || 0),
            maxUses: d.max_uses ? Number(d.max_uses) : undefined,
            usedCount: Number(d.used_count || 0),
            maxUsesPerUser: Number(d.max_uses_per_user || 1),
            applicablePlanId: d.applicable_plan_id || undefined,
            validFrom: d.valid_from,
            validUntil: d.valid_until || undefined,
            isActive: Boolean(d.is_active),
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Error loading coupons:', err);
      }
      return [];
    }
    return localCoupons;
  },

  async createAdminCoupon(
    coupon: Omit<CouponItem, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; coupon?: CouponItem; error?: string }> {
    const normalizedCode = coupon.code.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .insert({
            code: normalizedCode,
            description: coupon.description || null,
            discount_type: coupon.discountType,
            discount_value: coupon.discountValue,
            max_discount_amount: coupon.maxDiscountAmount || null,
            min_order_amount: coupon.minOrderAmount || 0,
            max_uses: coupon.maxUses || null,
            max_uses_per_user: coupon.maxUsesPerUser || 1,
            applicable_plan_id: coupon.applicablePlanId || null,
            valid_from: coupon.validFrom || new Date().toISOString(),
            valid_until: coupon.validUntil || null,
            is_active: coupon.isActive ?? true,
          })
          .select()
          .single();

        if (error) return { success: false, error: error.message };

        const newCoupon: CouponItem = {
          id: data.id,
          code: data.code,
          description: data.description || undefined,
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          maxDiscountAmount: data.max_discount_amount
            ? Number(data.max_discount_amount)
            : undefined,
          minOrderAmount: Number(data.min_order_amount || 0),
          maxUses: data.max_uses ? Number(data.max_uses) : undefined,
          usedCount: Number(data.used_count || 0),
          maxUsesPerUser: Number(data.max_uses_per_user || 1),
          applicablePlanId: data.applicable_plan_id || undefined,
          validFrom: data.valid_from,
          validUntil: data.valid_until || undefined,
          isActive: Boolean(data.is_active),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        return { success: true, coupon: newCoupon };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Create coupon failed',
        };
      }
    }

    const fallbackCoupon: CouponItem = {
      ...coupon,
      id: 'local_coupon_' + Date.now(),
      code: normalizedCode,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localCoupons.unshift(fallbackCoupon);
    return { success: true, coupon: fallbackCoupon };
  },

  async updateAdminCoupon(
    id: string,
    updates: Partial<CouponItem>
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updates.code) payload.code = updates.code.trim().toUpperCase();
        if (updates.description !== undefined) payload.description = updates.description || null;
        if (updates.discountType) payload.discount_type = updates.discountType;
        if (updates.discountValue !== undefined) payload.discount_value = updates.discountValue;
        if (updates.maxDiscountAmount !== undefined)
          payload.max_discount_amount = updates.maxDiscountAmount || null;
        if (updates.minOrderAmount !== undefined) payload.min_order_amount = updates.minOrderAmount;
        if (updates.maxUses !== undefined) payload.max_uses = updates.maxUses || null;
        if (updates.maxUsesPerUser !== undefined)
          payload.max_uses_per_user = updates.maxUsesPerUser;
        if (updates.applicablePlanId !== undefined)
          payload.applicable_plan_id = updates.applicablePlanId || null;
        if (updates.validFrom) payload.valid_from = updates.validFrom;
        if (updates.validUntil !== undefined) payload.valid_until = updates.validUntil || null;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;

        const { error } = await supabase.from('coupons').update(payload).eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Update coupon failed',
        };
      }
    }

    const idx = localCoupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      localCoupons[idx] = { ...localCoupons[idx], ...updates, updatedAt: new Date().toISOString() };
    }
    return { success: true };
  },

  async deleteAdminCoupon(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Delete coupon failed',
        };
      }
    }

    const idx = localCoupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      localCoupons.splice(idx, 1);
    }
    return { success: true };
  },

  async validateCoupon(
    code: string,
    planId: string,
    amount: number,
    userId?: string
  ): Promise<CouponValidationResult> {
    const normalizedCode = code.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('validate_coupon_code', {
          p_code: normalizedCode,
          p_plan_id: planId,
          p_amount: amount,
          p_user_id: userId || null,
        });

        if (!error && data) {
          return {
            valid: Boolean(data.valid),
            couponId: data.coupon_id,
            code: data.code,
            discountType: data.discount_type,
            discountValue: data.discount_value ? Number(data.discount_value) : undefined,
            discountAmount: Number(data.discount_amount || 0),
            finalPrice: Number(data.final_price ?? amount),
            message: data.message || (data.valid ? 'Coupon applied!' : 'Invalid coupon'),
          };
        }
      } catch (err) {
        console.warn('Coupon validation RPC error:', err);
      }
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'Invalid or inactive coupon code.',
      };
    }

    // Local evaluation fallback
    const matched = localCoupons.find((c) => c.code.toUpperCase() === normalizedCode && c.isActive);
    if (!matched) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'Invalid or inactive coupon code.',
      };
    }

    if (matched.validUntil && new Date(matched.validUntil) < new Date()) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'This coupon code has expired.',
      };
    }

    if (matched.applicablePlanId && matched.applicablePlanId !== planId) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: 'This coupon is not valid for the selected plan.',
      };
    }

    if (amount < matched.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: amount,
        message: `Minimum order value of Rs. ${matched.minOrderAmount} required for this coupon.`,
      };
    }

    let discount = 0;
    if (matched.discountType === 'percentage') {
      discount = (amount * matched.discountValue) / 100;
      if (matched.maxDiscountAmount && discount > matched.maxDiscountAmount) {
        discount = matched.maxDiscountAmount;
      }
    } else {
      discount = matched.discountValue;
    }

    discount = Math.min(discount, amount);
    const finalPrice = Math.max(0, amount - discount);

    return {
      valid: true,
      couponId: matched.id,
      code: matched.code,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      discountAmount: Math.round(discount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      message: 'Coupon code applied successfully!',
    };
  },

  /**
   * Retrieves dynamically filtered revenue analytics, transactions, order value, student signups,
   * and day-by-day trends for any preset or custom date range (e.g. 1st Jan to 15th Jan).
   */
  async getDateRangeRevenueStats(
    startDateStr?: string,
    endDateStr?: string,
    preset: DateRangePreset = 'this_month'
  ): Promise<DateRangeRevenueStats> {
    const now = new Date();

    // Determine effective start and end dates
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const formatLocalDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (preset === 'yesterday') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (preset === '7d' || (preset as string) === 'last_7_days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (preset === '30d' || (preset as string) === 'last_30_days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (preset === 'custom' && startDateStr) {
      const [sy, sm, sd] = startDateStr.split('-').map(Number);
      start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      if (endDateStr) {
        const [ey, em, ed] = endDateStr.split('-').map(Number);
        end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const startTime = start.getTime();
    const endTime = end.getTime();
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    let payments: { amount: number; created_at: string; status: string }[] = [];
    let studentSignupsCount = 0;
    const studentSignupsByDate: Record<string, number> = {};

    if (isSupabaseConfigured) {
      try {
        const [payRes, profRes] = await Promise.all([
          supabase
            .from('payments')
            .select('amount, created_at, status')
            .eq('status', 'completed')
            .gte('created_at', startIso)
            .lte('created_at', endIso),
          supabase
            .from('profiles')
            .select('id, created_at')
            .gte('created_at', startIso)
            .lte('created_at', endIso),
        ]);

        if (payRes.data && Array.isArray(payRes.data)) {
          payments = payRes.data;
        }

        if (profRes.data && Array.isArray(profRes.data)) {
          studentSignupsCount = profRes.data.length;
          profRes.data.forEach((p: any) => {
            const d = p.created_at ? formatLocalDate(new Date(p.created_at)) : '';
            if (d) {
              studentSignupsByDate[d] = (studentSignupsByDate[d] || 0) + 1;
            }
          });
        }
      } catch (err) {
        console.warn('Failed querying date-range revenue from Supabase, using local store:', err);
      }
    }

    // Local Fallback ONLY if Supabase not configured
    if (!isSupabaseConfigured && payments.length === 0) {
      payments = (localPayments as any[])
        .filter((p) => {
          const dateVal = p.created_at || p.createdAt;
          if (!dateVal) return false;
          const t = new Date(dateVal).getTime();
          return t >= startTime && t <= endTime && p.status === 'completed';
        })
        .map((p) => ({
          amount: p.amount,
          created_at: p.created_at || p.createdAt,
          status: p.status,
        }));

      const filteredStudents = localStudents.filter((s: any) => {
        const dateVal = s.created_at || s.createdAt;
        if (!dateVal) return false;
        const t = new Date(dateVal).getTime();
        return t >= startTime && t <= endTime;
      });

      studentSignupsCount = filteredStudents.length;
      filteredStudents.forEach((s: any) => {
        const dateVal = s.created_at || s.createdAt;
        const d = formatLocalDate(new Date(dateVal));
        studentSignupsByDate[d] = (studentSignupsByDate[d] || 0) + 1;
      });
    }

    // Calculate aggregated metrics
    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalTransactions = payments.length;
    const avgOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Build Daily Trend
    const dailyMap = new Map<string, { amount: number; transactions: number; signups: number }>();
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0);
    const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0);

    while (cur <= endMid) {
      const key = formatLocalDate(cur);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          amount: 0,
          transactions: 0,
          signups: studentSignupsByDate[key] || 0,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    payments.forEach((p) => {
      if (p.created_at) {
        const key = formatLocalDate(new Date(p.created_at));
        if (dailyMap.has(key)) {
          const entry = dailyMap.get(key)!;
          entry.amount += Number(p.amount || 0);
          entry.transactions += 1;
        }
      }
    });

    const dailyTrend: DateRangeDailyPoint[] = Array.from(dailyMap.entries()).map(
      ([dateStr, val]) => {
        const d = new Date(dateStr + 'T12:00:00');
        const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return {
          date: dateStr,
          label,
          amount: val.amount,
          transactions: val.transactions,
          signups: val.signups,
        };
      }
    );

    const presetLabels: Record<string, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      '7d': 'Last 7 Days',
      last_7_days: 'Last 7 Days',
      this_month: 'This Month',
      '30d': 'Last 30 Days',
      last_30_days: 'Last 30 Days',
      this_year: 'This Year',
      custom: `${formatLocalDate(start)} to ${formatLocalDate(end)}`,
    };

    return {
      startDate: formatLocalDate(start),
      endDate: formatLocalDate(end),
      preset,
      label: presetLabels[preset] || 'Selected Range',
      totalRevenue,
      totalTransactions,
      transactionCount: totalTransactions,
      avgOrderValue,
      averageOrderValue: avgOrderValue,
      newStudentSignups: studentSignupsCount,
      newSignupsCount: studentSignupsCount,
      dailyTrend,
    };
  },

  /**
   * Retrieves comprehensive Platform Analytics & Reports:
   * 1. Student Performance (Total, Active, Tests Attempted, Questions Answered, Overall Accuracy, Trend)
   * 2. Complete Student Rankings (Rank, Name, Email, Tests, Questions, Accuracy, Score)
   * 3. Question & Topic Insights (Most Wrong Questions, Weakest Topics, Weakest Subjects)
   * 4. Revenue (Total, Monthly, Paid Students, Active Subscriptions, Revenue Trend)
   */
  async getPlatformAnalyticsOverview(
    preset: DateRangePreset = 'this_month',
    startDateStr?: string,
    endDateStr?: string
  ): Promise<PlatformAnalyticsData> {
    // 1. Revenue & Trend calculations
    const revenueRangeStats = await this.getDateRangeRevenueStats(startDateStr, endDateStr, preset);

    let totalRevenue = revenueRangeStats.totalRevenue;
    let monthlyRevenue = 0;
    let paidStudents = 0;
    let activeSubscriptions = 0;

    let studentProfiles: any[] = [];
    let attempts: any[] = [];
    let answersData: any[] = [];
    const activeSubUserIds = new Set<string>();

    if (isSupabaseConfigured) {
      try {
        const startOfMonthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // Concurrently query database for high-efficiency loading
        const [
          allPaymentsRes,
          monthPaymentsRes,
          subsRes,
          profilesRes,
          attemptsRes,
          answersRes,
        ] = await Promise.all([
          supabase.from('payments').select('amount, user_id, status').eq('status', 'completed'),
          supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .gte('created_at', startOfMonthIso),
          supabase
            .from('subscriptions')
            .select('user_id, status, expires_at')
            .eq('status', 'active'),
          supabase.from('profiles').select('id, full_name, email, role, created_at'),
          supabase
            .from('test_attempts')
            .select('id, user_id, status, score, total_marks, correct_count, wrong_count, accuracy, created_at'),
          supabase.from('attempt_answers').select(`
            question_id,
            is_correct,
            selected_option,
            questions (
              id,
              question_text,
              question_bengali_text,
              subject_id,
              chapter_id,
              difficulty,
              subjects ( id, name ),
              chapters ( id, name )
            )
          `),
        ]);

        if (allPaymentsRes.data && Array.isArray(allPaymentsRes.data)) {
          totalRevenue = allPaymentsRes.data.reduce((acc, p) => acc + Number(p.amount || 0), 0);
          const uniquePaying = new Set(allPaymentsRes.data.map((p) => p.user_id).filter(Boolean));
          paidStudents = uniquePaying.size;
        }

        if (monthPaymentsRes.data && Array.isArray(monthPaymentsRes.data)) {
          monthlyRevenue = monthPaymentsRes.data.reduce((acc, p) => acc + Number(p.amount || 0), 0);
        }

        if (subsRes.data && Array.isArray(subsRes.data)) {
          const nowIso = new Date().toISOString();
          const validSubs = subsRes.data.filter(
            (s) => !s.expires_at || s.expires_at > nowIso
          );
          activeSubscriptions = validSubs.length;
          validSubs.forEach((s) => activeSubUserIds.add(s.user_id));
        }

        if (profilesRes.data && Array.isArray(profilesRes.data)) {
          studentProfiles = profilesRes.data.filter((p) => {
            const email = p.email?.toLowerCase() || '';
            if (isAdminEmail(email)) return false;
            if (p.role === 'admin' || p.role === 'superadmin' || p.role === 'support') return false;
            return true;
          });
        }

        if (attemptsRes.data && Array.isArray(attemptsRes.data)) {
          attempts = attemptsRes.data;
        }

        if (answersRes.data && Array.isArray(answersRes.data)) {
          answersData = answersRes.data;
        }
      } catch (err) {
        console.warn('Supabase platform analytics query failed:', err);
      }
    }

    // Fallback ONLY if local mode (Supabase not configured)
    if (!isSupabaseConfigured && studentProfiles.length === 0) {
      studentProfiles = localStudents.map((s) => ({
        id: s.id,
        full_name: s.fullName,
        email: s.email,
        role: 'student',
        created_at: s.createdAt,
      }));
    }

    // Compute Student Performance metrics
    const totalStudents = studentProfiles.length;
    const activeStudentIds = new Set(attempts.map((a) => a.user_id).filter(Boolean));
    const activeStudents =
      activeStudentIds.size > 0
        ? activeStudentIds.size
        : !isSupabaseConfigured
          ? Math.min(totalStudents, Math.ceil(totalStudents * 0.7))
          : 0;
    const testsAttempted = attempts.length > 0 ? attempts.length : !isSupabaseConfigured ? 48 : 0;

    let totalCorrect = attempts.reduce((acc, curr) => acc + Number(curr.correct_count || 0), 0);
    let totalWrong = attempts.reduce((acc, curr) => acc + Number(curr.wrong_count || 0), 0);
    let questionsAnswered = totalCorrect + totalWrong;

    if (!isSupabaseConfigured && questionsAnswered === 0) {
      // Deterministic fallback for dev/demo
      totalCorrect = 1420;
      totalWrong = 380;
      questionsAnswered = 1800;
    }

    const overallAccuracy =
      questionsAnswered > 0 ? Number(((totalCorrect / questionsAnswered) * 100).toFixed(1)) : 0;

    // Group attempts by user for individual ranking
    const studentStatsMap = new Map<
      string,
      {
        totalTests: number;
        questionsAttempted: number;
        correctCount: number;
        totalScore: number;
        lastActive?: string;
      }
    >();

    attempts.forEach((att) => {
      if (!att.user_id) return;
      const prev = studentStatsMap.get(att.user_id) || {
        totalTests: 0,
        questionsAttempted: 0,
        correctCount: 0,
        totalScore: 0,
        lastActive: att.created_at,
      };

      const qAtt = Number(att.correct_count || 0) + Number(att.wrong_count || 0);
      prev.totalTests += 1;
      prev.questionsAttempted += qAtt;
      prev.correctCount += Number(att.correct_count || 0);
      prev.totalScore += Number(att.score || 0);
      if (!prev.lastActive || new Date(att.created_at) > new Date(prev.lastActive)) {
        prev.lastActive = att.created_at;
      }
      studentStatsMap.set(att.user_id, prev);
    });

    // Build Student Rankings
    const studentRankings: StudentRankRow[] = studentProfiles
      .map((student, idx) => {
        const stats = studentStatsMap.get(student.id);

        let totalTests = stats?.totalTests || 0;
        let questionsAttempted = stats?.questionsAttempted || 0;
        let correctCount = stats?.correctCount || 0;
        let totalScore = stats?.totalScore || 0;
        const lastActive = stats?.lastActive || student.created_at;

        // Provide realistic demo scoring ONLY when Supabase is not configured
        if (!isSupabaseConfigured && totalTests === 0 && attempts.length === 0) {
          totalTests = Math.max(1, 15 - (idx % 12));
          questionsAttempted = totalTests * 20;
          const sampleAcc = Math.max(45, 96 - idx * 4.5);
          correctCount = Math.round((questionsAttempted * sampleAcc) / 100);
          totalScore = Number((correctCount * 2 - (questionsAttempted - correctCount) * 0.5).toFixed(1));
        }

        const accuracy =
          questionsAttempted > 0
            ? Number(((correctCount / questionsAttempted) * 100).toFixed(1))
            : 0;

        return {
          rank: 0, // Assigned after sorting
          userId: student.id,
          name: student.full_name || 'Aspirant Student',
          email: student.email || '',
          totalTests,
          questionsAttempted,
          correctCount,
          accuracy,
          totalScore,
          isPro: activeSubUserIds.has(student.id) || (!isSupabaseConfigured && idx % 3 === 0),
          lastActive,
        };
      })
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.totalTests - a.totalTests;
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    const topStudent = studentRankings.length > 0 ? studentRankings[0] : undefined;

    // Build Performance Trend (last 7 data points)
    const trendMap = new Map<string, { attempts: number; totalScore: number; count: number; totalAcc: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      trendMap.set(dateKey, { attempts: 0, totalScore: 0, count: 0, totalAcc: 0 });
    }

    attempts.forEach((att) => {
      const dateKey = (att.created_at || '').slice(0, 10);
      if (trendMap.has(dateKey)) {
        const item = trendMap.get(dateKey)!;
        item.attempts += 1;
        item.totalScore += Number(att.score || 0);
        item.totalAcc += Number(att.accuracy || 0);
        item.count += 1;
      }
    });

    const performanceTrend: PerformanceTrendPoint[] = Array.from(trendMap.entries()).map(([dateStr, val], idx) => {
      const d = new Date(dateStr + 'T12:00:00');
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const attemptsCount =
        val.attempts > 0 ? val.attempts : !isSupabaseConfigured ? Math.max(3, (idx + 2) * 2) : 0;
      const averageAccuracy =
        val.count > 0
          ? Number((val.totalAcc / val.count).toFixed(1))
          : !isSupabaseConfigured
            ? Number((72 + (idx % 4) * 3).toFixed(1))
            : 0;
      const averageScore =
        val.count > 0
          ? Number((val.totalScore / val.count).toFixed(1))
          : !isSupabaseConfigured
            ? Number((38 + idx * 4).toFixed(1))
            : 0;

      return {
        date: dateStr,
        label,
        attemptsCount,
        averageAccuracy,
        averageScore,
      };
    });

    // ─── Question & Topic Insights ──────────────────────────────────────
    const mostWrongQuestions: QuestionInsightRow[] = [];
    const topicMap = new Map<string, { chapterName: string; subjectName: string; total: number; correct: number }>();
    const subjectMap = new Map<string, { subjectName: string; total: number; correct: number }>();

    if (answersData.length > 0) {
      const qMap = new Map<string, { qInfo: any; wrong: number; correct: number; total: number }>();

      answersData.forEach((row) => {
        const qId = row.question_id;
        const isCorrect = Boolean(row.is_correct);
        const qInfo = row.questions || {};

        if (!qMap.has(qId)) {
          qMap.set(qId, { qInfo, wrong: 0, correct: 0, total: 0 });
        }
        const item = qMap.get(qId)!;
        item.total += 1;
        if (isCorrect) item.correct += 1;
        else item.wrong += 1;

        // Topics (chapters)
        const chapName = qInfo.chapters?.name || qInfo.chapter_id || 'General Topic';
        const subName = qInfo.subjects?.name || qInfo.subject_id || 'General Subject';
        const chapKey = `${chapName}___${subName}`;

        if (!topicMap.has(chapKey)) {
          topicMap.set(chapKey, { chapterName: chapName, subjectName: subName, total: 0, correct: 0 });
        }
        const tItem = topicMap.get(chapKey)!;
        tItem.total += 1;
        if (isCorrect) tItem.correct += 1;

        // Subjects
        if (!subjectMap.has(subName)) {
          subjectMap.set(subName, { subjectName: subName, total: 0, correct: 0 });
        }
        const sItem = subjectMap.get(subName)!;
        sItem.total += 1;
        if (isCorrect) sItem.correct += 1;
      });

      // Top Wrong Questions
      Array.from(qMap.entries()).forEach(([qId, data]) => {
        const failureRate = data.total > 0 ? Number(((data.wrong / data.total) * 100).toFixed(1)) : 0;
        const accuracyRate = data.total > 0 ? Number(((data.correct / data.total) * 100).toFixed(1)) : 0;

        mostWrongQuestions.push({
          questionId: qId,
          questionText: data.qInfo.question_text || 'Mock Practice Question',
          questionBengaliText: data.qInfo.question_bengali_text,
          subjectName: data.qInfo.subjects?.name || 'General Subject',
          chapterName: data.qInfo.chapters?.name || 'Core Topic',
          difficulty: data.qInfo.difficulty || 'medium',
          totalAttempts: data.total,
          wrongCount: data.wrong,
          failureRate,
          accuracyRate,
        });
      });

      mostWrongQuestions.sort((a, b) => b.failureRate - a.failureRate || b.wrongCount - a.wrongCount);
    }

    // If answers data was empty AND Supabase is not configured, provide demo diagnostic items
    if (!isSupabaseConfigured && mostWrongQuestions.length === 0) {
      localQuestions.slice(0, 5).forEach((q, idx) => {
        const sub = localSubjects.find((s) => s.id === q.subjectId)?.name || 'General Science';
        const chap = localChapters.find((c) => c.id === q.chapterId)?.name || 'Fundamental Concept';
        const attemptsCount = 28 - idx * 3;
        const failureRate = Number((82.5 - idx * 4.2).toFixed(1));
        const wrongCount = Math.round((attemptsCount * failureRate) / 100);

        mostWrongQuestions.push({
          questionId: q.id,
          questionText: q.questionText,
          questionBengaliText: q.questionBengaliText,
          subjectName: sub,
          chapterName: chap,
          difficulty: q.difficulty || 'hard',
          totalAttempts: attemptsCount,
          wrongCount,
          failureRate,
          accuracyRate: Number((100 - failureRate).toFixed(1)),
        });
      });
    }

    // Weakest Topics
    const weakestTopics: TopicInsightRow[] = [];
    if (topicMap.size > 0) {
      Array.from(topicMap.entries()).forEach(([key, val]) => {
        const accuracyRate = val.total > 0 ? Number(((val.correct / val.total) * 100).toFixed(1)) : 0;
        weakestTopics.push({
          chapterId: key,
          chapterName: val.chapterName,
          subjectName: val.subjectName,
          totalQuestionsAttempted: val.total,
          accuracyRate,
        });
      });
      weakestTopics.sort((a, b) => a.accuracyRate - b.accuracyRate);
    } else if (!isSupabaseConfigured) {
      // Mock weakest topics (local demo mode only)
      const sampleTopics = [
        { name: 'Indian Constitution & Polity', sub: 'Polity & Governance', acc: 38.4, total: 142 },
        { name: 'Arithmetic & Number Systems', sub: 'Mathematics', acc: 42.1, total: 198 },
        { name: 'Medieval Bengal History', sub: 'History', acc: 46.8, total: 110 },
        { name: 'General Science & Optics', sub: 'Physics & Chemistry', acc: 51.2, total: 165 },
        { name: 'Logical Reasoning & Puzzles', sub: 'Reasoning Ability', acc: 54.7, total: 180 },
      ];
      sampleTopics.forEach((st, idx) => {
        weakestTopics.push({
          chapterId: `topic_${idx + 1}`,
          chapterName: st.name,
          subjectName: st.sub,
          totalQuestionsAttempted: st.total,
          accuracyRate: st.acc,
        });
      });
    }

    // Weakest Subjects
    const weakestSubjects: SubjectInsightRow[] = [];
    if (subjectMap.size > 0) {
      Array.from(subjectMap.entries()).forEach(([key, val]) => {
        const accuracyRate = val.total > 0 ? Number(((val.correct / val.total) * 100).toFixed(1)) : 0;
        weakestSubjects.push({
          subjectId: key,
          subjectName: val.subjectName,
          totalQuestionsAttempted: val.total,
          accuracyRate,
        });
      });
      weakestSubjects.sort((a, b) => a.accuracyRate - b.accuracyRate);
    } else if (!isSupabaseConfigured) {
      // Mock weakest subjects (local demo mode only)
      const sampleSubjects = [
        { name: 'Polity & Constitution', acc: 41.5, total: 240 },
        { name: 'Mathematics & Numerical Ability', acc: 47.3, total: 320 },
        { name: 'General Science', acc: 52.8, total: 290 },
        { name: 'Indian History & INM', acc: 56.4, total: 380 },
        { name: 'General Mental Ability', acc: 61.2, total: 210 },
      ];
      sampleSubjects.forEach((ss, idx) => {
        weakestSubjects.push({
          subjectId: `subj_${idx + 1}`,
          subjectName: ss.name,
          totalQuestionsAttempted: ss.total,
          accuracyRate: ss.acc,
        });
      });
    }

    // Revenue fallbacks ONLY if in local mode
    if (!isSupabaseConfigured && totalRevenue === 0 && localPayments.length > 0) {
      totalRevenue = localPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      monthlyRevenue = Math.round(totalRevenue * 0.45);
      paidStudents = Math.max(1, Math.round(totalStudents * 0.35));
      activeSubscriptions = Math.max(1, Math.round(paidStudents * 0.8));
    }

    return {
      studentPerformance: {
        totalStudents,
        activeStudents,
        testsAttempted,
        questionsAnswered,
        overallAccuracy,
        topStudent,
        performanceTrend,
      },
      studentRankings,
      questionInsights: {
        mostWrongQuestions: mostWrongQuestions.slice(0, 5),
        weakestTopics: weakestTopics.slice(0, 5),
        weakestSubjects: weakestSubjects.slice(0, 5),
      },
      revenue: {
        totalRevenue,
        monthlyRevenue: isSupabaseConfigured
          ? monthlyRevenue
          : monthlyRevenue || Math.round(totalRevenue * 0.4),
        paidStudents: isSupabaseConfigured
          ? paidStudents
          : paidStudents || Math.max(1, Math.round(totalStudents * 0.35)),
        activeSubscriptions: isSupabaseConfigured
          ? activeSubscriptions
          : activeSubscriptions || Math.max(1, Math.round(paidStudents * 0.8)),
        revenueTrend: revenueRangeStats.dailyTrend,
      },
    };
  },
};
