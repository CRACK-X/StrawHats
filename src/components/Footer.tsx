import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/New_LOGO.png" alt="Straw Hats Robotics" className="h-8 w-auto" />
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
