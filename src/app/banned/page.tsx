'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { ShieldOff } from 'lucide-react';

export default function BannedPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    document.title = 'Account Banned | Straw Hats Robotics';
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldOff className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Account Banned</h1>
        <p className="text-slate-400">
          Your account has been banned from accessing this website. If you believe this is a mistake, please contact an administrator.
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
