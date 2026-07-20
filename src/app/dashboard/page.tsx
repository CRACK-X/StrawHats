'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { User, Calendar, LogOut } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  member_id: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface Attendance {
  id: number;
  attended_on: string;
  scanned_at: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('attended_on', { ascending: false })
        .limit(10);

      setProfile(profileData);
      setAttendance(attendanceData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

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
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
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
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your team member details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Name</p>
                <p className="text-white font-medium">{profile?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Member ID</p>
                <p className="text-white font-medium">{profile?.member_id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Role</p>
                <p className="text-white font-medium capitalize">{profile?.role}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Member Since</p>
                <p className="text-white font-medium">
                  {new Date(profile?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your QR Code</CardTitle>
              <CardDescription className="text-slate-400">
                Show this to the admin for attendance check-in
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={`straw-hats-attendance-${profile?.id}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                This QR code is unique to your account. Do not share it with others.
              </p>
            </CardContent>
          </Card>

          {/* Attendance History */}
          <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Attendance
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your attendance history for the last 10 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  No attendance records yet
                </p>
              ) : (
                <div className="space-y-2">
                  {attendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg"
                    >
                      <span className="text-white">
                        {new Date(record.attended_on).toLocaleDateString()}
                      </span>
                      <span className="text-slate-400 text-sm">
                        Checked in at {new Date(record.scanned_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
