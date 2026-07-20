'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Users, Trophy, Wrench } from 'lucide-react';

const Robot3D = dynamic(() => import('@/components/Robot3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-800/50 rounded-lg flex items-center justify-center">
      <div className="text-white">Loading 3D Model...</div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">Straw Hats Robotics</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Join Team
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Dive Into{' '}
              <span className="text-cyan-400">Robotics</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-lg">
              Straw Hats Robotics is a student team competing in the MATE ROV Competition, 
              designing and building underwater robots to solve real-world engineering challenges.
            </p>
            <div className="flex gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  Join Our Team
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <Robot3D />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          What We Do
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Wrench className="w-10 h-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Design & Build</CardTitle>
              <CardDescription className="text-slate-400">
                From concept to competition-ready ROV, we handle mechanical design, 
                electronics, and software development.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Users className="w-10 h-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Teamwork</CardTitle>
              <CardDescription className="text-slate-400">
                Collaborate with fellow students, learn new skills, and build 
                lasting friendships through engineering.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Trophy className="w-10 h-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Compete</CardTitle>
              <CardDescription className="text-slate-400">
                Test your ROV against teams from around the world in the 
                prestigious MATE ROV Competition.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-cyan-400" />
              <span className="text-white font-semibold">Straw Hats Robotics</span>
            </div>
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Straw Hats Robotics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
