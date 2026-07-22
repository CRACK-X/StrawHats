'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function HomeNavbar() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/me/role');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setRole(data.role);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold text-white">Straw Hats Robotics</span>
        </div>
        <div className="flex gap-4 items-center">
          {loading ? (
            <div className="w-20 h-9 bg-slate-700 animate-pulse rounded" />
          ) : role ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              {role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button onClick={handleLogout} variant="ghost" className="text-slate-400 hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Join Team</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
