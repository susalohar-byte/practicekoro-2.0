import { Skeleton } from '@/components/ui/skeleton';

export function StudentLoading({ label = 'Loading your data' }: { label?: string }) {
  return (
    <section role="status" aria-live="polite" aria-busy="true" className="space-y-4 py-4">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
        >
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </section>
  );
}
export function StudentLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-200"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 min-h-11 px-4 rounded-lg border border-current font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Retry
      </button>
    </div>
  );
}
