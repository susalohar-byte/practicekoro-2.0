# PracticeKoro Mobile App — Modern Native Mock Test Design System

## 1. Visual Direction & Atmosphere
- **Archetype:** Modern Native Mobile EdTech & Competitive Exam Preparation App (Distinct from Web Dashboard).
- **Vibe:** Tactile, high-focus, mobile-first bento aesthetic with deep indigo-violet & electric sapphire hero surfaces, crisp alabaster-slate cards, pill-shaped filter chips, radial accuracy rings, and floating capsule bottom navigation.
- **Density:** Optimized for one-handed mobile thumb ergonomics — zero horizontal table scrolling, compact vertical hierarchy, native bottom sheets, and swipeable carousels.

## 2. Color Palette & Atmospheric Tokens
| Token | Hex | Role |
| :--- | :--- | :--- |
| **Canvas Background** | `#F4F6FB` | Primary mobile app scaffold background (Cool Alabaster Slate) |
| **Elevated Surface** | `#FFFFFF` | Primary card & sheet surface |
| **Subtle Surface** | `#EEF2FF` | Tinted indigo container fill for pills, icons, and active tabs |
| **Deep Hero Midnight** | `#0F172A` -> `#1E1B4B` | Primary dark hero gradient base (Slate 900 to Deep Indigo 950) |
| **Royal Indigo Primary** | `#3142D6` / `#4F46E5` | Primary interactive brand accent, active pills, CTA buttons |
| **Electric Violet Accent** | `#6366F1` | Secondary gradient stop & progress ring highlight |
| **Emerald Mastery** | `#10B981` | High accuracy (>=75%), solved badges, positive trend indicators |
| **Amber Streak / Pro** | `#F59E0B` | Daily streak flame, Pro Pass crown, medium accuracy (50–74%) |
| **Rose Alert / Mistake** | `#F43F5E` | Mistake notebook, negative marking indicator,LIVE badge pulse |
| **Primary Ink** | `#0F172A` | Headings, scores, and primary card titles |
| **Secondary Slate** | `#475569` | Subtitles, metadata, question counts |
| **Muted Slate** | `#94A3B8` | Captions, dividers, inactive navigation icons |
| **Border Hairline** | `#E2E8F0` | 1px card borders and dividers |

## 3. Typography & Scannable Hierarchy
- **Primary Font Family:** `Inter` / `Plus Jakarta Sans` (Geometric, high x-height, crisp tabular numerals).
- **Bengali Script Pairing:** `Noto Sans Bengali` / `Hind Siliguri` for bilingual (`বাংলা + Eng`) badges and questions.
- **Scale:**
  - **Hero Metric / Score Display:** `28px–32px`, `FontWeight.w900`, tight tracking (`-0.8px`).
  - **Screen Header Title:** `20px–22px`, `FontWeight.w800`, tracking `-0.5px`.
  - **Section Header:** `16px–17px`, `FontWeight.w800`, tracking `-0.3px`.
  - **Card Title:** `14.5px–15.5px`, `FontWeight.w700`.
  - **Metadata / Pill Label:** `11px–12px`, `FontWeight.w700`.

## 4. Layout, Spatial Architecture & Native Mobile Components
1. **Floating Capsule Bottom Navigation (`MainScaffold`):**
   - Detached/elevated rounded dock with active pill indicator (`#EEF2FF` background + `#3142D6` icon & bold label) across 5 core tabs: **Home**, **Tests**, **Practice**, **Results**, **Profile**.
2. **Mobile App Bar & Goal Switcher (`HomeScreen`):**
   - Compact top bar featuring user avatar badge, interactive **Target Exam Switcher Chip** (`WBP Constable`, `WBPSC Clerkship`, `Primary TET`, etc. via native bottom sheet), live streak pill, and search icon button.
3. **Daily Readiness & Quick Resume Hero Card (`HomeScreen`):**
   - Deep Indigo-Midnight (`#0F172A` -> `#1E1B4B` -> `#3142D6`) card with a circular **Accuracy / Readiness Gauge**, 3 glassmorphic stat pills (`Attempted`, `Best Score`, `Streak`), and a prominent **Quick Mock CTA**.
4. **Horizontal Live & Trending Mock Carousel (`HomeScreen`):**
   - Swipeable horizontal cards (`270px` width) with `LIVE` / `FREE` / `PRO` pills, bilingual tag, question/minute specs, and 1-tap `Start Test` button.
5. **2x2 Bento Practice & Exam Grid (`HomeScreen` & `PracticeScreen`):**
   - Touch-friendly 2-column bento cards for Subject Drills, PYQ Archives, Mistake Re-tester, and Saved Bookmarks (strictly no flashcards).
6. **Card-Based Mobile Results & Analytics (`ResultsHubScreen`):**
   - Replaces desktop-style multi-column tables with a **Radial Performance Summary Hero**, **2x2 KPI Bento Grid**, **Subject Mastery Progress Bars**, and **Native Mobile Attempt Cards** with score badge, accuracy pill, time taken, and 1-tap `Review Solutions` / `Leaderboard` actions.
