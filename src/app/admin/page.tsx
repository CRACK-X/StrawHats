'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Calendar, QrCode, LogOut, Check } from 'lucide-react';
import QRScanner from './components/QRScanner';

interface Profile {
  id: string;
  full_name: string;
  member_id: string;
  role: string;
  pending: boolean;
  avatar_url: string | null;
  created_at: string;
  last_login: string | null;
}

interface Attendance {
  id: number;
  user_id: string;
  attended_on: string;
  scanned_at: string;
  profiles: {
    full_name: string;
    member_id: string;
  };
}

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      // Fetch all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*, profiles(full_name, member_id)')
        .eq('attended_on', today)
        .order('scanned_at', { ascending: false });

      setUsers(usersData || []);
      setAttendance(attendanceData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(data || []);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${searchQuery}%,member_id.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false });

    setUsers(data || []);
  };

  const handleApproveUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ pending: false })
      .eq('id', userId);

    setUsers(users.map(u => 
      u.id === userId ? { ...u, pending: false } : u
    ));
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-slate-700">
              <Calendar className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="scanner" className="data-[state=active]:bg-slate-700">
              <QrCode className="w-4 h-4 mr-2" />
              QR Scanner
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage team members and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="Search by name or member ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <Button onClick={handleSearch} className="bg-cyan-600 hover:bg-cyan-700">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">{user.full_name}</h3>
                          {user.pending && (
                            <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                              Pending
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{user.member_id}</p>
                      </div>
                      <div className="flex gap-2">
                        {user.pending && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAdmin(user.id, user.role)}
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Today&apos;s Attendance</CardTitle>
                <CardDescription className="text-slate-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    No attendance records for today
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((record) => (
                      <div
                        key={record.id}
                        className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white">{record.profiles.full_name}</p>
                          <p className="text-sm text-slate-400">{record.profiles.member_id}</p>
                        </div>
                        <span className="text-slate-400 text-sm">
                          {new Date(record.scanned_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Scanner Tab */}
          <TabsContent value="scanner">
            <QRScanner />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
