import { withMutationConfirmation } from '@/services/domains/admin.mutations';
// PracticeKoro API layer (barrel).
// The original 2,873-line api.ts was split into domain modules; every method body was
// extracted verbatim. The `api` object below keeps the exact same public surface, so
// all existing `import { api } from '@/services/api'` call sites remain valid.
import { catalogApi } from '@/services/domains/catalog';
import { subscriptionApi } from '@/services/domains/subscription';
import { adminCommerceApi } from '@/services/domains/adminCommerce';
import { adminApi } from '@/services/domains/admin';
import * as auditLogDomain from '@/services/domains/auditLog';
import { liveRevisionApi } from '@/services/domains/liveRevision';
import { studentHomeApi } from '@/services/domains/studentHome';
import { accountManagementApi } from '@/services/domains/accountManagement';
import { adminRecordsApi } from '@/services/domains/admin.records';
import { cutoffApi } from '@/services/domains/cutoff';

export const api = withMutationConfirmation({
  ...catalogApi,
  ...subscriptionApi,
  ...adminCommerceApi,
  ...adminApi,
  ...auditLogDomain,
  ...liveRevisionApi,
  ...studentHomeApi,
  ...cutoffApi,
  ...accountManagementApi,
  ...adminRecordsApi,
});

export type {
  Exam,
  Subject,
  Chapter,
  TestSeries,
  MockTest,
  Question,
  PopularExamCard,
  PopularTestSeriesCard,
  BlogPost,
} from '@/types';
export type { LiveTest } from '@/services/domains/liveRevision';
