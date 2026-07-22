'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function WaitingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Waiting for Approval</CardTitle>
          <CardDescription className="text-slate-400">
            Your account has been created and your email has been verified. An admin now needs to approve your membership.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-slate-300 font-medium">What happens next?</p>
                <p className="text-sm text-slate-400 mt-1">
                  An admin will review your application. Once approved, you&apos;ll be able to log in and access the team dashboard. You&apos;ll receive an email when your account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500">
            <p>This usually takes within 24 hours.</p>
          </div>

          <Link href="/login">
            <button className="w-full py-2.5 px-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm transition-colors">
              Back to Login
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
