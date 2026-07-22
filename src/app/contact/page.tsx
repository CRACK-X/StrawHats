'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Home, MessageSquare, Send, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface ContactRequest {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'replied' | 'closed';
  created_at: string;
  contact_replies: Array<{
    id: string;
    message: string;
    created_at: string;
    profiles: { full_name: string } | null;
  }>;
}

const statusColors = { open: 'text-yellow-400', replied: 'text-green-400', closed: 'text-slate-500' };
const statusIcons = { open: Clock, replied: CheckCircle, closed: XCircle };

export default function ContactPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/contact');
        if (res.status === 401) { router.push('/login'); return; }
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setRequests(data.requests || []);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSubmitting(false); return; }
      setRequests([{ ...data.request, contact_replies: [] }, ...requests]);
      setSubject(''); setMessage(''); setTab('history');
    } catch { setError('Network error'); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Contact Admin</h1>
          <Link href="/"><Button variant="ghost" className="text-slate-400 hover:text-white"><Home className="w-4 h-4 mr-2" />Home</Button></Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex gap-2 mb-6">
          <Button variant={tab === 'new' ? 'default' : 'ghost'} onClick={() => setTab('new')} className={tab === 'new' ? 'bg-cyan-600' : 'text-slate-400'}>
            <Send className="w-4 h-4 mr-2" />New Request
          </Button>
          <Button variant={tab === 'history' ? 'default' : 'ghost'} onClick={() => setTab('history')} className={tab === 'history' ? 'bg-cyan-600' : 'text-slate-400'}>
            <MessageSquare className="w-4 h-4 mr-2" />My Requests ({requests.length})
          </Button>
        </div>

        {tab === 'new' && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Send a Message</CardTitle><CardDescription className="text-slate-400">Subject to an admin. We&apos;ll get back to you.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
                <div className="space-y-2">
                  <Label className="text-slate-300">Subject</Label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white">
                    <option value="">Select a subject...</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Schedule Change">Schedule Change</option>
                    <option value="Equipment Request">Equipment Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Message</Label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder:text-slate-500" placeholder="Describe your question or issue..." />
                </div>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white" disabled={submitting}>{submitting ? 'Sending...' : 'Send Message'}</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> :
            requests.length === 0 ? <p className="text-slate-400 text-center py-8">No requests yet</p> :
            requests.map((req) => {
              const StatusIcon = statusIcons[req.status];
              return (
                <Card key={req.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="cursor-pointer" onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-5 h-5 ${statusColors[req.status]}`} />
                        <CardTitle className="text-white text-base">{req.subject}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString()}</span>
                        {expandedId === req.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedId === req.id && (
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{req.message}</p>
                        {req.contact_replies?.length > 0 && (
                          <div className="border-t border-slate-700 pt-3 mt-3 space-y-2">
                            {req.contact_replies.map((reply) => (
                              <div key={reply.id} className="p-3 bg-slate-700/50 rounded-lg">
                                <p className="text-xs text-cyan-400 mb-1">{reply.profiles?.full_name || 'Admin'} &middot; {new Date(reply.created_at).toLocaleString()}</p>
                                <p className="text-sm text-slate-300 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
