'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QRCodeSVG } from 'qrcode.react';
import {
  User, Calendar, LogOut, Home, Loader2, Shield, Megaphone, Pin,
  Trophy, Wrench, MessageSquare, FileText, Users, ChevronLeft,
  Clock, MapPin, CheckCircle, BarChart3, Settings, ExternalLink
} from 'lucide-react';

interface Profile { id: string; full_name: string; member_id: string; role: string; bio: string; avatar_url: string | null; created_at: string; }
interface Attendance { id: number; attended_on: string; scanned_at: string; }
interface Announcement { id: string; title: string; content: string; pinned: boolean; created_at: string; }
interface TeamEvent { id: string; title: string; description: string | null; event_date: string; event_time: string | null; end_time: string | null; location: string | null; type: string; }
interface Competition { id: string; name: string; description: string | null; location: string | null; date_from: string | null; date_to: string | null; status: string; result: string | null; url: string | null; }
interface TeamMember { full_name: string; member_id: string; role: string; bio: string | null; avatar_url: string | null; created_at: string; }

type Tab = 'overview' | 'events' | 'competitions' | 'announcements' | 'team' | 'skills' | 'documents' | 'contact';

const navItems: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'competitions', label: 'Competitions', icon: Trophy },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'contact', label: 'Contact Admin', icon: MessageSquare },
];

const typeColors: Record<string, string> = { meeting: 'bg-blue-500/20 text-blue-400', build_session: 'bg-orange-500/20 text-orange-400', competition: 'bg-cyan-500/20 text-cyan-400', social: 'bg-purple-500/20 text-purple-400', other: 'bg-slate-500/20 text-slate-400' };
const typeLabels: Record<string, string> = { meeting: 'Meeting', build_session: 'Build', competition: 'Competition', social: 'Social', other: 'Other' };
const statusStyles: Record<string, string> = { upcoming: 'bg-cyan-500/20 text-cyan-400', in_progress: 'bg-green-500/20 text-green-400', completed: 'bg-slate-500/20 text-slate-400', cancelled: 'bg-red-500/20 text-red-400' };

