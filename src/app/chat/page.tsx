'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  User, LogOut, Home, Loader2, MessageSquare, ChevronLeft,
  Send, Image, File, Mic, MicOff, Plus, Hash, Download,
  Circle, Play, Pause, X as XIcon
} from 'lucide-react';

interface Profile { id: string; full_name: string; member_id: string; role: string; }
interface Conversation { id: string; type: 'public' | 'dm'; created_at: string; other_user?: { id: string; full_name: string }; last_message?: { content: string; created_at: string; message_type: string } | null; unread_count?: number; }
interface ChatMessage { id: string; conversation_id: string; user_id: string; content: string; message_type: 'text' | 'image' | 'file' | 'voice'; file_url?: string | null; file_name?: string | null; file_size?: number | null; created_at: string; profiles?: { full_name: string; } | null; }
interface ChatBan { banned: boolean; timed_out: boolean; timeout_until?: string | null; }

function formatTime(d: string) {
  try { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
}

function getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'; }

function fileIcon(type: string) {
  if (type === 'image') return <Image className="w-4 h-4" />;
  if (type === 'voice') return <Mic className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatBan, setChatBan] = useState<ChatBan>({ banned: false, timed_out: false });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [searchMembers, setSearchMembers] = useState('');
  const [recording, setRecording] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          if (!cancelled) setProfile(data.profile);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?conversation_id=${convId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setChatBan({ banned: data.banned || false, timed_out: data.timed_out || false, timeout_until: data.timeout_until });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeConvId) fetchMessages(activeConvId);
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeConvId) fetchMessages(activeConvId);
      fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConvId, fetchMessages, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        const team = data.team || [];
        setTeamMembers(team.map((m: Record<string, unknown>) => ({ id: m.member_id as string, full_name: m.full_name as string })));
      }
    } catch { /* ignore */ }
  };

  const handleNewChat = async (userId: string) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dm', userId }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchConversations();
        setActiveConvId(data.conversation.id);
        setNewChatOpen(false);
        setSearchMembers('');
      }
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeConvId, content: newMessage.trim(), message_type: 'text' }),
      });
      setNewMessage('');
      fetchMessages(activeConvId);
    } catch { /* ignore */ }
    setSending(false);
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string; size: number } | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return { url: data.url, name: data.name || file.name, size: data.size || file.size };
      }
    } catch { /* ignore */ }
    setUploading(false);
    return null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;
    const upload = await uploadFile(file);
    if (upload) {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeConvId, content: file.name, message_type: 'image', file_url: upload.url, file_name: upload.name, file_size: upload.size }),
      });
      fetchMessages(activeConvId);
    }
    setUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;
    const upload = await uploadFile(file);
    if (upload) {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeConvId, content: file.name, message_type: 'file', file_url: upload.url, file_name: upload.name, file_size: upload.size }),
      });
      fetchMessages(activeConvId);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', blob, `voice-${Date.now()}.webm`);
          const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
          if (res.ok && activeConvId) {
            const data = await res.json();
            await fetch('/api/chat/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversation_id: activeConvId, content: 'Voice message', message_type: 'voice', file_url: data.url, file_name: data.name, file_size: data.size }),
            });
            fetchMessages(activeConvId);
          }
        } catch { /* ignore */ }
        setUploading(false);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch { /* ignore */ }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const toggleVoice = (msgId: string, url: string) => {
    if (playingVoice === msgId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingVoice(null);
    audio.play();
    audioRef.current = audio;
    setPlayingVoice(msgId);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const filteredMembers = teamMembers.filter(m => m.full_name.toLowerCase().includes(searchMembers.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
      <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageUpload} />

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          {sidebarOpen && <span className="text-white font-bold text-lg tracking-tight">Chat</span>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white ml-auto hover:bg-white/5">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {sidebarOpen && (
          <>
            <div className="p-3 border-b border-white/5">
              <Button
                onClick={() => { setNewChatOpen(true); fetchTeamMembers(); }}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Chat
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const label = conv.type === 'public' ? 'Public Chat' : conv.other_user?.full_name || 'Unknown';
                const preview = conv.last_message?.content || 'No messages yet';
                const isImage = conv.last_message?.message_type === 'image';
                const isFile = conv.last_message?.message_type === 'file';
                const isVoice = conv.last_message?.message_type === 'voice';
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-400 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                      conv.type === 'public' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                    }`}>
                      {conv.type === 'public' ? <Hash className="w-4 h-4" /> : getInitials(label)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{label}</span>
                        {conv.last_message && (
                          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{formatTime(conv.last_message.created_at)}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {isImage ? '🖼 Image' : isFile ? '📎 File' : isVoice ? '🎤 Voice' : preview}
                      </p>
                    </div>
                    {(conv.unread_count ?? 0) > 0 && (
                      <Badge className="bg-cyan-500 text-white text-xs px-1.5 py-0 min-w-[18px] justify-center">{conv.unread_count}</Badge>
                    )}
                  </button>
                );
              })}
              {conversations.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No conversations yet</p>
                </div>
              )}
            </nav>
          </>
        )}

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

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeConvId ? (
          <>
            {/* Chat Header */}
            <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                  activeConv?.type === 'public' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                }`}>
                  {activeConv?.type === 'public' ? <Hash className="w-4 h-4" /> : getInitials(activeConv?.other_user?.full_name || '')}
                </div>
                <div>
                  <h1 className="text-white font-bold tracking-tight">
                    {activeConv?.type === 'public' ? 'Public Chat' : activeConv?.other_user?.full_name || 'Chat'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                  <p className="text-xs text-slate-400">{profile?.member_id}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
                  {getInitials(profile?.full_name || '')}
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatBan.banned ? (
                <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                      <XIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-red-400 font-medium text-lg">You are banned from chat</p>
                    <p className="text-slate-400 text-sm mt-2">Contact an admin for more information.</p>
                  </CardContent>
                </Card>
              ) : chatBan.timed_out ? (
                <Card className="bg-yellow-500/10 backdrop-blur-xl border-yellow-500/20">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                      <MicOff className="w-8 h-8 text-yellow-400" />
                    </div>
                    <p className="text-yellow-400 font-medium text-lg">You are timed out</p>
                    <p className="text-slate-400 text-sm mt-2">
                      Until {chatBan.timeout_until ? new Date(chatBan.timeout_until).toLocaleString() : 'unknown time'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No messages yet. Say hello!</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === profile?.id;
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg shadow-cyan-500/10">
                          {getInitials(msg.profiles?.full_name || '?')}
                        </div>
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                          <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                            <span className="text-xs font-medium text-white">{msg.profiles?.full_name || 'Unknown'}</span>
                            <span className="text-xs text-slate-500">{formatTime(msg.created_at)}</span>
                          </div>
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isOwn ? 'bg-cyan-600/20 border border-cyan-500/20' : 'bg-white/5 border border-white/10'
                          }`}>
                            {msg.message_type === 'image' && msg.file_url && (
                              <div className="mb-2">
                                <img
                                  src={msg.file_url}
                                  alt={msg.file_name || 'Image'}
                                  className="rounded-xl max-w-full max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setExpandedImage(msg.file_url!)}
                                />
                              </div>
                            )}
                            {msg.message_type === 'file' && msg.file_url && (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-1"
                              >
                                <File className="w-5 h-5" />
                                <span className="truncate">{msg.file_name || 'File'}</span>
                                <Download className="w-4 h-4 shrink-0" />
                              </a>
                            )}
                            {msg.message_type === 'voice' && msg.file_url && (
                              <div className="flex items-center gap-2 min-w-[200px]">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                  onClick={() => toggleVoice(msg.id, msg.file_url!)}
                                >
                                  {playingVoice === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </Button>
                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-400/50 rounded-full" style={{ width: playingVoice === msg.id ? '50%' : '0%' }} />
                                </div>
                              </div>
                            )}
                            {msg.content && msg.content !== 'Voice message' && msg.message_type !== 'image' && (
                              <p className="text-sm text-slate-200 whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {!chatBan.banned && !chatBan.timed_out && (
              <div className="border-t border-white/5 bg-slate-900/40 backdrop-blur-xl p-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-white/5"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Image className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-white/5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <File className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`hover:bg-white/5 ${recording ? 'text-red-400 hover:text-red-300' : 'text-slate-400 hover:text-white'}`}
                    onClick={recording ? stopRecording : startRecording}
                    disabled={uploading}
                  >
                    {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    disabled={sending || uploading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending || uploading}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
                {(uploading || recording) && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{recording ? 'Recording...' : 'Uploading...'}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Straw Hats Chat</h2>
              <p className="text-slate-400 text-sm max-w-xs">
                Select a conversation from the sidebar or start a new chat.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Start a New Chat</DialogTitle>
            <DialogDescription>Select a team member to start a direct message.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search members..."
              value={searchMembers}
              onChange={(e) => setSearchMembers(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredMembers.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No members found</p>
              )}
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleNewChat(m.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {getInitials(m.full_name)}
                  </div>
                  <span className="text-white">{m.full_name}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewChatOpen(false)} className="text-slate-400 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expanded Image Dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl p-2">
          {expandedImage && (
            <img src={expandedImage} alt="Expanded" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
