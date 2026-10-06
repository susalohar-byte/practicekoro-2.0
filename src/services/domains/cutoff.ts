import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  CutoffRecord,
  ExamCutoffConfig,
  StudentApplicableCutoff,
  StudentCategoryCode,
  StudentGenderCode,
  RecruitmentStage,
  CutoffType,
  CutoffScoreType,
} from '@/types';

// ============================================================================
// INITIAL SEED CONFIGURATIONS & HISTORICAL CUTOFF RECORDS
// ============================================================================

export const DEFAULT_EXAM_CUTOFF_CONFIGS: ExamCutoffConfig[] = [
  {
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    categoryEnabled: true,
    genderEnabled: true, // West Bengal Police specifies separate male/female cutoffs
    districtEnabled: false,
    stageEnabled: true,
    allowedStages: ['Preliminary', 'PMT / PET', 'Final Written', 'Final Merit'],
    defaultScoreType: 'raw_marks',
    defaultMaxMarks: 85,
  },
  {
    examId: 'wbpsc-clerkship',
    examTitle: 'WBPSC Clerkship',
    categoryEnabled: true,
    genderEnabled: false, // Common cutoff for all genders
    districtEnabled: false,
    stageEnabled: true,
    allowedStages: ['Preliminary', 'Written Examination', 'Final Merit'],
    defaultScoreType: 'raw_marks',
    defaultMaxMarks: 100,
  },
  {
    examId: 'kp-si',
    examTitle: 'KP SI (Sub-Inspector)',
    categoryEnabled: true,
    genderEnabled: true, // Separate cutoffs by gender and cadre
    districtEnabled: false,
    stageEnabled: true,
    allowedStages: ['Preliminary', 'PMT / PET', 'Final Written', 'Final Merit'],
    defaultScoreType: 'raw_marks',
    defaultMaxMarks: 200,
  },
  {
    examId: 'wbcs-exe',
    examTitle: 'WBCS (Executive)',
    categoryEnabled: true,
    genderEnabled: false,
    districtEnabled: false,
    stageEnabled: true,
    allowedStages: ['Preliminary', 'Written Examination', 'Final Merit'],
    defaultScoreType: 'raw_marks',
    defaultMaxMarks: 200,
  },
  {
    examId: 'wb-primary-tet',
    examTitle: 'WB Primary TET',
    categoryEnabled: true,
    genderEnabled: false,
    districtEnabled: false,
    stageEnabled: true,
    allowedStages: ['Written Examination', 'Final Merit'],
    defaultScoreType: 'percentage',
    defaultMaxMarks: 150,
  },
];

