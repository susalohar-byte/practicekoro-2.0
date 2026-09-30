# Design System: PracticeKoro 2.0 (GenZ & Millennial Student Experience)
**Project Title:** PracticeKoro 2.0 — Student Web & Mobile App Redesign  
**Stitch Project ID:** `4983539102963426333`  
**Target Audience:** GenZ & Millennial Competitive Exam Aspirants (WBP, Kolkata Police, WBCS, WBPSC, Railway, SSC)  
**Form Factors:**
- **Website / Desktop (`src/`):** Responsive `1280px–1440px+` Bento-grid workspace with sleek collapsible left sidebar + glassmorphic top navbar
- **Mobile Web & Native Flutter App (`practicekoro_mobile/`):** `375px–430px` tactile mobile experience with floating/frosted bottom navigation bar

---

## 1. Visual Theme, Brand Icon & GenZ/Millennial Vibe
- **Brand Icon Inspiration (`public/logo-icon.png`):**
  - The official PracticeKoro app icon features a rounded squircle with a vibrant **Electric Sky-to-Royal Blue gradient (`#0198FD` → `#0158FC` → `#003CB3`)**, an upward-Checkmark/Ribbon of mastery, an open book silhouette, and a crisp white **"P"** monogram.
  - Every student screen channels this exact energy: **high-clarity, zero-clutter, gamified momentum, and instant visual comprehension**.
- **GenZ & Millennial Aesthetic Principles:**
  - **Bento-Grid Modularity:** Clean, scannable `rounded-2xl` (`16px`) and `rounded-3xl` (`24px`) cards with subtle `1px` borders (`#E2E8F0` light / `rgba(255,255,255,0.08)` dark) and soft ambient blue-tinted elevation (`0 10px 30px -10px rgba(1, 88, 252, 0.08)`).
  - **Electric Micro-Gradients & Glassmorphism:** Translucent sticky headers (`backdrop-blur-xl bg-white/85`), glowing live status pills, and tactile pill filters that feel responsive and modern like Duolingo, Linear, and Notion.
  - **Scannable Hierarchy:** Zero walls of text. Every card uses a clear **Badge + Bold Metric/Title + Visual Progress Bar + 1-Click Action Pill** pattern.
  - **100% Real Database Sync:** Every number, streak, test series, subject accuracy bar, mistake item, and profile setting maps directly to the live Supabase schema (`tests`, `test_series`, `user_attempts`, `questions`, `student_mistake_Adaptation`, `student_question_bookmarks`, `profiles`, `support_tickets`) with zero fake/invented metrics.

---

## 2. Color Palette & Tokens
- **App Icon Electric Blue (Primary):** `#0158FC` (`from-[#0158FC] to-[#0198FD]`) — Primary CTAs, active navigation pills, progress indicators, brand accents.
- **App Icon Sky Glow (Secondary Accent):** `#0198FD` / `#38BDF8` — Gradient highlights, interactive hover borders, secondary badges.
- **Deep Authority Navy (Hero & Dark Surface):** `#0B1F44` → `#063585` — Hero banners, Live Test spotlights, Profile header card, dark-mode surfaces.
- **Canvas Background:** `#F6F9FF` / `#F8FAFC` (Cool Alabaster Slate) — Reduces eye strain during long mock tests and practice drills while making pure `#FFFFFF` cards pop.
- **Pro Pass Gold / Streak Amber:** `#F59E0B` → `#EA580C` — Active day streaks, Pro Pass badges, PYQ tags, leaderboard podiums.
- **Semantic Validation Colors:**
  - **Correct / Mastery (Emerald):** `#10B981` (text/fill), `#ECFDF5` (wash), `#A7F3D0` (border)
  - **Incorrect / Mistake (Rose):** `#EF4444` (text/fill), `#FEF2F2` (wash), `#FECACA` (border)
  - **Unattempted / Neutral (Slate):** `#64748B` (text), `#F1F5F9` (wash), `#E2E8F0` (border)

### Subject-Specific Color Tokens
- **Mathematics:** Electric Blue (`#2563EB` / `#EFF6FF`)
- **Reasoning & GI:** Vibrant Violet/Indigo (`#7C3AED` / `#F5F3FF`)
- **General Knowledge & Awareness:** Emerald Green (`#059669` / `#ECFDF5`)
- **English:** Rose Pink (`#E11D48` / `#FFF1F2`)
- **Bengali:** Warm Amber (`#D97706` / `#FFFBEB`)
- **Computer / Science:** Cyan Sky (`#0284C7` / `#F0F9FF`)

---

## 3. Typography & Scannable Micro-Hierarchy
- **Primary Font:** `Inter`, `Plus Jakarta Sans`, system-ui, with `Noto Sans Bengali` for seamless English + বাংলা bilingual rendering.
- **Numeric Precision:** `tabular-nums` (`font-variant-numeric: tabular-nums`) on all countdown timers, scores, accuracy percentages, and ranks.
- **Pill Tags:** Uppercase `10px–11px` (`font-extrabold tracking-wider rounded-full px-3 py-1`).

---

## 4. Unified 5-Page Student Navigation Architecture
Both the **Website Sidebar (`StudentSidebar.tsx`)**, **Mobile Web Bottom Bar (`BottomNav.tsx`)**, and **Flutter App Scaffold (`main_scaffold.dart`)** feature the **5 core student destinations in exact order**:

1. **Home** (`/dashboard`) — Daily command center, live test spotlight, 4 real-time stat pills, resume in-progress test, featured test series, subject quick-launch, accuracy & rank snapshot.
2. **Test Series** (`/test-series`) — Full exam series catalog with instant search, category & Free/Pro filter pills, 4 test-format bento shortcuts, and rich series cards with progress & test counts.
3. **Practice** (`/practice`) — Smart question bank hub with 5 practice modes (Subject, Topic, PYQ, Saved, Mistakes), interactive subject/topic mastery cards, 2x2 activity bento, and custom drill launchers.
4. **Results** (`/results`) — Performance & analytics hub with 5 KPI summary cards, filterable test attempt history (View Result, Solutions, Re-attempt), accuracy donut chart, and subject breakdown bars.
5. **Profile** (`/profile`) — Student identity & exam target hub with App Icon navy/blue hero card, 5 achievement stats, tabbed settings (Overview, Exam Target, Preferences, Subscription, Achievements, Activity, Security), and Direct Support Desk.

---

## 5. Stitch Screen References (`.stitch/designs/`)
- **Home (`7fa01279bcc04f0187bf5a29eb18834b` & Desktop Bento):** `.stitch/designs/home.html`
- **Test Series (`8cd121b953b2405fb6bb8502fe7b8b3d`):** `.stitch/designs/test-series.html`
- **Practice (`2ebdb1c131434dcbaa6206e6f826bbc5`):** `.stitch/designs/practice.html`
- **Results (`7deaa1e1a1954a91bfc2aa154572f5c4`):** `.stitch/designs/results.html`
- **Profile (`f694fe065391483e844cbe029f9ef1c1`):** `.stitch/designs/profile.html`
