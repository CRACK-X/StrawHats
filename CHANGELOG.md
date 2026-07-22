# Changelog

All notable changes to the Straw Hats Robotics website are documented here.

---

## v0.2.0 — Performance Optimization & Bug Fixes (July 2026)

### Critical Fixes

#### Session Cookie Fix (Root cause of dashboard/admin infinite spinner)
- **File:** `src/app/api/auth/otp/verify/route.ts`
- **Problem:** After OTP verification, session cookies were copied to the response with `httpOnly: true`. The browser client (`@supabase/ssr` `createBrowserClient`) reads session cookies via `document.cookie`, which **cannot** access httpOnly cookies due to fundamental browser security. This caused `supabase.auth.getUser()` to return `null` on the client, triggering an infinite redirect loop: dashboard → login → middleware (server CAN read httpOnly cookies, sees valid session) → dashboard → ...
- **Fix:** Changed `httpOnly: true` to `httpOnly: false` in the cookie copying loop (lines 109-116). Security is maintained by `secure` + `sameSite: 'lax'` + `path: '/'`.
- **Technical Detail:** `@supabase/ssr` v0.12.3's `createBrowserClient` uses a `BrowserCookieClient` that reads/writes via `document.cookie`. The server's `createServerClient` uses Next.js `cookies()` API which can read httpOnly cookies. This asymmetry is by design — the server client is for API routes/middleware, the browser client is for client-side auth checks.

#### Non-existent DB columns in admin dashboard endpoint
- **File:** `src/app/api/admin/dashboard/route.ts`
- **Problem:** The combined admin dashboard endpoint queried `email_verified` and `password_set` columns from the `signup_requests` table. These columns don't exist — migration 009 only adds `user_id` to `signup_requests` and `email_verified` to `profiles` (a different table). `password_set` doesn't exist in any migration.
- **Fix:** Removed `email_verified` and `password_set` from the `.select()` clause.
- **Impact:** This was silently causing the Supabase query to return an error (400 Bad Request from PostgREST), resulting in `signupRequests` always being `[]`.

#### Missing `/waiting-approval` in middleware PUBLIC_PATHS
- **File:** `src/lib/supabase/middleware.ts`
- **Problem:** After OTP verification for pending (unapproved) users, the frontend redirects to `/waiting-approval`. But the middleware didn't include this path in `PUBLIC_PATHS`, so it would try to check for a Supabase session. Since pending users have no session (the OTP verify route explicitly skips session creation for them), the middleware would redirect them back to `/login`, creating a redirect loop.
- **Fix:** Added `/waiting-approval` to the `PUBLIC_PATHS` array.

### Performance Optimizations

#### Combined `/api/admin/dashboard` endpoint
- **File:** `src/app/api/admin/dashboard/route.ts` (new)
- **Problem:** The admin panel fired 12 parallel API calls on mount (`/api/me/role`, `/api/admin/users`, `/api/attendance`, `/api/admin/data`, `/api/admin/contact`, `/api/admin/competitions`, `/api/admin/events`, `/api/admin/announcements`, `/api/admin/documents`, `/api/skills`, `/api/admin/signup-requests`, `/api/admin/team-roles`). Each had its own auth check (12 redundant `getUser()` + role checks), used `select('*')`, and some had bugs.
- **Fix:** Created a single `/api/admin/dashboard` GET endpoint that runs all 11 data queries in parallel with a single auth check. Uses specific column selection instead of `select('*')`.
- **Impact:** Reduces 12 HTTP requests + 12 auth checks to 1 request + 1 auth check. The admin page now loads with a single fetch.

#### Admin page rewrite
- **File:** `src/app/admin/page.tsx`
- **Changes:**
  - Replaced 12 `fetch()` calls with single `fetch('/api/admin/dashboard')`
  - Added proper error handling (403 redirects to `/dashboard`, other errors logged)
  - Removed redundant `profile` state (no longer needed for auth check)
  - Removed duplicate data loading (`/api/admin/data` was overlapping with `/api/admin/users`)

#### Competitions GET handler
- **File:** `src/app/api/admin/competitions/route.ts`
- **Problem:** The competitions API only had a `POST` handler — no `GET`. Any component trying to fetch competitions would get a 405 Method Not Allowed.
- **Fix:** Added a `GET` handler with admin auth verification and specific column selection.

#### Column selection optimization across all admin API routes
- **Files:** `src/app/api/admin/users/route.ts`, `events/route.ts`, `announcements/route.ts`, `documents/route.ts`, `contact/route.ts`, `logs/route.ts`, `signup-requests/route.ts`, `src/app/api/attendance/route.ts`, `src/app/api/skills/route.ts`
- **Change:** Replaced all `select('*')` with explicit column lists matching the TypeScript interfaces. Reduces data transfer and prevents accidental exposure of internal columns.

#### `listUsers()` → `getUserByEmail()` in signup approve
- **File:** `src/app/api/admin/signup-requests/route.ts`
- **Problem:** The signup approve/reject flow called `admin.auth.admin.listUsers()` (fetches ALL auth users) then filtered by email with `.find()`. This is O(n) and wastes bandwidth.
- **Fix:** Replaced with `admin.auth.admin.getUserByEmail(email)` — a direct O(1) lookup.

#### Loading skeletons
- **Files:** `src/app/admin/loading.tsx`, `src/app/dashboard/loading.tsx`
- **Addition:** Created `loading.tsx` files for admin and dashboard routes. Next.js App Router shows these during page compilation, providing instant feedback instead of a blank white screen.

