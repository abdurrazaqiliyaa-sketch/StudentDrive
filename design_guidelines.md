# StudentDrive Design Guidelines

## Design Approach
**Hybrid System**: Drawing from Material Design's information density patterns and Linear's clean typography, with Notion-inspired card layouts and Duolingo's achievement aesthetics for student engagement. Focus on clarity, role differentiation, and professional credibility while maintaining approachability for students.

## Core Design Principles
1. **Role Clarity**: Each user type (Student, Instructor, Institution, Admin) has distinct visual identity through color coding and dashboard layouts
2. **Information Hierarchy**: Dense data presented through organized cards, clear typography, and strategic whitespace
3. **Academic Credibility**: Professional, trustworthy aesthetic that respects institutional partnerships
4. **Student Engagement**: Gamification elements (badges, progress bars) balanced with serious learning tools

## Color Palette

**Primary Brand Colors:**
- Deep Academic Blue: 220 85% 35% (trust, professionalism, primary actions)
- Vibrant Learning Teal: 185 75% 45% (secondary actions, student achievements)

**Role Identifier Colors:**
- Student Dashboard: 260 60% 55% (purple undertones)
- Instructor Panel: 15 75% 55% (warm orange)
- Institution View: 145 55% 45% (forest green)
- Admin Control: 355 65% 50% (commanding red)

**Neutral Foundation:**
- Dark Mode Background: 220 20% 10%
- Card Background Dark: 220 18% 15%
- Light Mode Background: 220 15% 98%
- Card Background Light: 0 0% 100%
- Text Primary Dark: 220 10% 95%
- Text Secondary Dark: 220 8% 70%
- Text Primary Light: 220 20% 15%
- Text Secondary Light: 220 10% 45%

**Accent & Feedback:**
- Success Green: 145 70% 45%
- Warning Amber: 35 90% 55%
- Error Red: 0 75% 55%
- Achievement Gold: 45 85% 60% (badges, milestones)

## Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts) - body text, UI elements
- Accent: 'Poppins' (Google Fonts) - headings, dashboard titles

**Type Scale:**
- Hero Headings: 3.5rem (56px), font-weight 700, Poppins
- Section Headings: 2rem (32px), font-weight 600, Poppins
- Card Titles: 1.25rem (20px), font-weight 600, Inter
- Body Text: 1rem (16px), font-weight 400, Inter
- Small Labels: 0.875rem (14px), font-weight 500, Inter
- Micro Text: 0.75rem (12px), font-weight 400, Inter

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-20
- Card gaps: gap-4 to gap-6
- Grid spacing: grid with gap-6 or gap-8

**Container Strategy:**
- Full dashboards: max-w-7xl mx-auto
- Content cards: w-full with internal max-width
- Forms: max-w-2xl
- Modals: max-w-xl to max-w-3xl depending on content

## Component Library

**Navigation:**
- Top navbar with role-specific branding and user profile dropdown
- Side navigation for dashboards (collapsible on mobile)
- Breadcrumb trails for deep navigation paths
- Tab interfaces for switching between related views (Materials/Quizzes/Analytics)

**Dashboard Cards:**
- Elevated cards with subtle shadows
- Icon + title + metric/action pattern
- Quick stat cards (3-4 columns on desktop, stack on mobile)
- Recent activity feeds with avatar + timestamp

**Data Display:**
- Performance charts using clean line graphs and bar charts (Chart.js or similar)
- Progress bars with percentage labels
- Table views with sortable columns and row actions
- Badge components for achievements (rounded, colorful, with icons)

**Forms & Inputs:**
- Clean input fields with floating labels
- File upload areas with drag-and-drop zones
- Multi-select dropdowns for course/topic filtering
- Rich text editor for instructor content creation
- Quiz builder with question type toggles

**Interactive Elements:**
- Primary buttons: Solid fills with brand colors
- Secondary buttons: Outline style
- Tertiary: Text-only links
- Icon buttons for quick actions
- Toggle switches for settings
- Radio buttons and checkboxes for quiz questions

**Content Cards:**
- Resource cards: Thumbnail + title + metadata (course, date, instructor)
- Quiz cards: Title + question count + completion status + start button
- Achievement badges: Icon + title + earned date
- Leaderboard entries: Rank + avatar + name + score

**Overlays:**
- Modal dialogs for forms and confirmations (centered, backdrop blur)
- Slide-out panels for detailed views (quiz review, resource preview)
- Toast notifications for success/error feedback (top-right corner)
- Dropdown menus for user actions and filters

## Images

**Hero Section Image:**
Yes - feature a vibrant, modern image of diverse students collaborating with laptops/tablets in a contemporary learning space. Position as full-width background with gradient overlay (deep blue to transparent) for text legibility.

**Dashboard Illustrations:**
- Empty state illustrations for when students haven't started quizzes yet (motivational, friendly style)
- Institution branding logos in institution dashboard header
- Instructor profile photos (circular avatars, 40px-48px diameter)

**Icon System:**
Use Heroicons throughout for consistency:
- Academic icons: book-open, academic-cap, clipboard-document-check
- Action icons: plus, pencil, trash, arrow-right
- Status icons: check-circle, x-circle, clock, star
- Navigation icons: home, chart-bar, document-text, users

**Content Thumbnails:**
- PDF previews: First page thumbnail or generic document icon
- Video materials: Placeholder thumbnail with play icon overlay
- Course icons: Subject-specific icons (science beaker, math symbols, literature book)

## Page-Specific Layouts

**Landing Page:**
Hero with image background, 5-7 sections including features grid (3 columns), role-based benefits, social proof (institutional partners logos), quiz demo preview, CTA section

**Student Dashboard:**
Welcome header with progress summary, 3-column quick stats, recent materials feed, upcoming quizzes list, achievement showcase

**Quiz Interface:**
Clean, distraction-free layout with question counter, timer (if timed), question display, answer options, navigation buttons (previous/next/submit)

**Resource Library:**
Filter sidebar (left), grid of resource cards (3-4 columns), pagination or infinite scroll

**Analytics Views:**
Charts section at top, detailed metrics table below, export/download options, date range selector

**Admin Panel:**
Multi-tab interface, data tables with search/filter, user management modals, system-wide statistics dashboard

## Animations
Use sparingly: Card hover lift effects (2-3px translateY), smooth page transitions, progress bar fills, toast notification slide-ins. Avoid page scroll effects.