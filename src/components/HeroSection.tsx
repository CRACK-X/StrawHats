'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Users, Trophy, Wrench, LayoutDashboard } from 'lucide-react';

const Robot3D = dynamic(() => import('@/components/Robot3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-white/5 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading 3D Model...</p>
      </div>
    </div>
  ),
});

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
          <div className="space-y-8">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Dive Into{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Robotics
                </span>
              </h1>
            </motion.div>

            <motion.p
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed"
            >
              Straw Hats Robotics is a student team competing in ROV and underwater
              robotics competitions — including MATE ROV — designing and building
              remotely operated vehicles to solve real-world engineering challenges.
            </motion.p>

            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex gap-4"
            >
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300">
                      Join Our Team
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 text-white transition-all duration-300">
                      Learn More
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <Robot3D />
            {/* Decorative glow behind robot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
        >
          What We Do
        </motion.h2>
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
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <div className="group h-full p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.08] transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
