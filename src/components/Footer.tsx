import Link from 'next/link';
import { Anchor } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Anchor className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight">Straw Hats Robotics</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} Straw Hats Robotics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
