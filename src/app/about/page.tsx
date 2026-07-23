import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, History, Users } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Straw Hats Robotics — our mission, values, and journey building underwater ROVs for competitions like MATE ROV.',
};

const teamMembers = [
  { name: 'Team Member 1', role: 'Team Lead', image: '/team/member1.jpg' },
  { name: 'Team Member 2', role: 'Mechanical Lead', image: '/team/member2.jpg' },
  { name: 'Team Member 3', role: 'Software Lead', image: '/team/member3.jpg' },
  { name: 'Team Member 4', role: 'Electrical Lead', image: '/team/member4.jpg' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/New_LOGO.png" alt="Straw Hats Robotics" className="h-8 w-auto" />
            <span className="text-xl font-bold text-white">Straw Hats Robotics</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25">
                Join Team
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Straw Hats Robotics</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Straw Hats Robotics is a student robotics team competing in ROV and
            underwater robotics competitions — including MATE ROV — designing,
            building, and piloting remotely operated underwater vehicles (ROVs) to
            complete real-world engineering missions. The team combines mechanical
            design, electronics, software, and teamwork to build a working ROV each
            season and present it as if it were a start-up company.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl h-full">
            <CardHeader>
              <Target className="w-10 h-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                To inspire and educate the next generation of engineers,
                scientists, and innovators through hands-on experience in
                underwater robotics. We believe in learning by doing,
                collaborating across disciplines, and pushing the boundaries of
                what&apos;s possible.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl h-full">
            <CardHeader>
              <Target className="w-10 h-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">What We Stand For</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Innovation', desc: 'Pushing boundaries with creative solutions' },
                { title: 'Collaboration', desc: 'Working together across disciplines' },
                { title: 'Excellence', desc: 'Striving for the highest quality in everything we do' },
              ].map((value) => (
                <div key={value.title} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 shadow-sm shadow-cyan-400/50" />
                  <div>
                    <h4 className="text-white font-medium">{value.title}</h4>
                    <p className="text-sm text-slate-300">{value.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* History */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Our Journey</h2>
        <div className="max-w-4xl mx-auto space-y-8">
          {[
            {
              year: '2024',
              title: 'Team Founded',
              desc: 'Straw Hats Robotics was established with a passion for underwater exploration and engineering excellence.',
            },
            {
              year: '2025',
              title: 'First Competition',
              desc: 'Our debut in underwater robotics competitions, where we learned valuable lessons and gained hands-on experience.',
            },
            {
              year: '2026',
              title: 'Current Season',
              desc: "Building on our experience, we're pushing for even better results this year.",
            },
          ].map((entry) => (
            <div key={entry.year} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div className="w-0.5 flex-1 bg-gradient-to-b from-cyan-500/50 to-transparent" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl font-bold text-white">
                  {entry.year} — {entry.title}
                </h3>
                <p className="text-slate-400 mt-2 leading-relaxed">{entry.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Meet the Team</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member) => (
            <Card
              key={member.role}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5 text-center"
            >
              <CardHeader>
                <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/10">
                  <Users className="w-12 h-12 text-slate-500" />
                </div>
                <CardTitle className="text-white">{member.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  {member.role}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl border-cyan-500/20">
          <CardContent className="py-12 text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">Ready to Dive In?</h2>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Join Straw Hats Robotics and be part of an exciting journey building
              underwater robots. No prior experience needed — just enthusiasm and a
              willingness to learn!
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 px-8">
                Apply to Join
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}
