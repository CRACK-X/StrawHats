'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Info } from 'lucide-react';
import Link from 'next/link';

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const initialDevCode = searchParams.get('devCode') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState(initialDevCode);

  useEffect(() => { document.title = 'Verify OTP | Straw Hats Robotics'; }, []);

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
        if (data.devOtpCode) setDevCode(data.devOtpCode);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch {
      setError('Network error');
    }
    setResending(false);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <img src="/New_LOGO.png" alt="Straw Hats Robotics" className="h-12 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Verify Your Identity</h1>
            <p className="text-slate-400 mt-2">
              Enter the 6-digit code sent to{' '}
              <span className="text-cyan-400 font-medium">{email || 'your email'}</span>
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-slate-500">
              <Info className="w-3 h-3" />
              <span>Didn&apos;t receive it? Check your spam or junk folder.</span>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {devCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
              >
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Development Mode
                </p>
                <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                  <span className="text-2xl font-mono font-bold text-amber-300 tracking-[0.3em]">{devCode}</span>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                required
                className="w-full h-14 bg-white/5 border border-white/10 text-white text-center text-3xl tracking-[0.5em] font-mono placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 rounded-xl font-medium transition-all duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {resending
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-slate-400">
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function OtpVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <OtpForm />
    </Suspense>
  );
}
