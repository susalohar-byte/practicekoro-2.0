import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type AdminSkeletonVariant = 'table' | 'dashboard' | 'cards' | 'form' | 'detail';
const panel =
  'rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0A1024] p-4 sm:p-5';
const items = (n: number) => Array.from({ length: n }, (_, i) => i);

export function AdminSectionSkeleton({
  label = 'Loading details…',
  variant = 'list',
  className,
}: {
  label?: string;
  variant?: 'list' | 'table' | 'form';
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn('space-y-3', className)}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        {items(variant === 'form' ? 4 : 5).map((i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3 py-2',
              variant === 'table' && 'border-b border-slate-100 dark:border-slate-800'
            )}
          >
            {variant === 'list' && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className={cn('h-3 w-1/2', variant === 'form' && 'h-9 w-full')} />
            </div>
            {variant === 'table' && <Skeleton className="h-5 w-20" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPageSkeleton({
  label = 'Loading admin page…',
  variant = 'table',
  className,
  showHeader = true,
}: {
  label?: string;
  variant?: AdminSkeletonVariant;
  className?: string;
  showHeader?: boolean;
}) {
  return (
    <section
      data-slot="admin-page-skeleton"
      data-variant={variant}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn('mx-auto w-full max-w-[1600px] space-y-4 p-4 sm:p-6', className)}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-4">
        {showHeader && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 max-w-full" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        )}
        {variant !== 'form' && variant !== 'detail' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items(5).map((i) => (
              <div className={cn(panel, 'flex items-center gap-3')} key={i}>
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
            ))}
          </div>
        )}
        {variant === 'dashboard' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {items(2).map((i) => (
              <div className={panel} key={i}>
                <Skeleton className="mb-5 h-4 w-36" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}
        {variant === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items(3).map((i) => (
              <div className={cn(panel, 'space-y-5')} key={i}>
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-8 w-20" />
                {items(4).map((j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : variant === 'form' ? (
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className={panel}>
              {items(6).map((i) => (
                <Skeleton key={i} className="mb-4 h-5 w-full" />
              ))}
            </div>
            <div className={panel}>
              <AdminSectionSkeleton variant="form" label={label} />
            </div>
          </div>
        ) : variant === 'detail' ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className={panel}>
              <AdminSectionSkeleton label={label} />
            </div>
            <div className={panel}>
              <AdminSectionSkeleton variant="form" label={label} />
            </div>
          </div>
        ) : (
          <>
            <div className={cn(panel, 'flex flex-wrap gap-3')}>
              <Skeleton className="h-9 w-56 max-w-full rounded-xl" />
              {items(3).map((i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-xl" />
              ))}
            </div>
            <div className={cn(panel, 'overflow-hidden')}>
              <div className="overflow-x-auto">
                <div className="min-w-[680px] space-y-4">
                  <div className="grid grid-cols-6 gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                    {items(6).map((i) => (
                      <Skeleton key={i} className="h-3 w-3/4" />
                    ))}
                  </div>
                  {items(6).map((i) => (
                    <div
                      key={i}
                      className="grid grid-cols-6 items-center gap-4 border-b border-slate-100 pb-3 dark:border-slate-800"
                    >
                      <Skeleton className="h-8 w-8 rounded-full" />
                      {items(5).map((j) => (
                        <Skeleton
                          key={j}
                          className={cn('h-4', j === 3 ? 'w-16 rounded-full' : 'w-3/4')}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-between gap-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-8 w-36 rounded-xl" />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Never unmounts loaded content/forms just because a background refresh starts. */
export function AdminDataBoundary({
  loading,
  label,
  variant = 'table',
  children,
  showHeader = true,
  preserveContent = true,
  className,
}: {
  loading: boolean;
  label: string;
  variant?: AdminSkeletonVariant;
  children: ReactNode;
  showHeader?: boolean;
  preserveContent?: boolean;
  className?: string;
}) {
  const completed = useRef(!loading);
  useEffect(() => {
    if (!loading) completed.current = true;
  }, [loading]);
  if (loading && (!completed.current || !preserveContent))
    return <AdminPageSkeleton label={label} variant={variant} showHeader={showHeader} />;
  return (
    <div aria-busy={loading || undefined} className={cn('min-w-0', className)}>
      {loading && (
        <div role="status" aria-label={label} className="px-4 py-2">
          <span className="sr-only">{label}</span>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
      )}
      {children}
    </div>
  );
}

export function adminSkeletonVariant(path: string): AdminSkeletonVariant {
  if (/\/(settings)(\/|$)/.test(path)) return 'form';
  if (/\/(subscription-plans|staff|admins)(\/|$)/.test(path)) return 'cards';
  if (/\/(test-questions|topic-manage|support)(\/|$)/.test(path)) return 'detail';
  if (/\/tests\/[^/]+\/questions(?:\/|$)/.test(path)) return 'detail';
  if (
    path === '/admin' ||
    path === '/admin/' ||
    /\/(analytics|performance|revenue-analytics|payments|district-rankings|item-analysis)(\/|$)/.test(
      path
    )
  )
    return 'dashboard';
  return 'table';
}
export function AdminRouteSkeleton() {
  const { pathname } = useLocation();
  return <AdminPageSkeleton variant={adminSkeletonVariant(pathname)} label="Loading admin page…" />;
}

/** Public/student routes retain their existing fallback; only admin uses Skeletons. */
export function AppRouteLoadingFallback() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return <AdminRouteSkeleton />;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"
        aria-label="Loading page"
      />
    </div>
  );
}

/** JSX helper keeps existing page markup untouched; loading behavior lives in a component. */
export function withAdminSkeleton(
  loading: boolean,
  content: ReactNode,
  options: { label: string; variant?: AdminSkeletonVariant }
) {
  return (
    <AdminDataBoundary loading={loading} {...options}>
      {content}
    </AdminDataBoundary>
  );
}
