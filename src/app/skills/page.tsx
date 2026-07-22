'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Wrench, Save } from 'lucide-react';
import Link from 'next/link';

interface Skill { id: string; name: string; category: string; }
interface MemberSkill { skill_id: string; proficiency: string; }

const proficiencyColors: Record<string, string> = {
  beginner: 'bg-slate-500/20 text-slate-400',
  intermediate: 'bg-blue-500/20 text-blue-400',
  advanced: 'bg-orange-500/20 text-orange-400',
  expert: 'bg-green-500/20 text-green-400',
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [skillsRes, meRes] = await Promise.all([
          fetch('/api/skills'),
          fetch('/api/me'),
        ]);
        if (meRes.status === 401) { router.push('/login'); return; }
        const skillsData = await skillsRes.json();
        const meData = await meRes.json();
        if (!cancelled) {
          setSkills(skillsData.skills || []);
          const existing: Record<string, string> = {};
          (meData.profile?.member_skills || []).forEach((s: MemberSkill) => { existing[s.skill_id] = s.proficiency; });
          setSelected(existing);
          setLoading(false);
        }
      } catch { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (skillId: string) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[skillId]) delete next[skillId];
      else next[skillId] = 'beginner';
      return next;
    });
  };

  const updateProficiency = (skillId: string, prof: string) => {
    setSelected(prev => ({ ...prev, [skillId]: prof }));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/skills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: Object.entries(selected).map(([skill_id, proficiency]) => ({ skill_id, proficiency })) }),
    });
    setSaving(false);
  };

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Wrench className="w-5 h-5 text-cyan-400" />Skills</h1>
          <div className="flex gap-2">
            <Link href="/"><Button variant="ghost" className="text-slate-400 hover:text-white"><Home className="w-4 h-4 mr-2" />Home</Button></Link>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-slate-400 mb-8 text-center">Tag your skills so the team knows what you bring</p>
        {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> :
        Object.entries(grouped).map(([cat, catSkills]) => (
          <div key={cat} className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">{cat}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {catSkills.map(skill => {
                const active = !!selected[skill.id];
                return (
                  <div key={skill.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${active ? 'bg-cyan-500/10 border-cyan-700/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`} onClick={() => toggle(skill.id)}>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{skill.name}</span>
                      {active && (
                        <select onClick={(e) => e.stopPropagation()} value={selected[skill.id]} onChange={(e) => updateProficiency(skill.id, e.target.value)} className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white">
                          {Object.keys(proficiencyColors).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