export const INITIAL_CUTOFF_RECORDS: CutoffRecord[] = [
  // ── WBP Constable 2026 Prelims (EXPECTED - PracticeKoro Academic Panel) ──
  {
    id: 'cut_exp_wbp_2026_gen_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'GEN',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 56.5,
    percentage: 66.47,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated threshold based on 6.8 lakh applications and moderate paper difficulty.',
    status: 'active',
  },
  {
    id: 'cut_exp_wbp_2026_gen_f',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'GEN',
    gender: 'FEMALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 51.0,
    percentage: 60.0,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated benchmark score for female UR aspirants.',
    status: 'active',
  },
  {
    id: 'cut_exp_wbp_2026_obca_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'OBC_A',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 46.5,
    percentage: 54.71,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated safe benchmark.',
    status: 'active',
  },
  {
    id: 'cut_exp_wbp_2026_obca_f',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'OBC_A',
    gender: 'FEMALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 40.0,
    percentage: 47.06,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated safe benchmark.',
    status: 'active',
  },
  {
    id: 'cut_exp_wbp_2026_obcb_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'OBC_B',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 54.0,
    percentage: 63.53,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated safe benchmark.',
    status: 'active',
  },
  {
    id: 'cut_exp_wbp_2026_sc_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'SC',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 49.0,
    percentage: 57.65,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated safe benchmark.',
    status: 'active',
  },
  {
    id: 'cut_exp_wbp_2026_st_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'ST',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 42.0,
    percentage: 49.41,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated safe benchmark.',
    status: 'active',
  },
  {
    id: 'cut_exp_wbp_2026_ews_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2026,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'EWS',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 50.0,
    percentage: 58.82,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2026',
    verificationStatus: 'Verified',
    verifiedBy: 'Senior Academic Expert Panel',
    verifiedDate: '2026-09-15T10:00:00Z',
    notes: 'Estimated safe benchmark.',
    status: 'active',
  },

  // ── WBP Constable 2024 Final Merit (OFFICIAL - WBPRB Verified) ──
  {
    id: 'cut_off_wbp_2024_gen_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    cutoffType: 'OFFICIAL',
    category: 'GEN',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 58.75,
    percentage: 69.12,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'West Bengal Police Recruitment Board (WBPRB)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Notice Memo No. 2024/WBPRB/CONST',
    verifiedDate: '2024-11-20T12:00:00Z',
    notes: 'Official final selection cut-off marks for Male UR category.',
    status: 'active',
  },
  {
    id: 'cut_off_wbp_2024_gen_f',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    cutoffType: 'OFFICIAL',
    category: 'GEN',
    gender: 'FEMALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 53.25,
    percentage: 62.65,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'West Bengal Police Recruitment Board (WBPRB)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Notice Memo No. 2024/WBPRB/CONST',
    verifiedDate: '2024-11-20T12:00:00Z',
    notes: 'Official final selection cut-off marks for Female UR category.',
    status: 'active',
  },
  {
    id: 'cut_off_wbp_2024_obca_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    cutoffType: 'OFFICIAL',
    category: 'OBC_A',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 48.5,
    percentage: 57.06,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'West Bengal Police Recruitment Board (WBPRB)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Notice Memo No. 2024/WBPRB/CONST',
    verifiedDate: '2024-11-20T12:00:00Z',
    notes: 'Official final cut-off marks for Male OBC-A.',
    status: 'active',
  },
  {
    id: 'cut_off_wbp_2024_obca_f',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    cutoffType: 'OFFICIAL',
    category: 'OBC_A',
    gender: 'FEMALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 42.0,
    percentage: 49.41,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'West Bengal Police Recruitment Board (WBPRB)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Notice Memo No. 2024/WBPRB/CONST',
    verifiedDate: '2024-11-20T12:00:00Z',
    notes: 'Official final cut-off marks for Female OBC-A.',
    status: 'active',
  },
  {
    id: 'cut_off_wbp_2024_obcb_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    cutoffType: 'OFFICIAL',
    category: 'OBC_B',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 56.25,
    percentage: 66.18,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'West Bengal Police Recruitment Board (WBPRB)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Notice Memo No. 2024/WBPRB/CONST',
    verifiedDate: '2024-11-20T12:00:00Z',
    notes: 'Official final cut-off marks for Male OBC-B.',
    status: 'active',
  },
  {
    id: 'cut_off_wbp_2024_sc_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    cutoffType: 'OFFICIAL',
    category: 'SC',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 51.5,
    percentage: 60.59,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'West Bengal Police Recruitment Board (WBPRB)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Notice Memo No. 2024/WBPRB/CONST',
    verifiedDate: '2024-11-20T12:00:00Z',
    notes: 'Official final cut-off marks for Male SC.',
    status: 'active',
  },
  {
    id: 'cut_off_wbp_2024_st_m',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    cutoffType: 'OFFICIAL',
    category: 'ST',
    gender: 'MALE',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 85,
    cutoffMarks: 44.0,
    percentage: 51.76,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'West Bengal Police Recruitment Board (WBPRB)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Notice Memo No. 2024/WBPRB/CONST',
    verifiedDate: '2024-11-20T12:00:00Z',
    notes: 'Official final cut-off marks for Male ST.',
    status: 'active',
  },

  // ── WBP Constable 2022 Preliminary (OFFICIAL - Historical comparison) ──
  {
    id: 'cut_off_wbp_2022_pre_gen',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2022,
    stage: 'Preliminary',
    cutoffType: 'OFFICIAL',
    category: 'GEN',
    gender: 'ALL',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 100,
    cutoffMarks: 41.25,
    percentage: 41.25,
    negativeMarking: 0.25,
    sourceType: 'Official Recruitment Board',
    source: 'West Bengal Police Recruitment Board (2020 Cycle)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Official Gazette Record',
    verifiedDate: '2022-03-11T12:00:00Z',
    notes: 'Official screening threshold for PMT/PET appearance.',
    status: 'active',
  },
  {
    id: 'cut_off_wbp_2022_pre_obca',
    examId: 'wbp-constable',
    examTitle: 'WBP Constable',
    year: 2022,
    stage: 'Preliminary',
    cutoffType: 'OFFICIAL',
    category: 'OBC_A',
    gender: 'ALL',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 100,
    cutoffMarks: 31.5,
    percentage: 31.5,
    negativeMarking: 0.25,
    sourceType: 'Official Recruitment Board',
    source: 'West Bengal Police Recruitment Board (2020 Cycle)',
    sourceUrl: 'https://prb.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPRB Official Gazette Record',
    verifiedDate: '2022-03-11T12:00:00Z',
    notes: 'Official screening threshold for PMT/PET appearance.',
    status: 'active',
  },

  // ── WBPSC Clerkship 2024 Part-I (EXPECTED - Gender: ALL) ──
  {
    id: 'cut_exp_clerk_2024_gen',
    examId: 'wbpsc-clerkship',
    examTitle: 'WBPSC Clerkship',
    year: 2024,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'GEN',
    gender: 'ALL',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 100,
    cutoffMarks: 65.0,
    percentage: 65.0,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2024',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPSC Subject Mentors',
    verifiedDate: '2024-10-10T12:00:00Z',
    notes: 'Estimated benchmark for Part-II descriptive qualification.',
    status: 'active',
  },
  {
    id: 'cut_exp_clerk_2024_obca',
    examId: 'wbpsc-clerkship',
    examTitle: 'WBPSC Clerkship',
    year: 2024,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'OBC_A',
    gender: 'ALL',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 100,
    cutoffMarks: 55.0,
    percentage: 55.0,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2024',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPSC Subject Mentors',
    verifiedDate: '2024-10-10T12:00:00Z',
    notes: 'Estimated threshold for OBC-A aspirants.',
    status: 'active',
  },
  {
    id: 'cut_exp_clerk_2024_sc',
    examId: 'wbpsc-clerkship',
    examTitle: 'WBPSC Clerkship',
    year: 2024,
    stage: 'Preliminary',
    cutoffType: 'EXPECTED',
    category: 'SC',
    gender: 'ALL',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 100,
    cutoffMarks: 52.0,
    percentage: 52.0,
    negativeMarking: 0.25,
    sourceType: 'PracticeKoro Academic Panel',
    source: 'PracticeKoro Academic Panel 2024',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPSC Subject Mentors',
    verifiedDate: '2024-10-10T12:00:00Z',
    notes: 'Estimated threshold for SC aspirants.',
    status: 'active',
  },

  // ── WBPSC Clerkship 2019 Part-I (OFFICIAL - Verified) ──
  {
    id: 'cut_off_clerk_2019_gen',
    examId: 'wbpsc-clerkship',
    examTitle: 'WBPSC Clerkship',
    year: 2019,
    stage: 'Preliminary',
    cutoffType: 'OFFICIAL',
    category: 'GEN',
    gender: 'ALL',
    district: 'ALL',
    scoreType: 'raw_marks',
    maxMarks: 100,
    cutoffMarks: 65.0,
    percentage: 65.0,
    negativeMarking: 0.25,
    sourceType: 'Official Result',
    source: 'Public Service Commission, West Bengal (WBPSC)',
    sourceUrl: 'https://psc.wb.gov.in',
    verificationStatus: 'Verified',
    verifiedBy: 'WBPSC Notification 05/2019',
    verifiedDate: '2020-07-24T12:00:00Z',
    notes: 'Official Part-I qualification marks for Part-II appearance.',
    status: 'active',
  },
];

