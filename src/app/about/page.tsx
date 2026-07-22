import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Target, History, Users } from 'lucide-react';
import Footer from '@/components/Footer';

const teamMembers = [
  { name: 'Team Member 1', role: 'Team Lead', image: '/team/member1.jpg' },
  { name: 'Team Member 2', role: 'Mechanical Lead', image: '/team/member2.jpg' },
  { name: 'Team Member 3', role: 'Software Lead', image: '/team/member3.jpg' },
  { name: 'Team Member 4', role: 'Electrical Lead', image: '/team/member4.jpg' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">Straw Hats Robotics</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
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
            About <span className="text-cyan-400">Straw Hats Robotics</span>
          </h1>
          <p className="text-lg text-slate-400">
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
          <Card className="bg-slate-800/50 border-slate-700 h-full">
            <CardHeader>
              <Target className="w-10 h-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                To inspire and educate the next generation of engineers,
                scientists, and innovators through hands-on experience in
                underwater robotics. We believe in learning by doing,
                collaborating across disciplines, and pushing the boundaries of
                what&apos;s possible.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 h-full">
            <CardHeader>
              <Target className="w-10 h-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">What We Stand For</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                <div>
                  <h4 className="text-white font-medium">Innovation</h4>
                  <p className="text-sm text-slate-400">Pushing boundaries with creative solutions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                <div>
                  <h4 className="text-white font-medium">Collaboration</h4>
                  <p className="text-sm text-slate-400">Working together across disciplines</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                <div>
                  <h4 className="text-white font-medium">Excellence</h4>
                  <p className="text-sm text-slate-400">Striving for the highest quality in everything we do</p>
                </div>
              </div>
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
                <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div className="w-0.5 flex-1 bg-slate-700" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl font-bold text-white">
                  {entry.year} - {entry.title}
                </h3>
                <p className="text-slate-400 mt-2">{entry.desc}</p>
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
              className="bg-slate-800/50 border-slate-700 hover:border-cyan-700/50 transition-colors text-center"
            >
              <CardHeader>
                <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
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
        <Card className="bg-cyan-600/20 border-cyan-600/30">
          <CardContent className="py-12 text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">Ready to Dive In?</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Join Straw Hats Robotics and be part of an exciting journey building
              underwater robots. No prior experience needed — just enthusiasm and a
              willingness to learn!
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
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
