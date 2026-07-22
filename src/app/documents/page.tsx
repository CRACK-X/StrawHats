'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, FileText, Download } from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  general: 'bg-slate-500/20 text-slate-400',
  budget: 'bg-green-500/20 text-green-400',
  technical: 'bg-blue-500/20 text-blue-400',
  competition: 'bg-cyan-500/20 text-cyan-400',
  meeting_notes: 'bg-purple-500/20 text-purple-400',
};

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/documents');
        if (res.status === 401) { router.push('/login'); return; }
        if (res.ok) { const d = await res.json(); if (!cancelled) setDocs(d.documents || []); }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const categories = ['all', ...new Set(docs.map(d => d.category))];
  const filtered = filter === 'all' ? docs : docs.filter(d => d.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Documents</h1>
          <Link href="/"><Button variant="ghost" className="text-slate-400 hover:text-white"><Home className="w-4 h-4 mr-2" />Home</Button></Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(c => (
            <Button key={c} size="sm" variant={filter === c ? 'default' : 'ghost'} onClick={() => setFilter(c)} className={filter === c ? 'bg-cyan-600' : 'text-slate-400'}>
              {c === 'all' ? 'All' : c.replace('_', ' ')}
            </Button>
          ))}
        </div>
        {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> :
        filtered.length === 0 ? <p className="text-slate-400 text-center py-8">No documents</p> :
        <div className="space-y-3">
          {filtered.map(doc => (
            <Card key={doc.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{doc.title}</h3>
                    {doc.description && <p className="text-sm text-slate-400">{doc.description}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full ${categoryColors[doc.category] || categoryColors.general}`}>{doc.category.replace('_', ' ')}</span>
                      {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-slate-400"><Download className="w-4 h-4 mr-1" />Download</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>}
      </main>
    </div>
  );
}
