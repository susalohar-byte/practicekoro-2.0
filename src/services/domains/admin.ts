/**
 * Admin content-management API (exams, subjects, chapters, series, tests, questions).
 * Full Supabase CRUD operations without mock data fallbacks when Supabase is configured.
 *
 * Assembly only: method bodies live in the admin.* section modules.
 * The exported `adminApi` shape (keys + order) is unchanged.
 */
import { adminExamsApi } from './admin.exams';
import { adminSubjectsApi } from './admin.subjects';
import { adminChaptersApi } from './admin.chapters';
import { adminTestSeriesApi } from './admin.testSeries';
import { adminTestsApi } from './admin.tests';
import { adminQuestionsApi } from './admin.questions';
import { adminExamCategoriesApi } from './admin.examCategories';
import { adminTestQuestionsApi } from './admin.testQuestions';
import { adminBulkImportsApi } from './admin.bulkImports';
import { adminNotificationsApi } from './admin.notifications';
import { adminSupportApi } from './admin.support';
import { adminSettingsApi } from './admin.settings';
import { adminLiveTestsApi } from './admin.liveTests';
import { adminBlogApi } from './admin.blog';

export const adminApi = {
  ...adminExamsApi,
  ...adminSubjectsApi,
  ...adminChaptersApi,
  ...adminTestSeriesApi,
  ...adminTestsApi,
  ...adminLiveTestsApi,
  ...adminBlogApi,
  ...adminQuestionsApi,
  ...adminExamCategoriesApi,
  ...adminTestQuestionsApi,
  ...adminBulkImportsApi,
  ...adminNotificationsApi,
  ...adminSupportApi,
  ...adminSettingsApi,
};

