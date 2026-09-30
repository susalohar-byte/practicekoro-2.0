export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'student' | 'admin' | 'instructor';
export type TestType = 'chapter_mock' | 'full_mock' | 'subject_mock' | 'pyq';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          district: string | null;
          target_exam_id: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          district?: string | null;
          target_exam_id?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: UserRole;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
      };
      exams: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          category: string;
          icon_name: string;
          banner_url: string | null;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          slug: string;
          description?: string | null;
          category?: string;
          icon_name?: string;
          banner_url?: string | null;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['exams']['Insert']>;
      };
      subjects: {
        Row: {
          id: string;
          exam_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          icon_name: string;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          exam_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          icon_name?: string;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      chapters: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          subject_id: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>;
      };
      exam_topics: {
        Row: {
          id: string;
          exam_id: string;
          topic_id: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          topic_id: string;
          order_index?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['exam_topics']['Insert']>;
      };
      test_series: {
        Row: {
          id: string;
          exam_id: string;
          title: string;
          slug: string;
          description: string | null;
          is_premium: boolean;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          exam_id: string;
          title: string;
          slug: string;
          description?: string | null;
          is_premium?: boolean;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['test_series']['Insert']>;
      };
      tests: {
        Row: {
          id: string;
          exam_id: string | null;
          subject_id: string | null;
          chapter_id: string | null;
          test_series_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          test_type: TestType;
          duration_minutes: number;
          total_questions: number;
          total_marks: number;
          passing_marks: number;
          negative_marking: number;
          is_premium: boolean;
          year: number | null;
          paper_name: string | null;
          shift: string | null;
          set_name: string | null;
          exam_date: string | null;
          order_index: number;
          is_active: boolean;
          status: 'draft' | 'published' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          exam_id?: string | null;
          subject_id?: string | null;
          chapter_id?: string | null;
          test_series_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          test_type?: TestType;
          duration_minutes?: number;
          total_questions?: number;
          total_marks?: number;
          passing_marks?: number;
          negative_marking?: number;
          is_premium?: boolean;
          year?: number | null;
          paper_name?: string | null;
          shift?: string | null;
          set_name?: string | null;
          exam_date?: string | null;
          order_index?: number;
          is_active?: boolean;
          status?: 'draft' | 'published' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tests']['Insert']>;
      };
      questions: {
        Row: {
          id: string;
          chapter_id: string | null;
          topic_id: string | null;
          subject_id: string | null;
          question_text: string;
          question_bengali_text: string | null;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: string;
          explanation: string | null;
          explanation_bengali: string | null;
          difficulty?: DifficultyLevel | null;
          default_marks: number;
          default_negative_marks: number;
          question_type: string | null;
          source_type: 'topic' | 'pyq' | 'other' | null;
          source_year: number | null;
          source_exam: string | null;
          source_paper: string | null;
          source_shift: string | null;
          is_active: boolean;
          status: 'active' | 'archived' | 'draft';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id?: string | null;
          topic_id?: string | null;
          subject_id?: string | null;
          question_text: string;
          question_bengali_text?: string | null;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: string;
          explanation?: string | null;
          explanation_bengali?: string | null;
          difficulty?: DifficultyLevel | null;
          default_marks?: number;
          default_negative_marks?: number;
          question_type?: string | null;
          source_type?: 'topic' | 'pyq' | 'other' | null;
          source_year?: number | null;
          source_exam?: string | null;
          source_paper?: string | null;
          source_shift?: string | null;
          is_active?: boolean;
          status?: 'active' | 'archived' | 'draft';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['questions']['Insert']>;
      };
      test_questions: {
        Row: {
          id: string;
          test_id: string;
          question_id: string;
          question_order: number;
          marks: number;
          negative_marks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          question_id: string;
          question_order: number;
          marks?: number;
          negative_marks?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['test_questions']['Insert']>;
      };
      subscription_plans: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          duration_days: number;
          price: number;
          original_price: number | null;
          features: Json;
          is_active: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description?: string | null;
          duration_days?: number;
          price: number;
          original_price?: number | null;
          features?: Json;
          is_active?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscription_plans']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          payment_id: string | null;
          status: SubscriptionStatus;
          starts_at: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          payment_id?: string | null;
          status?: SubscriptionStatus;
          starts_at?: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      test_attempts: {
        Row: {
          id: string;
          user_id: string;
          test_id: string;
          status: AttemptStatus;
          start_time: string;
          end_time: string | null;
          time_spent_seconds: number;
          score: number;
          total_marks: number;
          correct_count: number;
          wrong_count: number;
          skipped_count: number;
          accuracy: number;
          rank: number | null;
          percentile: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_id: string;
          status?: AttemptStatus;
          start_time?: string;
          end_time?: string | null;
          time_spent_seconds?: number;
          score?: number;
          total_marks?: number;
          correct_count?: number;
          wrong_count?: number;
          skipped_count?: number;
          accuracy?: number;
          rank?: number | null;
          percentile?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['test_attempts']['Insert']>;
      };
      mistakes: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          last_attempt_id: string | null;
          wrong_count: number;
          is_resolved: boolean;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          last_attempt_id?: string | null;
          wrong_count?: number;
          is_resolved?: boolean;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mistakes']['Insert']>;
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['bookmarks']['Insert']>;
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option: 'A' | 'B' | 'C' | 'D' | null;
          is_correct: boolean | null;
          marks_awarded: number;
          time_spent_seconds: number;
          is_marked_for_review: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option?: 'A' | 'B' | 'C' | 'D' | null;
          is_correct?: boolean | null;
          marks_awarded?: number;
          time_spent_seconds?: number;
          is_marked_for_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attempt_answers']['Insert']>;
      };
      test_results: {
        Row: {
          id: string;
          attempt_id: string;
          user_id: string;
          test_id: string;
          score: number;
          total_marks: number;
          percentage: number;
          accuracy: number;
          rank: number | null;
          total_candidates: number;
          percentile: number | null;
          passed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          user_id: string;
          test_id: string;
          score: number;
          total_marks: number;
          percentage: number;
          accuracy: number;
          rank?: number | null;
          total_candidates?: number;
          percentile?: number | null;
          passed?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['test_results']['Insert']>;
      };
    };
    Functions: {
      has_role: {
        Args: { p_user_id: string; p_role: string };
        Returns: boolean;
      };
      has_active_subscription: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      has_test_access: {
        Args: { p_user_id: string; p_test_id: string };
        Returns: boolean;
      };
      start_test_attempt: {
        Args: { p_test_id: string };
        Returns: Json;
      };
      get_student_exam_questions: {
        Args: { p_test_id: string };
        Returns: Json;
      };
      save_test_answers: {
        Args: { p_attempt_id: string; p_answers: Json; p_time_spent_seconds: number };
        Returns: boolean;
      };
      submit_test_attempt: {
        Args: { p_attempt_id: string; p_answers: Json; p_time_spent_seconds: number };
        Returns: Json;
      };
      get_attempt_solutions: {
        Args: { p_attempt_id: string };
        Returns: Json;
      };
      get_test_series_analytics: {
        Args: { p_series_id: string };
        Returns: Json;
      };
      get_admin_dashboard_counts: {
        Args: Record<string, never>;
        Returns: Json;
      };
      save_test_questions: {
        Args: { p_test_id: string; p_questions: Json };
        Returns: Json;
      };
      publish_test: {
        Args: { p_test_id: string };
        Returns: Json;
      };
      archive_test: {
        Args: { p_test_id: string };
        Returns: Json;
      };
    };
  };
}
