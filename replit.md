# StudentDrive - Digital Learning Platform

## Overview
StudentDrive is a comprehensive digital learning and academic performance platform designed to transform how students study, access educational materials, and measure progress. It supports four distinct user roles: Students, Instructors, Institutions, and Administrators. The platform aims to provide a seamless and engaging educational experience, from accessing verified resources to tracking personal and institutional performance. Its business vision is to become a leading platform for digital education, offering robust tools for learning, teaching, and academic administration.

## Recent Changes (October 25, 2025)
- **Landing Page Refinement - studypdf.net-inspired Updates** (Current Session): Further improvements based on user feedback
  - Added "Get Started" button to header navigation after "Sign In" for better CTA prominence
  - Changed "Sign In" button to ghost variant for improved visual hierarchy
  - Removed "Administrators" card from "Built for Every Learning Role" section (now shows only Students, Instructors, Institutions)
  - Adjusted role cards grid from 4 columns to 3 columns (lg:grid-cols-3) for better layout
  - Enhanced button spacing and padding: gap-5 (from gap-4), px-10/py-7 (from px-8/py-6)
  - Added rounded-lg to all CTA buttons for consistent corner radius
  - All improvements reviewed by architect - passed with recommendations for visual QA against studypdf reference
- **Landing Page UI Enhancement** (Current Session): Modernized landing page design with inspiration from professional education platforms
  - Enhanced hero section with larger typography (text-5xl to text-7xl), improved gradient overlays, and radial gradient accents
  - Added prominent gold/amber CTA buttons (#f59e0b) for better visual hierarchy and user engagement
  - Implemented trust badge pill ("Trusted by 10,000+ students worldwide") with Sparkles icon
  - Created comprehensive stats section showcasing platform metrics (10k+ active students, 50k+ study materials, 98% success rate)
  - Enhanced feature cards with gradient icon backgrounds, hover scale animations, and improved border transitions
  - Upgraded navigation bar with gradient logo background and improved backdrop blur effects
  - Improved role-based benefit cards with gradient icons (purple/orange/green/red) and smooth hover animations
  - Redesigned full-width CTA section with gradient background and dual CTA buttons
  - Polished footer with consistent gradient branding
  - Added section badges with icons (Zap, Users, Sparkles) for better visual categorization
  - Implemented smooth transitions on all interactive elements (shadow, scale, border color changes)
  - All changes reviewed by architect - passed with recommendations for responsive QA and contrast checks
  - Design maintains accessibility (semantic HTML, proper ARIA, responsive Tailwind breakpoints)
- **Fresh GitHub Import Setup** (Current Session): Successfully configured StudentDrive from fresh GitHub clone in Replit
  - Installed all Node.js dependencies (605 packages installed)
  - Database already provisioned with DATABASE_URL environment variable
  - Pushed database schema successfully using Drizzle Kit (all tables synced)
  - Configured "Server" workflow running on port 5000 with webview output
  - Created admin account (email: mastercraft@gmail.com, password: mastercraft80)
  - Created comprehensive .gitignore file for Node.js project
  - Frontend already properly configured with allowedHosts: true for Replit proxy (in vite.config.ts)
  - Backend already configured to serve on 0.0.0.0:5000 (in server/index.ts)
  - Configured autoscale deployment (build: npm run build, run: npm run start)
  - Application running successfully - Vite connected and API responding
  - Server running on port 5000 with Express + Vite middleware integration
- **Real Performance Analytics Implementation** (Previous Session): Replaced hardcoded data with live calculations from quiz attempts
  - Enhanced backend `/api/student/performance` endpoint with comprehensive analytics calculations
  - Weekly performance trends showing last 8 weeks of quiz scores
  - Course-based performance breakdown aggregating scores by course
  - Automatic identification of strengths (courses with >80% average score)
  - Automatic identification of weaknesses (courses with <75% average score)
  - Fixed timeSpent calculation to properly convert minutes to hours
  - Updated frontend Performance page to consume real data from API
  - Added contextual empty states for when no quiz data is available
  - Improved UX with quiz attempt counts displayed for each strength/weakness
- **Material Detail Page Enhancement with Statistics** (Previous Session): Comprehensive improvements to material viewing experience
  - Added view and download tracking to database schema with `viewCount` and `downloadCount` fields
  - Implemented automatic view tracking on page load with correct count propagation to UI
  - Created download tracking endpoint (`/api/materials/:id/download`) with real-time count updates
  - Enhanced UI with statistics display (views/downloads) using icons and proper formatting
  - Added share functionality with copy-to-clipboard feature for easy material sharing
  - Implemented full-screen preview mode for better document viewing experience
  - Added comprehensive material metadata display (file size, type, creation date, last updated)
  - Improved visual hierarchy with better badge system and action buttons (Download, Save, Share, Full Screen)
  - Enhanced material information sidebar with detailed statistics and formatted data
  - Fixed statistics tracking bug by ensuring backend returns refreshed data after mutations
  - File size formatting with automatic KB/MB conversion for better readability
  - Responsive design improvements for mobile and desktop viewing
- **Settings Page UI/UX Improvements** (Previous Session): Redesigned settings page with tabbed interface and new features
  - Implemented tabbed interface with Profile, Security, and Account tabs for better organization
  - Added password change functionality with secure backend endpoint (`/api/auth/change-password`)
  - Integrated React Hook Form with Zod validation for robust form handling
  - Password validation includes: minimum 8 characters, confirmation matching, current password verification
  - Enhanced UI with icons (User, Lock, Info, Calendar, Mail), badges for verification status, and better visual hierarchy
  - Added Security Tips section with password best practices
  - Improved Account Information display with formatted dates and detailed user data
  - All forms provide inline validation errors and toast notifications for better UX
  - Backend password change properly validates current password with bcrypt and hashes new password securely
- **Recent Materials Clickable Fix** (Previous Session): Made Recent Materials cards clickable on student dashboard
  - Wrapped material content in Link components to navigate to material detail page
  - Fixed accessibility issue by keeping bookmark button separate from link (no nested interactive elements)
  - Maintained proper HTML structure and keyboard navigation
  - Added hover effect on title for better UX feedback
- **Material Detail Page Runtime Error Fix** (Previous Session): Fixed critical JavaScript error preventing page from loading
  - Fixed "relatedMaterials?.filter is not a function" error in material-detail.tsx
  - Added custom queryFn to extract materials array from API response object
  - /api/materials returns {materials: [...], pagination: {...}, topics: [...]}, now properly handled
  - Page now loads successfully and shows related materials when available
- **Test Data Setup** (Previous Session): Fixed "Material Not Found" issue by creating test data
  - Created admin account (email: admin@studentdrive.com, password: ChangeMe123!)
  - Populated database with test institution (University of Technology)
  - Created 3 sample courses: CS101, CS201, CS301
  - Added 4 approved materials covering Python, Data Structures, SQL, and Algorithms
  - Verified material detail page works correctly - requires login to view materials
- **Fresh Replit Environment Setup** (Previous Session): Successfully configured StudentDrive from fresh GitHub import
  - Installed all Node.js dependencies (605 packages)
  - Database schema pushed successfully using Drizzle (all tables synced)
  - Created comprehensive .gitignore file for Node.js project
  - Configured "Server" workflow running on port 5000 with webview output
  - Vite already properly configured for Replit with allowedHosts: true in server/vite.ts
  - Autoscale deployment configured (build: npm run build, run: npm run start)
  - Application verified working - landing page loads correctly with StudentDrive branding
  - Server serving on port 5000 with Express + Vite middleware integration working properly

## User Preferences
I prefer iterative development with clear, concise explanations for each step. Please ask for confirmation before making significant architectural changes or adding new external dependencies. I also prefer detailed explanations for complex logic or design decisions. Do not make changes to the folder `node_modules` and the file `package-lock.json`.

## System Architecture

### UI/UX Decisions
The platform utilizes Shadcn UI (built on Radix UI primitives) for UI components, styled with Tailwind CSS for a modern and responsive design. The color palette includes "Deep Academic Blue" as primary, "Vibrant Learning Teal" as secondary, and specific colors for each role (Student: Purple, Instructor: Orange, Institution: Green, Admin: Red), along with "Achievement Gold." Typography uses Poppins for headings and Inter for body text, with a responsive font size scale. Layouts adhere to a max-width of 7xl for dashboards and a customizable sidebar width of 16rem.

### Technical Implementations
- **Frontend**: React with TypeScript, Wouter for routing, TanStack Query for state management, Recharts for data visualization, and React Hook Form with Zod for form validation.
- **Backend**: Node.js with Express, PostgreSQL (Neon) as the database, Drizzle ORM for database interactions, Passport.js with a Local Strategy for authentication, Nodemailer for email services, connect-pg-simple for session storage, and bcryptjs for password hashing.
- **Authentication**: Custom email/password authentication system with role-based onboarding (Student, Instructor, Institution). Institution registration is currently disabled.
- **Deployment**: Autoscale deployment configured with build and production start commands.

### Feature Specifications
- **Core Features**:
    - **Students**: Resource library with advanced filtering, material upload/sharing, "My Library" for material management, bookmarking, interactive quizzes, performance analytics, material viewing, rating, and reviewing.
    - **Instructors**: Material upload with metadata, quiz builder, student monitoring, analytics dashboard, material viewing, rating, and reviewing.
    - **Institutions**: Student and instructor management, custom branding, department analytics, programme management.
    - **Administrators**: Platform management, content moderation, system analytics, user management, material report management.
- **Learning Resources System**: Supports uploading materials (Lecture Notes, Textbooks, Study Guides, Past Questions) with comprehensive metadata and advanced filtering. Provides full CRUD operations with ownership verification, bookmarking, in-browser viewing (PDF, images, text), 5-star rating system, user reviews, and content reporting. File uploads have a 10MB limit and validate common document/image types.
- **Onboarding**: Multi-step, role-specific onboarding flows collecting personal, academic, and professional information. Student onboarding now includes dynamic programme selection based on institution. Gender collection is mandatory.
- **Settings**: Comprehensive settings page with tabbed interface (Profile, Security, Account) featuring profile updates, password change functionality with validation, detailed account information display, email verification status, and security best practices. Includes React Hook Form with Zod validation for robust form handling and inline error messages.

### System Design Choices
- **Database Schema**: Core tables include `users`, `institutions`, `programmes`, `courses`, `materials`, `quizzes`, `quiz_questions`, `quiz_attempts`, `bookmarks`, `material_reviews`, `material_ratings`, `material_reports`, and `sessions`. `programmeId` added to `users` table, linked to `programmes` table. Material engagement tracked through reviews, ratings, and reports tables.
- **Security**: All routes protected by middleware, role-based access control, encrypted session storage, SQL injection prevention via Drizzle ORM, HTTPS-only cookies. Sensitive data is sanitized from API responses.
- **Performance**: Optimized database queries, lazy loading for components, efficient caching with TanStack Query (including auto-refetching), and responsive assets.
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, screen reader friendliness, and high contrast ratios.

## External Dependencies
- **Database**: PostgreSQL (Neon)
- **Email Service**: Nodemailer
- **UI Framework**: Shadcn UI (built on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Charting**: Recharts
- **Form Management**: React Hook Form
- **Validation**: Zod
- **Authentication**: Passport.js
- **Session Storage**: connect-pg-simple
- **Password Hashing**: bcryptjs