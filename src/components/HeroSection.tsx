'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Wrench, LayoutDashboard } from 'lucide-react';

const Robot3D = dynamic(() => import('@/components/Robot3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-800/50 rounded-lg flex items-center justify-center">
      <div className="text-slate-500 text-sm">Loading 3D Model...</div>
    </div>
  ),
});

export default function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Dive Into{' '}
              <span className="text-cyan-400">Robotics</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-lg">
              Straw Hats Robotics is a student team competing in ROV and underwater
              robotics competitions — including MATE ROV — designing and building
              remotely operated vehicles to solve real-world engineering challenges.
            </p>
            <div className="flex gap-4">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      Join Our Team
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <Robot3D />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          What We Do
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Wrench,
              title: 'Design & Build',
              desc: 'From concept to competition-ready ROV, we handle mechanical design, electronics, and software development.',
            },
            {
              icon: Users,
              title: 'Teamwork',
              desc: 'Collaborate with fellow students, learn new skills, and build lasting friendships through engineering.',
            },
            {
              icon: Trophy,
              title: 'Compete',
              desc: 'Test your ROV against teams from around the world in prestigious underwater robotics competitions.',
            },
          ].map((feature) => (
            <Card
              key={feature.title}
              className="bg-slate-800/50 border-slate-700 hover:border-cyan-700/50 transition-colors h-full"
            >
              <CardHeader>
                <feature.icon className="w-10 h-10 text-cyan-400 mb-2" />
                <CardTitle className="text-white">{feature.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {feature.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
