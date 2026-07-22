'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Anchor, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface TeamRole {
  id: string;
  name: string;
}

function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey || siteKey === 'placeholder') return null;

  return (
    <div className="flex justify-center">
      <div ref={containerRef} id="cf-turnstile-signup" />
      <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        onLoad={() => {
          const w = window as unknown as { turnstile?: { render: (sel: string, opts: Record<string, unknown>) => void } };
          if (typeof window !== 'undefined' && w.turnstile) {
            w.turnstile.render('#cf-turnstile-signup', {
              sitekey: siteKey,
              callback: onVerify,
            });
          }
        }}
      />
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roles, setRoles] = useState<TeamRole[]>([]);

  useEffect(() => { document.title = 'Sign Up | Straw Hats Robotics'; }, []);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/team-roles')
      .then(r => r.json())
      .then(d => setRoles(d.roles || []))
      .catch(() => {});
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (siteKey && siteKey !== 'placeholder' && !turnstileToken) {
      setError('Please complete the CAPTCHA verification.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          roleName: roleName || 'Member',
          inviteCode: inviteCode.trim(),
          turnstileToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      if (data.step === 'otp_required') {
        const params = new URLSearchParams({ email: email.trim() });
        if (data.devOtpCode) params.set('devCode', data.devOtpCode);
        router.push(`/otp-verify?${params.toString()}`);
        return;
      }

      setError('Something went wrong. Please try again.');
      setLoading(false);
    } catch {
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Request to Join</h1>
            <p className="text-slate-400 mt-2">
              Join Straw Hats Robotics — you&apos;ll need an invite code from an admin
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-slate-300 text-sm font-medium">Invite Code</Label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. SH-2026-001"
                required
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
              />
              <p className="text-xs text-slate-500">Ask a team admin for your invite code</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300 text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleName" className="text-slate-300 text-sm font-medium">Team Role</Label>
              <select
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              >
                <option value="" disabled>Select your role...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">Choose the role that best fits your skills</p>
            </div>

            <TurnstileWidget onVerify={setTurnstileToken} />

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 rounded-xl font-medium transition-all duration-300"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