#### Performance indexes migration
- **File:** `supabase/migrations/011_performance_indexes.sql`
- **Addition:** Database indexes for common query patterns:
  - `attendance(attended_on DESC)` — today's attendance lookups
  - `attendance(user_id, attended_on)` — user attendance history
  - `profiles(member_id)` — member ID lookups
  - `profiles(role, pending)` — admin dashboard role filtering
  - `audit_log(created_at DESC)`, `audit_log(action)`, `audit_log(admin_id)` — audit log queries
  - `member_ids(code)` — invite code validation
  - `signup_requests(status)`, `signup_requests(email)` — signup request lookups
  - `contact_requests(status)`, `contact_requests(user_id)` — contact form queries
  - `login_otps(expires_at)`, `password_resets(expires_at)` — expired token cleanup

### Console Warning Suppression

#### THREE.Clock deprecation warning
- **File:** `src/components/SuppressWarnings.tsx` (new), `src/app/layout.tsx`
- **Problem:** `@react-three/fiber` v9.6.1 internally uses `state.clock` (a `THREE.Clock`) in its render loop. Three.js r183 deprecated `Clock` in favor of `Timer`. This produces a console warning: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` We cannot fix this — it's inside R3F's own code.
- **Fix:** Created a `SuppressWarnings` client component that patches `console.warn` and `console.error` in development mode to filter out known harmless messages (THREE.Clock deprecation, WebGL Context Lost).

#### WebGL Context Lost message
- **File:** Same as above (`src/components/SuppressWarnings.tsx`)
- **Problem:** When navigating away from the home page, the R3F `<Canvas>` unmounts. Three.js calls `forceContextLoss()` for garbage collection. This is **expected behavior** per the R3F creator (drcmda): *"this is a feature in threejs that helps with garbage collection, it should be called if the canvas gets unmounted."*
- **Fix:** Suppressed the `THREE.WebGLRenderer: Context Lost` console.error in development. This message is cosmetic and does not indicate a problem.

---

## v0.1.0 — Initial Build (July 2026)

### Core Features

#### Authentication System
- Two-phase login: password verification → OTP email verification
- Password reset flow with token hashing (SHA-256)
- Admin-approval signup flow: user sets password at signup → email verification via OTP → "waiting for approval" page → admin approves → user can login
- `otp_pending_session` signed cookie for temporary session during OTP flow
- Dev fallback: OTP codes logged to terminal when Resend email fails

#### Database Schema (Migrations 001–009)
- **001**: `profiles`, `attendance`, `audit_log` tables with RLS
- **002**: `member_ids` table for invite codes
- **003**: Fix recursive RLS with admin helper function
- **004**: Add `bio` column to profiles
- **005**: Security hardening — `login_otps`, `password_resets` tables
- **006**: Feature tables — `contact_requests`, `competitions`, `events`, `announcements`, `skills`, `documents`
- **007**: Admin approval flow — `team_roles`, `signup_requests` tables
- **008**: Fix trigger and unique constraint on `qr_token_hash`
- **009**: New signup flow — `user_id` on `signup_requests`, `email_verified` on profiles

#### Admin Panel
- 12-tab sidebar: Overview, Signups, Users, Attendance, Invite Codes, Messages, Events, Competitions, Announcements, Documents, Skills, Audit Logs
- User management (approve, toggle admin, update profile)
- Signup request management (approve/reject with email notifications)
- Invite code generation
- Contact form message management
- Event, competition, announcement, document, and skill CRUD
- Audit log viewer with pagination

#### Member Dashboard
- 8-tab sidebar: Overview, Events, Competitions, Announcements, Team, Skills, Documents, Contact
- QR code generation and regeneration for attendance
- Attendance history
- Skills catalog
- Document library

#### QR Code Attendance System
- Unique QR token per user (HMAC-signed, SHA-256 hashed)
- Admin scanner endpoint with rate limiting
- Idempotent attendance recording (upsert on `user_id,attended_on`)

#### Public Pages
- Home page with 3D interactive robot (React Three Fiber + Drei)
- About, Contact, Privacy, Terms pages
- Responsive design with Tailwind CSS

### Technical Stack
- **Framework:** Next.js 15.5.20 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui (custom implementations)
- **3D:** React Three Fiber v9.6.1, Drei v10.7.7, Three.js v0.185.1
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Auth:** `@supabase/ssr` v0.12.3 (cookie-based)
- **Email:** Resend v6.18.0
- **Validation:** Zod v4.4.3
- **Testing:** Vitest v4.1.10 (33 tests)
- **Deployment:** Cloudflare Pages via `@opennextjs/cloudflare` v1.20.1

### Security
- All API routes use `createAdminClient()` (service role key, bypasses RLS) for data queries
- `createClient()` (anon key, cookie-based) used only for auth verification
- Rate limiting on login (10/min), OTP verify (5/min), OTP resend (1/min)
- SHA-256 hashed OTP tokens stored in database
- HMAC-signed QR tokens
- CSP headers configured in `next.config.ts`
- Middleware excludes `api/` routes (API routes handle their own auth)

### Test Accounts
- `admin@strawhats.test` / `TestPass123!` (admin)
- `threat106@gmail.com` / `TestPass123!` (member, TM-206)
- `theat106@gmail.com` / `TestPass123!` (member, TM-106)

### Email Configuration
- Provider: Resend (free tier)
- From: `onboarding@resend.dev`
- Free tier limitation: only delivers to `minothepro102030@gmail.com`
- Dev fallback: OTP codes, reset URLs logged to terminal
