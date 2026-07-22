'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      // Check if user is pending (new signup awaiting admin approval)
      const userStatus = res.headers.get('X-User-Status');
      if (userStatus === 'pending') {
        router.push('/waiting-approval');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    setResending(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/resend', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResendCooldown(60);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch {
      setError('Network error');
    }
    setResending(false);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Verify Your Identity</CardTitle>
          <CardDescription className="text-slate-400">
            Enter the 6-digit code sent to {email || 'your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code" className="text-slate-300">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                required
                className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {resending
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OtpVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <OtpForm />
    </Suspense>
  );
}
