'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Shield } from 'lucide-react';
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
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/New_LOGO.png" alt="Straw Hats Robotics" className="h-9 w-auto" />
          <span className="text-xl font-bold text-white tracking-tight">Straw Hats Robotics</span>
        </Link>
        <div className="flex gap-3 items-center">
          {loading ? (
            <div className="w-20 h-9 bg-white/5 animate-pulse rounded-xl" />
          ) : role ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              {role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button onClick={handleLogout} variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20">
                  Join Team
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
