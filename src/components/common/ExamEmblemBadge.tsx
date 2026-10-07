import React from 'react';
import { Shield, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// WBP Golden Crest Police Shield Badge SVG (Pixel-perfect recreation matching screenshot)
export const PoliceShieldBadge: React.FC<{ className?: string }> = ({ className = 'w-9 h-10' }) => (
  <div
    className={cn(
      'relative flex items-center justify-center shrink-0 drop-shadow-xs select-none',
      className
    )}
  >
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M20 2C20 2 35 4.5 37 10C39 18 37 34 20 46C3 34 1 18 3 10C5 4.5 20 2 20 2Z"
        fill="#7F1D1D"
        stroke="#F59E0B"
        strokeWidth="2.5"
      />
      <path
        d="M20 6C20 6 32 8.5 33.5 13C35 19 33.5 32 20 42C6.5 32 5 19 6.5 13C8 8.5 20 6 20 6Z"
        fill="#5A0B0B"
        stroke="#FCD34D"
        strokeWidth="1"
      />
      <path
        d="M20 13L21.8 17.5L26.5 18L22.8 21.2L24 25.8L20 23.2L16 25.8L17.2 21.2L13.5 18L18.2 17.5L20 13Z"
        fill="#FCD34D"
      />
      <text
        x="20"
        y="36"
        textAnchor="middle"
        fontSize="8"
        fontWeight="900"
        fill="#FCD34D"
        letterSpacing="0.8"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        POLICE
      </text>
    </svg>
  </div>
);

// High-fidelity exam emblem generator matching reference screenshot
export const ExamEmblemBadge: React.FC<{
  title?: string;
  slug?: string;
  iconName?: string;
  className?: string;
}> = ({ title = '', slug = '', iconName, className = 'w-8 h-8' }) => {
  // 1. If custom uploaded logo or URL is set, ALWAYS display it
  if (
    iconName &&
    (iconName.startsWith('data:') ||
      iconName.startsWith('/') ||
      iconName.startsWith('http') ||
      iconName.startsWith('blob:'))
  ) {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src={iconName}
          alt={title || 'Exam Logo'}
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const norm = (title + ' ' + slug + ' ' + (iconName || '')).toLowerCase();

  // 1. WBP Constable -> Police Golden Shield
  if (norm.includes('wbp') || norm.includes('west bengal police')) {
    return <PoliceShieldBadge className={className} />;
  }

  // 2. SSC MTS / SSC GD -> Red circular SSC logo
  if (norm.includes('ssc')) {
    return (
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br from-amber-700 to-rose-900 border border-amber-400 p-0.5 flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <circle cx="16" cy="16" r="14" fill="#8B1818" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="10" fill="#6A0C0C" stroke="#FCD34D" strokeWidth="1" />
          <path
            d="M16 8L18 13L23 13.5L19 17L20.5 22L16 19.5L11.5 22L13 17L9 13.5L14 13L16 8Z"
            fill="#FCD34D"
          />
        </svg>
      </div>
    );
  }

  // 3. Railway Group D -> Red circular Indian Railways cogwheel emblem
  if (norm.includes('railway') || norm.includes('rrb')) {
    return (
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br from-red-600 to-rose-950 border border-amber-400 p-0.5 flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <circle cx="16" cy="16" r="14" fill="#991B1B" stroke="#FCD34D" strokeWidth="1.5" />
          {/* Wheel spokes & train silhouette */}
          <circle cx="16" cy="16" r="8" fill="#7F1D1D" stroke="#FEF08A" strokeWidth="1" />
          <rect x="12" y="12" width="8" height="8" rx="1.5" fill="#FEF08A" />
          <circle cx="14" cy="17" r="1.2" fill="#7F1D1D" />
          <circle cx="18" cy="17" r="1.2" fill="#7F1D1D" />
        </svg>
      </div>
    );
  }

  // 4. WBPSC Clerkship -> Golden medal / seal
  if (norm.includes('wbpsc') || norm.includes('clerkship')) {
    return (
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-600 p-0.5 flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <circle cx="16" cy="16" r="14" fill="#D97706" stroke="#FEF3C7" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="10" fill="#B45309" stroke="#FDE68A" strokeWidth="1" />
          <path
            d="M16 9L18 13.5L23 14L19.2 17.5L20.5 22.5L16 20L11.5 22.5L12.8 17.5L9 14L14 13.5L16 9Z"
            fill="#FEF3C7"
          />
        </svg>
      </div>
    );
  }

  // 5. ICDS Supervisor -> Red floral / sunburst emblem
  if (norm.includes('icds')) {
    return (
      <div
        className={cn(
          'relative rounded-full bg-rose-600 border border-rose-300 p-0.5 flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <circle cx="16" cy="16" r="13" fill="#BE123C" stroke="#FECDD3" strokeWidth="1.5" />
          {/* Floral petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <circle
              key={i}
              cx={16 + 7 * Math.cos((angle * Math.PI) / 180)}
              cy={16 + 7 * Math.sin((angle * Math.PI) / 180)}
              r="2.5"
              fill="#FFE4E6"
            />
          ))}
          <circle cx="16" cy="16" r="4.5" fill="#FFF1F2" />
        </svg>
      </div>
    );
  }

  // 6. Food SI -> Blue & Red circular seal
  if (norm.includes('food')) {
    return (
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br from-blue-900 to-indigo-950 border border-amber-400 p-0.5 flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <circle cx="16" cy="16" r="13.5" fill="#1E3A8A" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="9" fill="#172554" stroke="#FDE68A" strokeWidth="1" />
          <path
            d="M16 10V22M13 13L16 10L19 13M12 18L16 14L20 18"
            stroke="#FCD34D"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // 7. Kolkata Police -> Blue eight-pointed star crest badge
  if (norm.includes('kolkata')) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 drop-shadow-xs',
          className
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          {/* 8-pointed star */}
          <path
            d="M16 2L19.5 8.5L26.5 6L24.5 13L30 16L24.5 19L26.5 26L19.5 23.5L16 30L12.5 23.5L5.5 26L7.5 19L2 16L7.5 13L5.5 6L12.5 8.5L16 2Z"
            fill="#1E3A8A"
            stroke="#93C5FD"
            strokeWidth="1.2"
          />
          <circle cx="16" cy="16" r="7" fill="#172554" stroke="#BFDBFE" strokeWidth="1" />
          <circle cx="16" cy="16" r="3.5" fill="#60A5FA" />
        </svg>
      </div>
    );
  }

  // 8. Primary TET / TET -> Teaching emblem
  if (norm.includes('tet') || norm.includes('primary')) {
    return (
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br from-pink-600 to-rose-900 border border-pink-300 p-0.5 flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <circle cx="16" cy="16" r="14" fill="#9D174D" stroke="#F472B6" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="10" fill="#831843" stroke="#FBCFE8" strokeWidth="1" />
          <path
            d="M16 9L23 13L16 17L9 13L16 9Z"
            fill="#FBCFE8"
          />
          <path
            d="M11 15.5V19.5C11 21.5 13.5 23 16 23C18.5 23 21 21.5 21 19.5V15.5"
            stroke="#FBCFE8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 9. WBSSC Group C & D -> Green rounded square with open book
  if (norm.includes('wbssc')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <BookOpen className="w-4 h-4 text-emerald-100" />
      </div>
    );
  }

  // 10. General Knowledge -> Blue rounded square with open book
  if (norm.includes('knowledge') || norm.includes('general')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#026BFC] text-white flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <BookOpen className="w-4 h-4 text-blue-100" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs',
        className
      )}
    >
      <Shield className="w-4 h-4 text-white" />
    </div>
  );
};
