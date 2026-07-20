# Straw Hats Robotics Website

A production-grade website for the Straw Hats Robotics team, built with Next.js 14, Supabase, and Cloudflare Pages.

## Features

- **Authentication**: Secure email/password authentication with Supabase Auth
- **QR Code Attendance System**: Generate and scan QR codes for attendance tracking
- **Admin Panel**: User management, attendance tracking, and audit logging
- **3D Interactive Robot**: Interactive 3D robot model using React Three Fiber
- **SEO Optimized**: Full SEO implementation with metadata, sitemap, and robots.txt
- **Security First**: RLS policies, CSP headers, and secure session management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **3D**: React Three Fiber, Drei
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: Cloudflare Pages (via OpenNext adapter)
- **QR Codes**: qrcode.react, html5-qrcode

## Prerequisites

- Node.js 18+ and npm
- A Supabase project (https://supabase.com)
- A Cloudflare account (https://cloudflare.com)

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd straw-hats-robotics
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Project Settings > API and copy:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (public anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key - keep secret!)

### 3. Set up the database

1. Go to the SQL Editor in Supabase Dashboard
2. Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
3. This creates the `profiles`, `attendance`, and `audit_log` tables with RLS policies

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# QR Code Secret (generate a random 32-byte string)
QR_SECRET=your_32_byte_random_secret

# Cloudflare Turnstile (optional - for CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the development server

```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

## Deployment to Cloudflare Pages

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Build and deploy

```bash
npm run deploy
```

Or manually:

```bash
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```

### 4. Configure environment variables in Cloudflare

Go to your Cloudflare Pages project > Settings > Environment variables and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QR_SECRET`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Project Structure

```
straw-hats-robotics/
├── src/
│   ├── app/
│   │   ├── about/          # About page
│   │   ├── admin/          # Admin panel
│   │   │   └── components/ # Admin components
│   │   ├── api/            # API routes
│   │   │   ├── attendance/ # Attendance API
│   │   │   ├── auth/       # Auth callbacks
│   │   │   └── qr/         # QR generation
│   │   ├── dashboard/      # User dashboard
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   ├── robots.ts       # Robots.txt
│   │   └── sitemap.ts      # Sitemap
│   ├── components/
│   │   ├── 3d/             # 3D components
│   │   └── ui/             # UI components
│   ├── lib/
│   │   ├── supabase/       # Supabase client
│   │   └── utils.ts        # Utility functions
│   ├── types/              # TypeScript types
│   └── middleware.ts       # Next.js middleware
├── supabase/
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Secure Sessions**: httpOnly, Secure, SameSite=Strict cookies
- **CSRF Protection**: Built-in Next.js CSRF protection
- **CSP Headers**: Content Security Policy headers configured
- **Rate Limiting**: Implement at Cloudflare level
- **Audit Logging**: All admin actions are logged

## QR Code System

1. Users get a unique QR code on their dashboard
2. Admin scans the QR code using the camera or manual entry
3. Server validates the token and marks attendance
4. Attendance is idempotent (scanning twice same day is a no-op)

## Admin Features

- User management (approve, make admin)
- Attendance tracking and history
- QR code scanner with camera support
- Audit log of all admin actions

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run preview      # Preview with Cloudflare adapter
npm run deploy       # Build and deploy to Cloudflare
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` to check for errors
4. Test locally with `npm run dev`
5. Submit a pull request

## License

This project is private and proprietary to Straw Hats Robotics team.

## Support

For issues or questions, contact the team lead or create an issue in the repository.
# StrawHats
