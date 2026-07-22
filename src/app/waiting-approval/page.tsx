'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, Anchor } from 'lucide-react';
import Link from 'next/link';

export default function WaitingApprovalPage() {
  useEffect(() => { document.title = 'Waiting for Approval | Straw Hats Robotics'; }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Waiting for Approval</h1>
            <p className="text-slate-400 mt-2">
              Your account has been created and your email has been verified. An admin now needs to approve your membership.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-300 font-medium">What happens next?</p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    An admin will review your application. Once approved, you&apos;ll be able to log in and access the team dashboard. You&apos;ll receive an email when your account is approved.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500">
              This usually takes within 24 hours.
            </p>

            <Link href="/login">
              <button className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-sm font-medium transition-all duration-300">
                Back to Login
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
