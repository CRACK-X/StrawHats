'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  User, Calendar, LogOut, Home, Loader2, Shield, Megaphone, Pin,
  Trophy, Wrench, MessageSquare, FileText, Users, ChevronLeft,
  Search, Copy, Trash2, Check, X, Eye, ChevronDown, QrCode, UserPlus,
  Settings, BarChart3, Mail, Clock, Hash, BookOpen, ClipboardList, ScrollText
} from 'lucide-react';

interface Profile { id: string; full_name: string; member_id: string; role: string; bio: string; pending: boolean; created_at: string; }
interface Attendance { id: number; user_id: string; attended_on: string; scanned_at: string; profiles?: { full_name: string; member_id: string } | null; }
interface MemberId { id: string; code: string; member_id: string; status: string; created_at: string; }
interface ContactRequest { id: string; user_id: string; subject: string; message: string; status: string; created_at: string; profiles?: { full_name: string; member_id: string } | null; }
interface Competition { id: string; name: string; description: string | null; location: string | null; date_from: string | null; date_to: string | null; status: string; result: string | null; url: string | null; }
interface Event { id: string; title: string; description: string | null; event_date: string; event_time: string | null; location: string | null; type: string; }
interface Announcement { id: string; title: string; content: string; pinned: boolean; created_at: string; }
interface Document { id: string; title: string; file_name: string; file_url: string; category: string; created_at: string; }
interface Skill { id: string; name: string; category: string; }
interface SignupRequest { id: string; full_name: string; email: string; role_name: string; status: string; rejection_reason: string | null; created_at: string; }
interface TeamRole { id: string; name: string; sort_order: number; }

type Tab = 'overview' | 'signups' | 'users' | 'attendance' | 'codes' | 'messages' | 'events' | 'competitions' | 'announcements' | 'documents' | 'skills' | 'logs';

const navItems: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'signups', label: 'Signups', icon: UserPlus },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList },
  { id: 'codes', label: 'Invite Codes', icon: Hash },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'competitions', label: 'Competitions', icon: Trophy },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'logs', label: 'Audit Logs', icon: ScrollText },
];

function formatDate(d: string | null | undefined) { if (!d) return '—'; try { const dt = new Date(d); return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return '—'; } }

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [memberIds, setMemberIds] = useState<MemberId[]>([]);
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.push('/login'); return; }

      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) {
          if (res.status === 403) { router.push('/dashboard'); return; }
          throw new Error('Failed to fetch dashboard data');
        }
        const d = await res.json();
        if (!cancelled) {
          setUsers(d.users || []);
          setAttendance(d.attendance || []);
          setMemberIds(d.memberIds || []);
          setContacts(d.contacts || []);
          setCompetitions(d.competitions || []);
          setEvents(d.events || []);
          setAnnouncements(d.announcements || []);
          setDocuments(d.documents || []);
          setSkills(d.skills || []);
          setSignupRequests(d.signupRequests || []);
          setTeamRoles(d.teamRoles || []);
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const pendingSignups = signupRequests.filter(r => r.status === 'pending').length;
  const openMessages = contacts.filter(c => c.status === 'open').length;

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
          {sidebarOpen && <span className="text-white font-bold text-lg tracking-tight">Admin</span>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white ml-auto hover:bg-white/5">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const count = item.id === 'signups' ? pendingSignups : item.id === 'messages' ? openMessages : 0;
            return (
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
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {count > 0 && <Badge variant="destructive" className="ml-auto">{count}</Badge>}
                  </>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/5 space-y-1">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
              <Home className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="ml-3">Home</span>}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
              <User className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="ml-3">Dashboard</span>}
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white capitalize tracking-tight">{activeTab === 'overview' ? 'Admin Panel' : activeTab.replace(/_/g, ' ')}</h1>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'users' && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white w-64"
                />
              </div>
            )}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
              <Shield className="w-4 h-4" />
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'overview' && <AdminOverview users={users} attendance={attendance} pendingSignups={pendingSignups} openMessages={openMessages} memberIds={memberIds} />}
          {activeTab === 'signups' && <AdminSignups requests={signupRequests} onRefresh={() => fetch('/api/admin/signup-requests').then(r => r.json()).then(d => setSignupRequests(d.requests || []))} />}
          {activeTab === 'users' && <AdminUsers users={users} search={search} />}
          {activeTab === 'attendance' && <AdminAttendance attendance={attendance} />}
          {activeTab === 'codes' && <AdminCodes memberIds={memberIds} />}
          {activeTab === 'messages' && <AdminMessages contacts={contacts} />}
          {activeTab === 'events' && <AdminEvents events={events} />}
          {activeTab === 'competitions' && <AdminCompetitions competitions={competitions} />}
          {activeTab === 'announcements' && <AdminAnnouncements announcements={announcements} />}
          {activeTab === 'documents' && <AdminDocuments documents={documents} />}
          {activeTab === 'skills' && <AdminSkills skills={skills} />}
          {activeTab === 'logs' && <AdminLogs />}
        </div>
      </main>
    </div>
  );
}