// Fallback in-memory store
let memoryConfigs: ExamCutoffConfig[] = [...DEFAULT_EXAM_CUTOFF_CONFIGS];
let memoryRecords: CutoffRecord[] = [...INITIAL_CUTOFF_RECORDS];

// ============================================================================
// CUTOFF DOMAIN API
// ============================================================================

export const cutoffApi = {
  /**
   * Fetch all Exam Cutoff Configurations
   */
  async getExamCutoffConfigs(): Promise<ExamCutoffConfig[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('exam_cutoff_configs').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            examId: row.exam_id,
            examTitle: row.exam_id, // title resolved in UI or join
            categoryEnabled: row.category_enabled,
            genderEnabled: row.gender_enabled,
            districtEnabled: row.district_enabled,
            stageEnabled: row.stage_enabled,
            allowedStages: (row.allowed_stages as RecruitmentStage[]) || [],
            defaultScoreType: (row.default_score_type as CutoffScoreType) || 'raw_marks',
            defaultMaxMarks: Number(row.default_max_marks || 100),
          }));
        }
      } catch (err) {
        console.warn('Could not read exam_cutoff_configs from Supabase, using fallback:', err);
      }
    }
    return [...memoryConfigs];
  },

  /**
   * Fetch a single exam's Cutoff Configuration
   */
  async getExamCutoffConfig(examId: string): Promise<ExamCutoffConfig> {
    const configs = await this.getExamCutoffConfigs();
    const found = configs.find(
      (c) => c.examId.toLowerCase() === examId.toLowerCase()
    );
    if (found) return found;

    // Default configuration if exam doesn't have custom config yet
    return {
      examId,
      examTitle: examId,
      categoryEnabled: true,
      genderEnabled: false, // by default gender is NOT assumed
      districtEnabled: false, // by default district is NOT assumed
      stageEnabled: true,
      allowedStages: ['Preliminary', 'Written Examination', 'Final Merit'],
      defaultScoreType: 'raw_marks',
      defaultMaxMarks: 100,
    };
  },

  /**
   * Save or Update an Exam Cutoff Configuration
   */
  async saveExamCutoffConfig(config: ExamCutoffConfig): Promise<ExamCutoffConfig> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('exam_cutoff_configs').upsert({
          exam_id: config.examId,
          category_enabled: config.categoryEnabled,
          gender_enabled: config.genderEnabled,
          district_enabled: config.districtEnabled,
          stage_enabled: config.stageEnabled,
          allowed_stages: config.allowedStages,
          default_score_type: config.defaultScoreType,
          default_max_marks: config.defaultMaxMarks,
          updated_at: new Date().toISOString(),
        });
        if (error) console.warn('Supabase upsert exam_cutoff_configs warning:', error);
      } catch (err) {
        console.warn('Supabase exam_cutoff_configs error:', err);
      }
    }

    const index = memoryConfigs.findIndex((c) => c.examId === config.examId);
    if (index >= 0) {
      memoryConfigs[index] = { ...config };
    } else {
      memoryConfigs.push({ ...config });
    }
    return config;
  },

  /**
   * Fetch Cutoff Records with multi-criteria filtering
   */
  async getCutoffRecords(filters?: {
    examId?: string;
    year?: number;
    stage?: string;
    cutoffType?: CutoffType;
    category?: StudentCategoryCode;
    gender?: string;
    district?: string;
  }): Promise<CutoffRecord[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('cutoff_records').select('*');
        if (filters?.examId && filters.examId !== 'all') {
          query = query.eq('exam_id', filters.examId);
        }
        if (filters?.year) {
          query = query.eq('year', filters.year);
        }
        if (filters?.stage && filters.stage !== 'all') {
          query = query.eq('stage', filters.stage);
        }
        if (filters?.cutoffType) {
          query = query.eq('cutoff_type', filters.cutoffType);
        }
        if (filters?.category && filters.category !== 'NOT_SPECIFIED') {
          query = query.eq('category', filters.category);
        }

        const { data, error } = await query.order('year', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: String(row.id),
            examId: row.exam_id,
            examTitle: row.exam_title,
            year: row.year,
            stage: row.stage as RecruitmentStage,
            cutoffType: row.cutoff_type as CutoffType,
            category: row.category as StudentCategoryCode,
            gender: (row.gender || 'ALL') as any,
            district: row.district || 'ALL',
            scoreType: (row.score_type as CutoffScoreType) || 'raw_marks',
            maxMarks: Number(row.max_marks),
            cutoffMarks: Number(row.cutoff_marks),
            percentage: row.percentage ? Number(row.percentage) : undefined,
            negativeMarking: row.negative_marking ? Number(row.negative_marking) : undefined,
            sourceType: row.source_type as any,
            source: row.source,
            sourceUrl: row.source_url || undefined,
            verificationStatus: (row.verification_status || 'Verified') as any,
            verifiedBy: row.verified_by || undefined,
            verifiedDate: row.verified_date || undefined,
            notes: row.notes || undefined,
            status: (row.status || 'active') as any,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Could not read cutoff_records from Supabase, using fallback:', err);
      }
    }

    // Apply memory filters
    return memoryRecords.filter((rec) => {
      if (filters?.examId && filters.examId !== 'all' && rec.examId !== filters.examId) {
        return false;
      }
      if (filters?.year && rec.year !== filters.year) {
        return false;
      }
      if (filters?.stage && filters.stage !== 'all' && rec.stage !== filters.stage) {
        return false;
      }
      if (filters?.cutoffType && rec.cutoffType !== filters.cutoffType) {
        return false;
      }
      if (filters?.category && filters.category !== 'NOT_SPECIFIED' && rec.category !== filters.category) {
        return false;
      }
      return true;
    });
  },

  /**
   * Save or Update a Cutoff Record (Validates required fields per Section 23)
   */
  async saveCutoffRecord(
    record: Omit<CutoffRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<CutoffRecord> {
    if (!record.examId || !record.year || !record.stage || !record.cutoffMarks || !record.source) {
      throw new Error('Exam, Year, Stage, Cutoff Marks, and Source are mandatory.');
    }

    const calculatedPercentage =
      record.percentage !== undefined
        ? record.percentage
        : Math.round(((record.cutoffMarks / record.maxMarks) * 100) * 100) / 100;

    const id = record.id || `cut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullRecord: CutoffRecord = {
      ...record,
      id,
      percentage: calculatedPercentage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('cutoff_records').upsert({
          id: fullRecord.id.includes('cut_') ? undefined : fullRecord.id, // let UUID generate if new
          exam_id: fullRecord.examId,
          exam_title: fullRecord.examTitle,
          year: fullRecord.year,
          stage: fullRecord.stage,
          cutoff_type: fullRecord.cutoffType,
          category: fullRecord.category,
          gender: fullRecord.gender || 'ALL',
          district: fullRecord.district || 'ALL',
          score_type: fullRecord.scoreType,
          max_marks: fullRecord.maxMarks,
          cutoff_marks: fullRecord.cutoffMarks,
          percentage: fullRecord.percentage,
          negative_marking: fullRecord.negativeMarking || 0.25,
          source_type: fullRecord.sourceType,
          source: fullRecord.source,
          source_url: fullRecord.sourceUrl || null,
          verification_status: fullRecord.verificationStatus,
          verified_by: fullRecord.verifiedBy || null,
          verified_date: fullRecord.verifiedDate || null,
          notes: fullRecord.notes || null,
          status: fullRecord.status,
          updated_at: new Date().toISOString(),
        });
        if (error) console.warn('Supabase cutoff_records upsert error:', error);
      } catch (err) {
        console.warn('Supabase cutoff_records upsert exception:', err);
      }
    }

    const index = memoryRecords.findIndex((r) => r.id === fullRecord.id);
    if (index >= 0) {
      memoryRecords[index] = fullRecord;
    } else {
      memoryRecords.unshift(fullRecord);
    }

    return fullRecord;
  },

  /**
   * Delete a Cutoff Record
   */
  async deleteCutoffRecord(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('cutoff_records').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase cutoff_records delete exception:', err);
      }
    }
    memoryRecords = memoryRecords.filter((r) => r.id !== id);
    return true;
  },

  /**
   * Get applicable cutoff for a student based on their Category, Gender, and Exam rules.
   * Complies strictly with Sections 8, 14, 15, and 16:
   * - Does NOT apply gender-specific cutoff unless the exam's configuration actually defines one!
   * - Keeps Expected Cutoff and Previous Official Cutoff clearly separated.
   */
  async getStudentApplicableCutoff(
    examId: string,
    studentProfile?: {
      category?: StudentCategoryCode;
      gender?: StudentGenderCode;
      district?: string;
    }
  ): Promise<StudentApplicableCutoff> {
    const config = await this.getExamCutoffConfig(examId);
    const records = await this.getCutoffRecords({ examId });

    const studentCat: StudentCategoryCode =
      studentProfile?.category && studentProfile.category !== 'NOT_SPECIFIED'
        ? studentProfile.category
        : 'GEN';

    const rawGender: StudentGenderCode = studentProfile?.gender || 'NOT_SPECIFIED';
    const isGenderApplicable = config.genderEnabled && (rawGender === 'MALE' || rawGender === 'FEMALE');

    // Matching Expected Cutoff (Priority: Category + Gender -> Category + ALL -> GEN)
    let matchedExpected: CutoffRecord | null = null;
    const expectedRecords = records.filter(
      (r) => r.cutoffType === 'EXPECTED' && r.status === 'active'
    );

    if (isGenderApplicable) {
      matchedExpected =
        expectedRecords.find(
          (r) => r.category === studentCat && r.gender === rawGender
        ) || null;
    }
    if (!matchedExpected) {
      matchedExpected =
        expectedRecords.find(
          (r) => r.category === studentCat && (r.gender === 'ALL' || !config.genderEnabled)
        ) || null;
    }
    if (!matchedExpected) {
      // Fallback to General / UR
      matchedExpected =
        expectedRecords.find(
          (r) => r.category === 'GEN' && (isGenderApplicable ? r.gender === rawGender : true)
        ) || expectedRecords[0] || null;
    }

    // Matching Previous Official Cutoff
    let matchedOfficial: CutoffRecord | null = null;
    const officialRecords = records.filter(
      (r) => r.cutoffType === 'OFFICIAL' && r.status === 'active'
    );

    if (isGenderApplicable) {
      matchedOfficial =
        officialRecords.find(
          (r) => r.category === studentCat && r.gender === rawGender
        ) || null;
    }
    if (!matchedOfficial) {
      matchedOfficial =
        officialRecords.find(
          (r) => r.category === studentCat && (r.gender === 'ALL' || !config.genderEnabled)
        ) || null;
    }
    if (!matchedOfficial) {
      matchedOfficial =
        officialRecords.find(
          (r) => r.category === 'GEN' && (isGenderApplicable ? r.gender === rawGender : true)
        ) || officialRecords[0] || null;
    }

    // Historical official cutoff list (sorted by year desc)
    const historicalOfficialCutoffs = officialRecords
      .filter((r) => {
        if (r.category !== studentCat && r.category !== 'GEN') return false;
        if (isGenderApplicable && r.gender !== rawGender && r.gender !== 'ALL') return false;
        return true;
      })
      .sort((a, b) => b.year - a.year);

    return {
      examId: config.examId,
      examTitle: config.examTitle,
      studentCategory: studentCat,
      studentGender: rawGender,
      isGenderApplicable,
      isDistrictApplicable: config.districtEnabled,
      expectedCutoff: matchedExpected,
      previousOfficialCutoff: matchedOfficial,
      historicalOfficialCutoffs,
    };
  },
};