function formatDate(d: string | null | undefined) { if (!d) return '—'; try { const dt = new Date(d); return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return '—'; } }

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.push('/login'); return; }

      try {
        const meRes = await fetch('/api/me');
        if (meRes.status === 401) { router.push('/login'); return; }
        if (meRes.ok) {
          const data = await meRes.json();
          if (!cancelled) {
            setProfile(data.profile);
            setAttendance(data.attendance || []);
            setAnnouncements(data.announcements || []);
            setEvents(data.events || []);
            setCompetitions(data.competitions || []);
            setTeam(data.team || []);
          }
          const qrRes = await fetch('/api/qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: data.profile?.id }) });
          if (qrRes.ok && !cancelled) { const qrData = await qrRes.json(); setQrToken(qrData.qrToken); }
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const regenerateQr = async () => {
    if (!profile) return;
    setQrLoading(true); setQrToken(null);
    try { const res = await fetch('/api/qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: profile.id }) }); if (res.ok) { const d = await res.json(); setQrToken(d.qrToken); } } catch { /* ignore */ }
    setQrLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          {sidebarOpen && <span className="text-white font-bold text-lg tracking-tight">Dashboard</span>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white ml-auto hover:bg-white/5">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-cyan-500/15 text-cyan-400 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-white/5 space-y-1">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
              <Home className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="ml-3">Home</span>}
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
              <MessageSquare className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="ml-3">Chat</span>}
            </Button>
          </Link>
          {profile?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                <Shield className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="ml-3">Admin</span>}
              </Button>
            </Link>
          )}
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white capitalize tracking-tight">{activeTab === 'overview' ? 'Dashboard' : activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{profile?.full_name}</p>
              <p className="text-xs text-slate-400">{profile?.member_id}</p>
            </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
          {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              profile={profile}
              attendance={attendance}
              announcements={announcements}
              events={events}
              qrToken={qrToken}
              qrLoading={qrLoading}
              regenerateQr={regenerateQr}
            />
          )}
          {activeTab === 'events' && <EventsTab events={events} />}
          {activeTab === 'competitions' && <CompetitionsTab competitions={competitions} />}
          {activeTab === 'announcements' && <AnnouncementsTab announcements={announcements} />}
          {activeTab === 'team' && <TeamTab team={team} />}
          {activeTab === 'skills' && <SkillsTab />}
          {activeTab === 'documents' && <DocumentsTab />}
          {activeTab === 'contact' && <ContactTab />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab({ profile, attendance, announcements, events, qrToken, qrLoading, regenerateQr }: {
  profile: Profile | null; attendance: Attendance[]; announcements: Announcement[]; events: TeamEvent[];
  qrToken: string | null; qrLoading: boolean; regenerateQr: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Member Since</p>
            <p className="text-lg font-bold text-white">{formatDate(profile?.created_at)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Attendance</p>
            <p className="text-lg font-bold text-white">{attendance.length} sessions</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Role</p>
            <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'} className="mt-1">{profile?.role}</Badge>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Upcoming Events</p>
            <p className="text-lg font-bold text-white">{events.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Your QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {qrLoading || !qrToken ? (
              <div className="w-[180px] h-[180px] bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={qrToken} size={180} level="H" />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={regenerateQr} disabled={qrLoading} className="text-slate-400 border-white/10 hover:bg-white/5 hover:text-white">
              {qrLoading ? 'Regenerating...' : 'Regenerate QR'}
            </Button>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-cyan-400" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No announcements</p>
            ) : (
              announcements.slice(0, 3).map(a => (
                <div key={a.id} className={`p-3 rounded-xl ${a.pinned ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-white/5'}`}>
                  <p className="text-white text-sm font-medium flex items-center gap-1">
                    {a.pinned && <Pin className="w-3 h-3 text-cyan-400" />} {a.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No attendance records yet</p>
          ) : (
            <div className="space-y-2">
              {attendance.slice(0, 5).map(r => (
                <div key={r.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-white text-sm">{formatDate(r.attended_on)}</span>
                  <span className="text-slate-400 text-xs">
                    Checked in at {(() => { try { return new Date(r.scanned_at).toLocaleTimeString(); } catch { return '—'; } })()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventsTab({ events }: { events: TeamEvent[] }) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No upcoming events</p>
          </CardContent>
        </Card>
      ) : (
        events.map(e => (
          <Card key={e.id} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-white font-medium">{e.title}</h3>
                  {e.description && <p className="text-sm text-slate-400">{e.description}</p>}
                  <div className="flex flex-wrap gap-3 text-sm text-slate-400 pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(e.event_date)}</span>
                    {e.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{e.event_time}{e.end_time ? ` — ${e.end_time}` : ''}</span>}
                    {e.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{e.location}</span>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[e.type] || typeColors.other}`}>
                  {typeLabels[e.type] || e.type}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function CompetitionsTab({ competitions }: { competitions: Competition[] }) {
  return (
    <div className="space-y-4">
      {competitions.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No competitions listed</p>
          </CardContent>
        </Card>
      ) : (
        competitions.map(c => (
          <Card key={c.id} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-white font-medium">{c.name}</h3>
                  {c.description && <p className="text-sm text-slate-400">{c.description}</p>}
                  <div className="flex flex-wrap gap-3 text-sm text-slate-400 pt-1">
                    {c.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{c.location}</span>}
                    {c.date_from && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{c.date_from}{c.date_to ? ` — ${c.date_to}` : ''}</span>}
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"><ExternalLink className="w-3.5 h-3.5" />Website</a>}
                  </div>
                  {c.result && <p className="text-sm text-green-400 pt-1">Result: {c.result}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status] || statusStyles.upcoming}`}>
                  {c.status.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function AnnouncementsTab({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="space-y-4">
      {announcements.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No announcements yet</p>
          </CardContent>
        </Card>
      ) : (
        announcements.map(a => (
          <Card key={a.id} className={`bg-white/5 backdrop-blur-xl border-white/10 ${a.pinned ? 'border-cyan-500/30' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    {a.pinned && <Pin className="w-4 h-4 text-cyan-400" />} {a.title}
                  </h3>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{a.content}</p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap ml-4">{formatDate(a.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function TeamTab({ team }: { team: TeamMember[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {team.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 md:col-span-2 lg:col-span-3">
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No team members yet</p>
          </CardContent>
        </Card>
      ) : (
        team.map(m => (
          <Card key={m.member_id} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
                  {m.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">{m.full_name}</h3>
                  <p className="text-xs text-slate-500">{m.member_id}</p>
                </div>
                {m.role === 'admin' && <Shield className="w-4 h-4 text-cyan-400 ml-auto shrink-0" />}
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{m.bio || <span className="italic text-slate-500">No bio yet</span>}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function SkillsTab() {
  const [skills, setSkills] = useState<{ id: string; name: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(d => { setSkills(d.skills || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>;

  const grouped = skills.reduce((acc, s) => { (acc[s.category || 'Other'] = acc[s.category || 'Other'] || []).push(s); return acc; }, {} as Record<string, typeof skills>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">{cat || 'Other'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {items.map(s => (
                <Badge key={s.id} variant="outline">{s.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {skills.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No skills catalog yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DocumentsTab() {
  const [docs, setDocs] = useState<{ id: string; title: string; description: string | null; file_name: string; file_url: string; category: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(d => { setDocs(d.documents || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {docs.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No documents available</p>
          </CardContent>
        </Card>
      ) : (
        docs.map(d => (
          <Card key={d.id} className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">{d.title}</h3>
                <p className="text-xs text-slate-400">{d.category} · {formatDate(d.created_at)}</p>
              </div>
              <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                </Button>
              </a>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ContactTab() {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 max-w-2xl">
      <CardHeader>
        <CardTitle className="text-white">Contact Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-400 text-sm">Need help? Send a message to the admin team.</p>
        <Link href="/contact">
          <Button className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white">
            <MessageSquare className="w-4 h-4 mr-2" /> Go to Contact Form
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