function AdminOverview({ users, attendance, pendingSignups, openMessages, memberIds }: {
  users: Profile[]; attendance: Attendance[]; pendingSignups: number; openMessages: number; memberIds: MemberId[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Total Users</p>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Pending Signups</p>
              <UserPlus className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{pendingSignups}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Today&apos;s Attendance</p>
              <ClipboardList className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{attendance.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Open Messages</p>
              <Mail className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{openMessages}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-500/20">
                      {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white text-sm">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.member_id}</p>
                    </div>
                  </div>
                  <Badge variant={u.role === 'admin' ? 'default' : u.pending ? 'warning' : 'secondary'}>{u.pending ? 'pending' : u.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Invite Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {memberIds.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-mono">{m.code}</p>
                    <p className="text-xs text-slate-500">{m.member_id} · {formatDate(m.created_at)}</p>
                  </div>
                  <Badge variant={m.status === 'unused' ? 'success' : m.status === 'used' ? 'secondary' : 'destructive'}>{m.status}</Badge>
                </div>
              ))}
              {memberIds.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No codes generated</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminSignups({ requests, onRefresh }: { requests: SignupRequest[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setLoading(id);
    try {
      const res = await fetch('/api/admin/signup-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action, rejectionReason: reason }),
      });
      if (res.ok) onRefresh();
    } catch { /* ignore */ }
    setLoading(null);
  };

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-medium mb-3">Pending ({pending.length})</h3>
        {pending.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10"><CardContent className="py-8 text-center text-slate-500">No pending requests</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {pending.map(r => (
              <Card key={r.id} className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{r.full_name}</p>
                    <p className="text-sm text-slate-400">{r.email} · {r.role_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(r.id, 'approve')} disabled={loading === r.id} className="bg-green-600 hover:bg-green-700 text-white">
                      {loading === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(r.id, 'reject')} disabled={loading === r.id}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-white font-medium mb-3">Processed ({processed.length})</h3>
        <div className="space-y-2">
          {processed.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div>
                <p className="text-white text-sm">{r.full_name} · {r.email}</p>
                <p className="text-xs text-slate-500">{r.role_name} · {formatDate(r.created_at)}</p>
              </div>
              <Badge variant={r.status === 'approved' ? 'success' : 'destructive'}>{r.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ users, search }: { users: Profile[]; search: string }) {
  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.member_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Member ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-500/20">
                      {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white text-sm">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.bio?.slice(0, 40)}{u.bio && u.bio.length > 40 ? '...' : ''}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{u.member_id}</TableCell>
                <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
                <TableCell><Badge variant={u.pending ? 'warning' : 'success'}>{u.pending ? 'pending' : 'active'}</Badge></TableCell>
                <TableCell className="text-sm text-slate-400">{formatDate(u.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AdminAttendance({ attendance }: { attendance: Attendance[] }) {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Member ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">No attendance records today</TableCell></TableRow>
            ) : attendance.map(a => (
              <TableRow key={a.id}>
                <TableCell className="text-white">{a.profiles?.full_name || '—'}</TableCell>
                <TableCell className="font-mono text-sm">{a.profiles?.member_id || '—'}</TableCell>
                <TableCell className="text-sm">{formatDate(a.attended_on)}</TableCell>
                <TableCell className="text-sm text-slate-400">{(() => { try { return new Date(a.scanned_at).toLocaleTimeString(); } catch { return '—'; } })()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AdminCodes({ memberIds }: { memberIds: MemberId[] }) {
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/member-ids/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) });
      if (res.ok) {
        const d = await res.json();
        setCodes(d.codes?.map((c: { code: string }) => c.code) || []);
        fetch('/api/admin/data').then(r => r.json()).then(d => { if (d.memberIds) window.location.reload(); });
      }
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} disabled={generating} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
          Generate Invite Code
        </Button>
        {codes.length > 0 && (
          <div className="flex gap-2">
            {codes.map(c => (
              <div key={c} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                <code className="text-cyan-400 text-sm font-mono">{c}</code>
                <Button variant="ghost" size="icon" onClick={() => copyCode(c)} className="h-6 w-6"><Copy className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberIds.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.code}</TableCell>
                  <TableCell className="text-sm">{m.member_id}</TableCell>
                  <TableCell><Badge variant={m.status === 'unused' ? 'success' : m.status === 'used' ? 'secondary' : 'destructive'}>{m.status}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-400">{formatDate(m.created_at)}</TableCell>
                </TableRow>
              ))}
              {memberIds.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">No codes generated yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminMessages({ contacts }: { contacts: ContactRequest[] }) {
  return (
    <div className="space-y-4">
      {contacts.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No messages</p>
          </CardContent>
        </Card>
      ) : contacts.map(c => (
        <Card key={c.id} className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{c.subject}</h3>
                  <Badge variant={c.status === 'open' ? 'warning' : 'secondary'}>{c.status}</Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">{c.message}</p>
                <p className="text-xs text-slate-500 mt-2">From: {c.profiles?.full_name || 'Unknown'} · {formatDate(c.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminEvents({ events }: { events: Event[] }) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No events</p>
          </CardContent>
        </Card>
      ) : events.map(e => (
        <Card key={e.id} className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{e.title}</h3>
              <p className="text-sm text-slate-400">{formatDate(e.event_date)}{e.location ? ` · ${e.location}` : ''}</p>
            </div>
            <Badge variant="outline">{e.type.replace('_', ' ')}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminCompetitions({ competitions }: { competitions: Competition[] }) {
  return (
    <div className="space-y-4">
      {competitions.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No competitions</p>
          </CardContent>
        </Card>
      ) : competitions.map(c => (
        <Card key={c.id} className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{c.name}</h3>
              <p className="text-sm text-slate-400">{c.date_from}{c.date_to ? ` — ${c.date_to}` : ''}{c.location ? ` · ${c.location}` : ''}</p>
            </div>
            <Badge variant={c.status === 'upcoming' ? 'default' : c.status === 'completed' ? 'secondary' : 'outline'}>{c.status.replace('_', ' ')}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminAnnouncements({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="space-y-4">
      {announcements.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No announcements</p>
          </CardContent>
        </Card>
      ) : announcements.map(a => (
        <Card key={a.id} className={`bg-white/5 backdrop-blur-xl border-white/10 ${a.pinned ? 'border-cyan-500/30' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-medium flex items-center gap-2">
                  {a.pinned && <Pin className="w-4 h-4 text-cyan-400" />} {a.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{a.content}</p>
              </div>
              <span className="text-xs text-slate-500">{formatDate(a.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminDocuments({ documents }: { documents: Document[] }) {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map(d => (
              <TableRow key={d.id}>
                <TableCell className="text-white">{d.title}</TableCell>
                <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                <TableCell className="text-sm text-slate-400">{d.file_name}</TableCell>
                <TableCell className="text-sm text-slate-400">{formatDate(d.created_at)}</TableCell>
              </TableRow>
            ))}
            {documents.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">No documents</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AdminSkills({ skills }: { skills: Skill[] }) {
  const grouped = skills.reduce((acc, s) => { (acc[s.category || 'Other'] = acc[s.category || 'Other'] || []).push(s); return acc; }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">{cat || 'Other'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {items.map(s => <Badge key={s.id} variant="outline">{s.name}</Badge>)}
            </div>
          </CardContent>
        </Card>
      ))}
      {skills.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="py-12 text-center">
            <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No skills in catalog</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminLogs() {
  const [logs, setLogs] = useState<{ id: number; action: string; admin_id: string; ip_address: string; created_at: string; metadata: Record<string, unknown> }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/logs').then(r => r.json()).then(d => { setLogs(d.logs || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>;

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(l => (
              <TableRow key={l.id}>
                <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                <TableCell className="font-mono text-sm text-slate-400">{l.ip_address || '—'}</TableCell>
                <TableCell className="text-sm text-slate-400">{formatDate(l.created_at)}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-8">No audit logs</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
