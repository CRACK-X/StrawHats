import type { Metadata } from 'next';
import HomeNavbar from '@/components/HomeNavbar';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Straw Hats Robotics | Underwater Robotics Team',
  description:
    'Straw Hats Robotics is a student robotics team competing in ROV and underwater robotics competitions, including MATE ROV.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <HomeNavbar />
      <HeroSection />
      <Footer />
    </div>
  );
}
