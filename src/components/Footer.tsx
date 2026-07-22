import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-slate-800/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span className="text-white font-semibold">Straw Hats Robotics</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-slate-400 text-sm">&copy; {new Date().getFullYear()} Straw Hats Robotics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
