# Straw Hats Robotics Website

A production-grade website for the Straw Hats Robotics team — a student robotics team competing in ROV/underwater robotics competitions including MATE ROV.

## Features

- **Two-Phase Authentication**: Password + OTP email verification with admin-approval signup
- **Admin-Approval Signup Flow**: Users set password, verify email via OTP, wait for admin approval
- **QR Code Attendance**: Unique HMAC-signed QR tokens per user, admin scanner, idempotent recording
- **Admin Panel**: 12-tab sidebar — users, signups, attendance, invite codes, messages, events, competitions, announcements, documents, skills, audit logs
- **Member Dashboard**: 8-tab sidebar — overview, events, competitions, announcements, team, skills, documents, contact
- **3D Interactive Robot**: React Three Fiber + Drei with GLTF models, Particles, and lighting
- **Combined API Endpoints**: Single `/api/me` and `/api/admin/dashboard` endpoints reduce HTTP requests from 12+ to 1
- **Security Hardening**: Rate limiting, CSP headers, RLS bypass via admin client, HMAC-signed QR tokens
- **Loading Skeletons**: Instant feedback during page compilation
- **Console Warning Suppression**: THREE.Clock deprecation and WebGL Context Lost filtered in dev

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5.20 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui (custom implementations) |
| 3D | React Three Fiber v9.6.1, Drei v10.7.7, Three.js v0.185.1 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Auth | `@supabase/ssr` v0.12.3 (cookie-based) |
| Email | Resend v6.18.0 |
| Validation | Zod v4.4.3 |
| Testing | Vitest v4.1.10 (33 tests) |
| Deployment | Cloudflare Pages via `@opennextjs/cloudflare` v1.20.1 |
| QR Codes | `qrcode.react`, `html5-qrcode` |

## Quick Start

```bash
git clone <repository-url>
cd straw-hats-robotics
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
QR_SECRET=<32-byte-hex-string>
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=onboarding@resend.dev
```

Run database migrations in Supabase SQL Editor (in order):
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_member_ids.sql`
- `supabase/migrations/003_fix_recursive_rls.sql`
- `supabase/migrations/004_add_bio.sql`
- `supabase/migrations/005_security_hardening.sql`
- `supabase/migrations/006_features.sql`
- `supabase/migrations/007_signup_approval.sql`
- `supabase/migrations/008_fix_trigger_and_unique_constraint.sql`
- `supabase/migrations/009_new_signup_flow.sql`
- `supabase/migrations/011_performance_indexes.sql`

```bash
npm run dev          # Start dev server on port 3000
```

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── dashboard/route.ts   # Combined: 11 parallel queries, single auth check
│   │   ├── auth/
│   │   │   ├── login/route.ts       # Password + pending check
│   │   │   ├── signup/route.ts      # Creates auth user + profile + OTP
│   │   │   ├── otp/verify/route.ts  # Two-phase session creation
│   │   │   ├── forgot-password/route.ts
│   │   │   └── reset-password/route.ts
│   │   └── me/route.ts              # Combined: profile + attendance + announcements + events + competitions + team
│   ├── dashboard/                   # Member dashboard (client component)
│   ├── admin/                       # Admin panel (client component)
│   └── waiting-approval/            # Pending approval page
├── components/
│   ├── SuppressWarnings.tsx         # Dev console warning filter
│   ├── Robot3D.tsx                  # Three.js 3D robot
│   ├── HeroSection.tsx              # Auth-aware hero with dynamic 3D import
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── admin.ts                 # Service role client (bypasses RLS)
│   │   ├── server.ts                # Server client
│   │   ├── client.ts                # Browser client
│   │   └── middleware.ts            # PUBLIC_PATHS config
│   ├── crypto.ts                    # SHA-256, OTP gen, HMAC signing
│   ├── otp.ts                       # OTP issuance with dev fallback
│   ├── email.ts                     # Resend SDK with console.log fallback
│   ├── rate-limit.ts                # In-memory rate limiter
│   ├── validation.ts                # Zod schemas
│   └── audit.ts                     # Audit logging
├── middleware.ts                     # Excludes api/ from session checks
└── types/database.ts                # TypeScript interfaces
```

## Authentication Flow

### Login (Two-Phase)
1. User submits email + password
2. Server verifies password via temp Supabase client
3. Session tokens stored in signed `otp_pending_session` cookie
4. 6-digit OTP issued (SHA-256 hashed, 10-min expiry)
5. User enters OTP → session created → cookies forwarded to response
6. Browser client reads cookies via `document.cookie` → auth check passes

### Signup (Admin-Approval)
1. User enters name + email + password + invite code
2. Auth user created + profile (pending=true) + OTP issued
3. User verifies OTP → sees "waiting for approval" page
4. Admin approves (flips pending=false) → user can login

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@strawhats.test` | `TestPass123!` | Admin |
| `threat106@gmail.com` | `TestPass123!` | Member (TM-206) |
| `theat106@gmail.com` | `TestPass123!` | Member (TM-106) |

## Commands

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run deploy       # Build + deploy to Cloudflare
node_modules/.bin/vitest run  # Run tests
```

## Known Issues

- **Resend free tier**: Emails only deliver to `minothepro102030@gmail.com`. Dev fallback logs OTP codes to terminal.
- **Migration 009 not applied**: `user_id` on `signup_requests` and `email_verified` on `profiles` columns need manual application via Supabase Dashboard SQL Editor.
- **Migration 011 not applied**: Performance indexes need manual application.
- **THREE.Clock deprecation**: From R3F v9.6.1 internal usage — cannot be fixed upstream. Suppressed in dev via `SuppressWarnings.tsx`.

## License

Private and proprietary to Straw Hats Robotics team.
