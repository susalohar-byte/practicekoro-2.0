import { useState } from 'react';
import { usePlatformBrand } from '@/context/MaintenanceContext';
/** Saved platform identity with a deployed fallback; no DOM mutation or hidden stale image. */
export function BrandLogo({
  fallback = '/images/logo.png',
  className = '',
}: {
  fallback?: string;
  className?: string;
}) {
  const { appName, logoUrl } = usePlatformBrand();
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const src = logoUrl && !failed[logoUrl] ? logoUrl : fallback;
  if (failed[src])
    return (
      <span role="img" aria-label={appName} className={className}>
        {appName.slice(0, 1)}
      </span>
    );
  return (
    <img
      src={src}
      alt={appName}
      className={className}
      onError={() => setFailed((previous) => ({ ...previous, [src]: true }))}
    />
  );
}
