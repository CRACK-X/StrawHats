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
  Play, Pause, X as XIcon, Users, Check, Pencil, Trash2, AlertCircle,
  Star, Search, Reply, Smile, ChevronDown, Crown, Video
} from 'lucide-react';

interface Profile { id: string; full_name: string; member_id: string; role: string; }
interface Reaction { emoji: string; user_id: string; }
interface ReplyTo { id: string; content: string | null; user_id: string; full_name: string | null; message_type: string; file_url?: string | null; }
interface Conversation { id: string; type: 'public' | 'dm' | 'group'; name?: string | null; created_at: string; is_favorited?: boolean; other_user?: { id: string; full_name: string }; members?: Array<{ id: string; full_name: string }>; last_message?: { content: string; created_at: string; message_type: string } | null; unread_count?: number; }
interface ChatMessage { id: string; conversation_id: string; user_id: string; content: string; message_type: 'text' | 'image' | 'file' | 'voice' | 'video'; file_url?: string | null; file_name?: string | null; file_size?: number | null; duration?: number | null; reply_to_id?: string | null; reply_to?: ReplyTo | null; reactions?: Reaction[]; created_at: string; profiles?: { full_name: string; } | null; }
interface ChatBan { banned: boolean; timed_out: boolean; timeout_until?: string | null; }
interface TypingUser { id: string; name: string; }

const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','🎉','💯','👀','🙏','💪','🚀','✅','⭐','🤔','👏','😍','🥳','💀','🫡','💜','🧡','💚','💙','🤡','😈','🫠'];

function formatTime(d: string) {
  try { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
}

function formatRelative(d: string) {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - dt.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const time = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Yesterday at ${time}`;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + time;
  } catch { return ''; }
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'; }

const QUICK_REACTIONS = ['👍','❤️','😂','🔥','🎉','💯'];

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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordCancelled, setRecordCancelled] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [chatLogs, setChatLogs] = useState<{ id: number; level: 'error' | 'warn' | 'info'; message: string; detail?: string; time: string }[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarSearchResults, setSidebarSearchResults] = useState<{ users: { id: string; full_name: string }[]; conversations: { id: string; name: string }[] }>({ users: [], conversations: [] });
  const [sidebarSearching, setSidebarSearching] = useState(false);
  const [membersPanelOpen, setMembersPanelOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{ id: string; full_name: string; member_id?: string; role?: string }[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [deleteConvOpen, setDeleteConvOpen] = useState(false);
  const [leaveGroupOpen, setLeaveGroupOpen] = useState(false);
  const [convMenuOpen, setConvMenuOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'for_me' | 'for_everyone' | null>(null);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [favFilter, setFavFilter] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  const logRef = useRef(0);
  const addLog = useCallback((level: 'error' | 'warn' | 'info', message: string, detail?: string) => {
    const id = ++logRef.current;
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    setChatLogs(prev => [...prev.slice(-49), { id, level, message, detail, time }]);
    if (level === 'info') {
      setTimeout(() => setChatLogs(prev => prev.filter(l => l.id !== id)), 5000);
    }
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordCancelRef = useRef(false);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        } else {
          addLog('error', 'Failed to load profile', `HTTP ${meRes.status}`);
        }
      } catch (e) {
        addLog('error', 'Network error loading profile', e instanceof Error ? e.message : String(e));
      }
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
      } else {
        addLog('error', 'Failed to load conversations', `HTTP ${res.status}`);
      }
    } catch (e) {
      addLog('error', 'Network error loading conversations', e instanceof Error ? e.message : String(e));
    }
  }, [addLog]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?conversation_id=${convId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages((data.messages || []).reverse());
        setChatBan({ banned: data.banned || false, timed_out: data.timed_out || false, timeout_until: data.timeout_until });
      } else {
        const errBody = await res.json().catch(() => ({}));
        addLog('error', 'Failed to load messages', `HTTP ${res.status}: ${errBody.error || 'unknown'}${errBody.detail ? ' — ' + errBody.detail : ''}`);
      }
    } catch (e) {
      addLog('error', 'Network error loading messages', e instanceof Error ? e.message : String(e));
    }
  }, [addLog]);

  useEffect(() => {
    if (activeConvId) fetchMessages(activeConvId);
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConvId) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeConvId);
        fetchConversations();
        fetchTyping(activeConvId);
      }, 15000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConvId, fetchMessages, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshAll = useCallback(() => {
    if (activeConvId) fetchMessages(activeConvId);
    fetchConversations();
  }, [activeConvId, fetchMessages, fetchConversations]);

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        const team = data.team || [];
        setTeamMembers(team.map((m: { id: string; full_name: string }) => ({ id: m.id, full_name: m.full_name })));
      }
    } catch { /* ignore */ }
  };

  const handleNewChat = async (userId?: string) => {
    try {
      if (userId) {
        const res = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'direct', otherUserId: userId }),
        });
        if (res.ok) {
          const data = await res.json();
          await fetchConversations();
          setActiveConvId(data.conversation.id);
        } else {
          const data = await res.json().catch(() => ({}));
          addLog('error', 'Failed to start direct message', data.error || `HTTP ${res.status}`);
        }
      } else if (selectedMembers.length > 0) {
        const res = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'group', memberIds: selectedMembers, name: groupName.trim() || null }),
        });
        if (res.ok) {
          const data = await res.json();
          await fetchConversations();
          setActiveConvId(data.conversation.id);
        } else {
          const data = await res.json().catch(() => ({}));
          addLog('error', 'Failed to create group chat', data.error || `HTTP ${res.status}`);
        }
      }
      setNewChatOpen(false);
      setSearchMembers('');
      setSelectedMembers([]);
      setGroupName('');
    } catch (e) {
      addLog('error', 'Failed to create chat', e instanceof Error ? e.message : String(e));
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const handleRename = async () => {
    if (!activeConvId || !renameValue.trim() || renaming) return;
    setRenaming(true);
    setRenameError('');
    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        await fetchConversations();
        setRenameOpen(false);
        setRenameValue('');
        setRenameError('');
      } else {
        const data = await res.json().catch(() => ({}));
        setRenameError(data.error || 'Rename failed');
      }
    } catch (e) {
      setRenameError('Network error');
      addLog('error', 'Network error renaming', e instanceof Error ? e.message : String(e));
    }
    setRenaming(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvId || sending) return;
    const content = newMessage.trim();
    const replyToId = replyTo?.id || null;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId, conversation_id: activeConvId, user_id: profile?.id || '', content, message_type: 'text',
      created_at: new Date().toISOString(), profiles: { full_name: profile?.full_name || 'You' },
      reactions: [], reply_to_id: replyToId,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, user_id: replyTo.user_id, full_name: replyTo.profiles?.full_name || 'Unknown', message_type: replyTo.message_type, file_url: replyTo.file_url } : null,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setReplyTo(null);
    setSending(true);
    try {
      const body: Record<string, unknown> = { conversation_id: activeConvId, content, message_type: 'text' };
      if (replyToId) body.reply_to_id = replyToId;
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const msgData = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: msgData.message.id } : m));
        fetchConversations();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessages(prev => prev.filter(m => m.id !== tempId));
        addLog('error', 'Message failed to send', `HTTP ${res.status}: ${data.error || 'unknown'}${data.detail ? ' — ' + data.detail : ''}`);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      addLog('error', 'Oh no! Seems like you hit an ultra rare error. Try again later.', 'Network error');
    }
    setSending(false);
  };

  const handleEditMessage = async (msgId: string) => {
    if (!editContent.trim()) return;
    const newContent = editContent.trim();
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: newContent } : m));
    setEditingMsgId(null);
    setEditContent('');
    try {
      const res = await fetch(`/api/chat/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        addLog('error', 'Edit failed', `${errBody.error || `HTTP ${res.status}`}${errBody.detail ? ' — ' + errBody.detail : ''}`);
        refreshAll();
      }
    } catch (e) {
      addLog('error', 'Edit failed — network error', e instanceof Error ? e.message : String(e));
      refreshAll();
    }
  };

  const handleDeleteMessage = async (msgId: string, mode: 'for_me' | 'for_everyone') => {
    try {
      if (mode === 'for_me') {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        setDeletingMsgId(null);
        setDeleteMode(null);
        setDeleteConfirmChecked(false);
        const res = await fetch(`/api/chat/messages/${msgId}`, { method: 'POST' });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          addLog('error', 'Delete for me failed', `${errBody.error || `HTTP ${res.status}`}${errBody.detail ? ' — ' + errBody.detail : ''}`);
          refreshAll();
        }
      } else {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        setDeletingMsgId(null);
        setDeleteMode(null);
        setDeleteConfirmChecked(false);
        const res = await fetch(`/api/chat/messages/${msgId}`, { method: 'DELETE' });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          addLog('error', 'Delete for everyone failed', `${errBody.error || `HTTP ${res.status}`}${errBody.detail ? ' — ' + errBody.detail : ''}`);
          refreshAll();
        }
      }
    } catch (e) {
      addLog('error', 'Delete failed — network error', e instanceof Error ? e.message : String(e));
      refreshAll();
    }
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
      } else {
        const data = await res.json().catch(() => ({}));
        addLog('error', 'File upload failed', data.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      addLog('error', 'Network error during upload', e instanceof Error ? e.message : String(e));
    }
    setUploading(false);
    return null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;
    const isVideo = file.type.startsWith('video/');
    const upload = await uploadFile(file);
    if (upload) {
      const msgType = isVideo ? 'video' : 'image';
      const body: Record<string, unknown> = { conversation_id: activeConvId, content: file.name, message_type: msgType, file_url: upload.url, file_name: upload.name, file_size: upload.size };
      if (replyTo) { body.reply_to_id = replyTo.id; setReplyTo(null); }
      await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      refreshAll();
    }
    setUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;
    const upload = await uploadFile(file);
    if (upload) {
      const body: Record<string, unknown> = { conversation_id: activeConvId, content: file.name, message_type: 'file', file_url: upload.url, file_name: upload.name, file_size: upload.size };
      if (replyTo) { body.reply_to_id = replyTo.id; setReplyTo(null); }
      await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      refreshAll();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 } });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recordCancelRef.current = false;
      setRecordCancelled(false);
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(recordTimerRef.current!);
        if (recordCancelRef.current) {
          setRecording(false);
          setRecordingTime(0);
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const duration = recordingTime;
        setUploading(true);
        try {
          const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
          const formData = new FormData();
          formData.append('file', blob, `voice-${Date.now()}.${ext}`);
          const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
          if (res.ok && activeConvId) {
            const data = await res.json();
            const msgBody: Record<string, unknown> = { conversation_id: activeConvId, content: 'Voice message', message_type: 'voice', file_url: data.url, file_name: data.name, file_size: data.size, duration };
            if (replyTo) { msgBody.reply_to_id = replyTo.id; setReplyTo(null); }
            const msgRes = await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msgBody) });
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              setMessages(prev => [...prev, msgData.message]);
            }
            fetchConversations();
          } else {
            const data = await res.json().catch(() => ({}));
            addLog('error', 'Voice upload failed', `${data.error || `HTTP ${res.status}`}${data.detail ? ' — ' + data.detail : ''}`);
          }
        } catch (e) {
          addLog('error', 'Voice upload failed', e instanceof Error ? e.message : String(e));
        }
        setUploading(false);
        setRecording(false);
        setRecordingTime(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      addLog('error', 'Microphone access denied. Please allow microphone permission in your browser settings.', 'getUserMedia failed');
    }
  };

  const stopRecording = (cancel = false) => {
    recordCancelRef.current = cancel;
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      setRecording(false);
      setRecordingTime(0);
    }
  };

  const handleMicPointerDown = () => { if (!uploading) startRecording(); };
  const handleMicPointerUp = () => { if (recording) stopRecording(recordCancelled); };
  const handleMicPointerLeave = () => { if (recording) setRecordCancelled(true); };

  const formatRecordTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const toggleVoice = (msgId: string, url: string) => {
    if (playingVoice === msgId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingVoice(null);
      setVoiceProgress(0);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.onloadedmetadata = () => { setVoiceDuration(audio.duration); };
    audio.ontimeupdate = () => {
      if (audio.duration) setVoiceProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.onended = () => { setPlayingVoice(null); setVoiceProgress(0); audioRef.current = null; };
    audio.onerror = () => {
      addLog('error', 'Voice playback failed', audio.error?.message || 'Audio format not supported');
      setPlayingVoice(null); setVoiceProgress(0); audioRef.current = null;
    };
    audio.play().catch(e => {
      addLog('error', 'Voice playback failed', e instanceof Error ? e.message : String(e));
    });
    audioRef.current = audio;
    setPlayingVoice(msgId);
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    const msg = messages.find(m => m.id === msgId);
    const hasReacted = msg?.reactions?.some(r => r.emoji === emoji && r.user_id === profile?.id);
    const prevReactions = msg?.reactions ? [...msg.reactions] : [];
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = [...(m.reactions || [])];
      if (hasReacted) {
        return { ...m, reactions: reactions.filter(r => !(r.emoji === emoji && r.user_id === profile?.id)) };
      } else {
        return { ...m, reactions: [...reactions, { emoji, user_id: profile?.id || '' }] };
      }
    }));
    setShowEmojiPicker(null);
    try {
      if (hasReacted) {
        const res = await fetch(`/api/chat/messages/${msgId}/react?emoji=${encodeURIComponent(emoji)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed');
      } else {
        const res = await fetch(`/api/chat/messages/${msgId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });
        if (!res.ok) throw new Error('Failed');
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: prevReactions } : m));
      addLog('error', 'Failed to react', 'Reverted');
    }
  };

  const handleToggleFavorite = async () => {
    if (!activeConvId) return;
    const conv = conversations.find(c => c.id === activeConvId);
    try {
      await fetch(`/api/chat/conversations/${activeConvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !conv?.is_favorited }),
      });
      fetchConversations();
    } catch (e) {
      addLog('error', 'Failed to update favorite', e instanceof Error ? e.message : String(e));
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}/leave`, { method: 'POST' });
      if (res.ok) {
        setActiveConvId(null);
        setLeaveGroupOpen(false);
        fetchConversations();
      } else {
        const data = await res.json().catch(() => ({}));
        addLog('error', 'Failed to leave group', data.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      addLog('error', 'Network error leaving group', e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveConvId(null);
        setDeleteConvOpen(false);
        fetchConversations();
      } else {
        const data = await res.json().catch(() => ({}));
        addLog('error', 'Failed to delete conversation', data.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      addLog('error', 'Network error deleting conversation', e instanceof Error ? e.message : String(e));
    }
  };

  const fetchGroupMembers = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/members`);
      if (res.ok) {
        const data = await res.json();
        setGroupMembers(data.members || []);
      }
    } catch { /* ignore */ }
  };

  const fetchTyping = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/typing?conversation_id=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setTypingUsers(data.typing || []);
      }
    } catch { /* ignore */ }
  };

  const emitTyping = useCallback(async () => {
    if (!activeConvId) return;
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeConvId }),
      });
    } catch { /* ignore */ }
  }, [activeConvId]);

  const handleSearchSidebar = async (q: string) => {
    setSidebarSearch(q);
    if (!q.trim()) { setSidebarSearchResults({ users: [], conversations: [] }); return; }
    setSidebarSearching(true);
    try {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSidebarSearchResults(data);
      }
    } catch { /* ignore */ }
    setSidebarSearching(false);
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
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
      <input type="file" accept="image/*,video/*" ref={imageInputRef} className="hidden" onChange={handleImageUpload} />

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 shrink-0`}>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          {sidebarOpen && <span className="text-white font-bold text-lg tracking-tight">Chat</span>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white ml-auto hover:bg-white/5">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {sidebarOpen && (
          <>
            <div className="p-3 border-b border-white/5 space-y-2">
              <Button onClick={() => { setNewChatOpen(true); fetchTeamMembers(); }} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Chat
              </Button>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search people or chats..."
                  value={sidebarSearch}
                  onChange={(e) => handleSearchSidebar(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {sidebarSearch.trim() ? (
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {sidebarSearching && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>}
                {!sidebarSearching && sidebarSearchResults.users.length === 0 && sidebarSearchResults.conversations.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No results</p>
                )}
                {sidebarSearchResults.users.map(u => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      const res = await fetch('/api/chat/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'direct', otherUserId: u.id }) });
                      if (res.ok) { const data = await res.json(); await fetchConversations(); setActiveConvId(data.conversation.id); }
                      setSidebarSearch('');
                      setSidebarSearchResults({ users: [], conversations: [] });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-slate-300 hover:bg-white/5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {getInitials(u.full_name)}
                    </div>
                    <span className="text-white">{u.full_name}</span>
                  </button>
                ))}
                {sidebarSearchResults.conversations.map(c => (
                  <button key={c.id} onClick={() => { setActiveConvId(c.id); setSidebarSearch(''); setSidebarSearchResults({ users: [], conversations: [] }); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-slate-300 hover:bg-white/5 transition-all">
                    <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-white">{c.name || 'Chat'}</span>
                  </button>
                ))}
              </nav>
            ) : (
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="px-2 pb-2 flex items-center gap-1">
                  <button onClick={() => setFavFilter(!favFilter)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition ${favFilter ? 'bg-yellow-500/15 text-yellow-400' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
                    <Star className={`w-3 h-3 ${favFilter ? 'fill-yellow-400' : ''}`} /> Favorites
                  </button>
                </div>
                {conversations.filter(conv => !favFilter || conv.is_favorited).map((conv) => {
                  const isActive = conv.id === activeConvId;
                  let label: string;
                  if (conv.type === 'public') label = 'Public Chat';
                  else if (conv.type === 'group') label = conv.name || `Group (${(conv.members?.length || 0) + 1})`;
                  else label = conv.name || conv.other_user?.full_name || 'Unknown';
                  const preview = conv.last_message?.content || 'No messages yet';
                  const isImage = conv.last_message?.message_type === 'image';
                  const isFile = conv.last_message?.message_type === 'file';
                  const isVoice = conv.last_message?.message_type === 'voice';
                  const isVideo = conv.last_message?.message_type === 'video';
                  return (
                    <button key={conv.id} onClick={() => setActiveConvId(conv.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 text-left ${isActive ? 'bg-cyan-500/15 text-cyan-400 shadow-sm shadow-cyan-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${conv.type === 'public' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : conv.type === 'group' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                        {conv.type === 'public' ? <Hash className="w-4 h-4" /> : conv.type === 'group' ? <Users className="w-4 h-4" /> : getInitials(label)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate flex items-center gap-1.5">
                            {conv.is_favorited && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                            {label}
                          </span>
                          {conv.last_message && <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{formatTime(conv.last_message.created_at)}</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{isImage ? '🖼 Image' : isVideo ? '🎬 Video' : isFile ? '📎 File' : isVoice ? '🎤 Voice' : preview}</p>
                      </div>
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
            )}
          </>
        )}

        <div className="p-2 border-t border-white/5 space-y-1">
          <Link href="/"><Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"><Home className="w-5 h-5 shrink-0" />{sidebarOpen && <span className="ml-3">Home</span>}</Button></Link>
          <Link href="/dashboard"><Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"><User className="w-5 h-5 shrink-0" />{sidebarOpen && <span className="ml-3">Dashboard</span>}</Button></Link>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"><LogOut className="w-5 h-5 shrink-0" />{sidebarOpen && <span className="ml-3">Logout</span>}</Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {activeConvId ? (
          <>
            {/* Chat Header */}
            <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${activeConv?.type === 'public' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : activeConv?.type === 'group' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                  {activeConv?.type === 'public' ? <Hash className="w-4 h-4" /> : activeConv?.type === 'group' ? <Users className="w-4 h-4" /> : getInitials(activeConv?.name || activeConv?.other_user?.full_name || '')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-white font-bold tracking-tight truncate">
                      {activeConv?.type === 'public' ? 'Public Chat' : activeConv?.type === 'group' ? (activeConv?.name || 'Group Chat') : activeConv?.name || activeConv?.other_user?.full_name || 'Chat'}
                    </h1>
                    {activeConv?.type !== 'public' && (
                      <button onClick={() => { setRenameOpen(true); setRenameValue(activeConv?.name || ''); setRenameError(''); }} className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0" title="Rename">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {typingUsers.length > 0 && (
                    <p className="text-xs text-cyan-400 animate-pulse">{typingUsers.map(t => t.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</p>
                  )}
                  {typingUsers.length === 0 && activeConv?.type === 'group' && activeConv?.members && (
                    <p className="text-xs text-slate-400">{activeConv.members.length + 1} members</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {chatLogs.filter(l => l.level === 'error').length > 0 && (
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 relative" onClick={() => setDebugOpen(!debugOpen)} title="View error logs">
                    <AlertCircle className="w-5 h-5" />
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">{Math.min(chatLogs.filter(l => l.level === 'error').length, 9)}</span>
                  </Button>
                )}
                {activeConv?.type === 'group' && (
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={() => { setMembersPanelOpen(!membersPanelOpen); if (!membersPanelOpen) fetchGroupMembers(activeConvId); }} title="Members">
                    <Users className="w-5 h-5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className={`${activeConv?.is_favorited ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-400 hover:text-white'} hover:bg-white/5`} onClick={handleToggleFavorite} title={activeConv?.is_favorited ? 'Unfavorite' : 'Favorite'}>
                  <Star className={`w-5 h-5 ${activeConv?.is_favorited ? 'fill-yellow-400' : ''}`} />
                </Button>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={() => setConvMenuOpen(!convMenuOpen)}>
                    <ChevronDown className="w-5 h-5" />
                  </Button>
                  {convMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setConvMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl py-1 min-w-[180px] opacity-100">
                        {activeConv?.type !== 'public' && (
                          <button onClick={() => { setConvMenuOpen(false); setRenameOpen(true); setRenameValue(activeConv?.name || ''); }} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 text-left flex items-center gap-2">
                            <Pencil className="w-4 h-4" /> Rename
                          </button>
                        )}
                        {activeConv?.type === 'group' && (
                          <button onClick={() => { setConvMenuOpen(false); setLeaveGroupOpen(true); }} className="w-full px-4 py-2.5 text-sm text-yellow-400 hover:bg-white/5 text-left flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Leave Group
                          </button>
                        )}
                        {activeConv?.type !== 'public' && profile?.role === 'admin' && (
                          <button onClick={() => { setConvMenuOpen(false); setDeleteConvOpen(true); }} className="w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 text-left flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Delete Chat
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-1 min-w-0">
                {chatBan.banned ? (
                  <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"><XIcon className="w-8 h-8 text-red-400" /></div>
                      <p className="text-red-400 font-medium text-lg">You are banned from chat</p>
                      <p className="text-slate-400 text-sm mt-2">Contact an admin for more information.</p>
                    </CardContent>
                  </Card>
                ) : chatBan.timed_out ? (
                  <Card className="bg-yellow-500/10 backdrop-blur-xl border-yellow-500/20">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4"><MicOff className="w-8 h-8 text-yellow-400" /></div>
                      <p className="text-yellow-400 font-medium text-lg">You are timed out</p>
                      <p className="text-slate-400 text-sm mt-2">Until {chatBan.timeout_until ? new Date(chatBan.timeout_until).toLocaleString() : 'unknown time'}</p>
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
                    {messages.map((msg, idx) => {
                      const isOwn = msg.user_id === profile?.id;
                      const isEditing = editingMsgId === msg.id;
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000);
                      const groupedReactions = (msg.reactions || []).reduce<Record<string, { count: number; reacted: boolean }>>((acc, r) => {
                        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, reacted: false };
                        acc[r.emoji].count++;
                        if (r.user_id === profile?.id) acc[r.emoji].reacted = true;
                        return acc;
                      }, {});
                      return (
                        <div key={msg.id} className={`flex gap-3 group relative ${isOwn ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                          <div className="w-9 shrink-0">{showHeader && (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-cyan-500/10">
                              {getInitials(msg.profiles?.full_name || '?')}
                            </div>
                          )}</div>
                          <div className={`max-w-[70%] min-w-0 ${isOwn ? 'items-end' : ''}`}>
                            {showHeader && (
                              <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                                <span className="text-xs font-medium text-white">{msg.profiles?.full_name || 'Unknown'}</span>
                                <span className="text-[10px] text-slate-500">{formatRelative(msg.created_at)}</span>
                              </div>
                            )}
                            {msg.reply_to && (
                              <div className={`text-xs text-slate-500 mb-1 flex items-center gap-1.5 ${isOwn ? 'justify-end' : ''}`}>
                                <Reply className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  <span className="text-slate-400 font-medium">{msg.reply_to.full_name || 'Unknown'}</span>: {msg.reply_to.message_type === 'voice' ? '🎤 Voice message' : msg.reply_to.message_type === 'image' ? '🖼 Image' : msg.reply_to.message_type === 'video' ? '🎬 Video' : msg.reply_to.message_type === 'file' ? `📎 ${msg.reply_to.content || 'File'}` : (msg.reply_to.content || '...')}
                                </span>
                              </div>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 relative ${isOwn ? 'bg-cyan-600/20 border border-cyan-500/20' : 'bg-white/5 border border-white/10'}`}>
                              {isOwn && !isEditing && (
                                <div className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-0.5 bg-slate-800 border border-white/10 rounded-lg px-1 py-0.5 shadow-lg z-10">
                                  <button onClick={() => setReplyTo(msg)} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors" title="Reply"><Reply className="w-3 h-3" /></button>
                                  {msg.message_type === 'text' && <button onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content); }} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors" title="Edit"><Pencil className="w-3 h-3" /></button>}
                                  <button onClick={() => setDeletingMsgId(msg.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              )}
                              {!isOwn && (
                                <div className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-0.5 bg-slate-800 border border-white/10 rounded-lg px-1 py-0.5 shadow-lg z-10">
                                  <button onClick={() => setReplyTo(msg)} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors" title="Reply"><Reply className="w-3 h-3" /></button>
                                  {profile?.role === 'admin' && (
                                    <button onClick={() => setDeletingMsgId(msg.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                  )}
                                </div>
                              )}
                              {msg.message_type === 'image' && msg.file_url && (
                                <div className="mb-2">
                                  <img src={msg.file_url} alt={msg.file_name || 'Image'} className="rounded-xl max-w-full max-h-64 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setExpandedImage(msg.file_url!)} loading="lazy" />
                                </div>
                              )}
                              {msg.message_type === 'video' && msg.file_url && (
                                <div className="mb-2">
                                  <video src={msg.file_url} controls className="rounded-xl max-w-full max-h-64" preload="metadata" />
                                </div>
                              )}
                              {msg.message_type === 'file' && msg.file_url && (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-1">
                                  <File className="w-5 h-5" /><span className="truncate">{msg.file_name || 'File'}</span><Download className="w-4 h-4 shrink-0" />
                                </a>
                              )}
                              {msg.message_type === 'voice' && msg.file_url && (
                                <div className="flex items-center gap-2 min-w-[200px]">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10" onClick={() => toggleVoice(msg.id, msg.file_url!)}>
                                    {playingVoice === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                  </Button>
                                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400/50 rounded-full transition-all duration-200" style={{ width: playingVoice === msg.id ? `${voiceProgress}%` : '0%' }} />
                                  </div>
                                  {msg.duration != null && <span className="text-xs text-slate-500 shrink-0">{formatDuration(msg.duration)}</span>}
                                </div>
                              )}
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditMessage(msg.id); } if (e.key === 'Escape') { setEditingMsgId(null); setEditContent(''); } }} className="bg-white/5 border-white/20 text-white text-sm h-8" autoFocus />
                                  <Button size="icon" className="h-8 w-8 bg-cyan-600 hover:bg-cyan-700 text-white shrink-0" onClick={() => handleEditMessage(msg.id)}><Check className="w-4 h-4" /></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white shrink-0" onClick={() => { setEditingMsgId(null); setEditContent(''); }}><XIcon className="w-4 h-4" /></Button>
                                </div>
                              ) : (
                                <>
                                  {msg.message_type === 'text' && msg.content && <p className="text-sm text-slate-200 whitespace-pre-wrap">{msg.content}</p>}
                                </>
                              )}
                            </div>
                            {/* Reactions */}
                            {Object.keys(groupedReactions).length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                {Object.entries(groupedReactions).map(([emoji, { count, reacted }]) => (
                                  <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${reacted ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                    <span>{emoji}</span><span>{count}</span>
                                  </button>
                                ))}
                                <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="flex items-center px-1.5 py-0.5 rounded-full text-xs border border-white/10 text-slate-500 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100">
                                  <Smile className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {Object.keys(groupedReactions).length === 0 && (
                              <div className={`flex gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                {QUICK_REACTIONS.slice(0, 3).map(emoji => (
                                  <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className="px-1.5 py-0.5 rounded-full text-xs border border-white/10 text-slate-500 hover:bg-white/5 transition-all">
                                    {emoji}
                                  </button>
                                ))}
                                <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="px-1.5 py-0.5 rounded-full text-xs border border-white/10 text-slate-500 hover:bg-white/5 transition-all">
                                  <Smile className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {showEmojiPicker === msg.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(null)} />
                                <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-1 z-40 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2`}>
                                  <div className="grid grid-cols-7 gap-1">
                                    {EMOJI_LIST.map(emoji => (
                                      <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-lg transition-colors">
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Members Panel */}
              {membersPanelOpen && activeConv?.type === 'group' && (
                <div className="w-60 border-l border-white/10 bg-slate-900/40 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-white font-bold text-sm">Members</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => setMembersPanelOpen(false)}>
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {groupMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {getInitials(m.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate flex items-center gap-1">
                            {m.full_name}
                            {m.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                          </p>
                          {m.member_id && <p className="text-[10px] text-slate-500">{m.member_id}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div className="border-t border-white/5 bg-slate-900/60 backdrop-blur-xl px-6 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs text-cyan-400 font-medium">{replyTo.profiles?.full_name || 'Unknown'}</span>
                    <p className="text-xs text-slate-400 truncate">{replyTo.content || (replyTo.message_type === 'image' ? '🖼 Image' : replyTo.message_type === 'video' ? '🎬 Video' : replyTo.message_type === 'file' ? '📎 File' : replyTo.message_type === 'voice' ? '🎤 Voice' : '...')}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white shrink-0" onClick={() => setReplyTo(null)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Input Area */}
            {!chatBan.banned && !chatBan.timed_out && (
              <div className="border-t border-white/5 bg-slate-900/40 backdrop-blur-xl p-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
                    <Image className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <File className="w-5 h-5" />
                  </Button>
                  <Button ref={micButtonRef} variant="ghost" size="icon" className={`hover:bg-white/5 ${recording ? (recordCancelled ? 'text-yellow-400 hover:text-yellow-300' : 'text-red-400 hover:text-red-300') : 'text-slate-400 hover:text-white'}`} onPointerDown={handleMicPointerDown} onPointerUp={handleMicPointerUp} onPointerLeave={handleMicPointerLeave} disabled={uploading}>
                    {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <Input
                    placeholder={replyTo ? `Reply to ${replyTo.profiles?.full_name || 'Unknown'}...` : 'Type a message...'}
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); emitTyping(); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = setTimeout(() => {}, 3000); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === 'Escape' && replyTo) setReplyTo(null); }}
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    disabled={sending || uploading}
                  />
                  <Button onClick={handleSend} disabled={!newMessage.trim() || sending || uploading} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
                {(uploading || recording) && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{recording ? (recordCancelled ? 'Release to cancel' : 'Recording...') : 'Uploading...'}</span>
                    {recording && <><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="font-mono text-red-400">{formatRecordTime(recordingTime)}</span></>}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Straw Hats Chat</h2>
              <p className="text-slate-400 text-sm max-w-xs">Select a conversation from the sidebar or start a new chat.</p>
            </div>
          </div>
        )}
      </main>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={(open) => { setNewChatOpen(open); if (!open) { setSearchMembers(''); setSelectedMembers([]); setGroupName(''); } }}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Start a New Chat</DialogTitle>
            <DialogDescription className="text-slate-400">Select one person for a direct message, or multiple for a group chat.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedMembers.length >= 2 && <Input placeholder="Group name (optional)" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-white/5 border-white/10 text-white" />}
            <Input placeholder="Search members..." value={searchMembers} onChange={(e) => setSearchMembers(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            {selectedMembers.length > 0 && <div className="flex items-center gap-2 text-xs text-slate-400"><span>{selectedMembers.length} selected</span><button onClick={() => setSelectedMembers([])} className="text-cyan-400 hover:text-cyan-300">Clear</button></div>}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredMembers.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No members found</p>}
              {filteredMembers.map((m) => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleMemberSelection(m.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${isSelected ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-300 hover:bg-white/5'}`}>
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-white/20 bg-white/5'}`}>{isSelected && <Check className="w-3.5 h-3.5 text-white" />}</div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">{getInitials(m.full_name)}</div>
                    <span className="text-white">{m.full_name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setNewChatOpen(false); setSearchMembers(''); setSelectedMembers([]); setGroupName(''); }} className="text-slate-400 hover:text-white hover:bg-white/5">Cancel</Button>
            {selectedMembers.length === 1 ? (
              <Button onClick={() => handleNewChat(selectedMembers[0])} className="bg-cyan-600 hover:bg-cyan-700 text-white"><MessageSquare className="w-4 h-4 mr-2" /> Send Message</Button>
            ) : selectedMembers.length >= 2 ? (
              <Button onClick={() => handleNewChat()} className="bg-amber-600 hover:bg-amber-700 text-white"><Users className="w-4 h-4 mr-2" /> Create Group</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={(open) => { setRenameOpen(open); if (!open) { setRenameValue(''); setRenameError(''); } }}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Rename Conversation</DialogTitle>
            <DialogDescription className="text-slate-400">{activeConv?.type === 'group' ? 'Give this group a custom name.' : 'Give this chat a nickname.'}</DialogDescription>
          </DialogHeader>
          <Input placeholder={activeConv?.type === 'group' ? 'Group name' : 'Nickname'} value={renameValue} onChange={(e) => { setRenameValue(e.target.value); setRenameError(''); }} onKeyDown={(e) => { if (e.key === 'Enter' && renameValue.trim()) handleRename(); }} className="bg-white/5 border-white/10 text-white" autoFocus />
          {renameError && <p className="text-red-400 text-sm">{renameError}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRenameOpen(false); setRenameValue(''); setRenameError(''); }} className="text-slate-400 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim() || renaming} className="bg-cyan-600 hover:bg-cyan-700 text-white">{renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rename'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Message Dialog */}
      <Dialog open={!!deletingMsgId} onOpenChange={(open) => { if (!open) { setDeletingMsgId(null); setDeleteMode(null); setDeleteConfirmChecked(false); } }}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          {!deleteMode ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Delete Message</DialogTitle>
                <DialogDescription className="text-slate-400">How do you want to delete this message?</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <button onClick={() => setDeleteMode('for_me')} className="w-full text-left p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition text-white text-sm">Delete for me only</button>
                {profile?.role === 'admin' && (
                  <button onClick={() => setDeleteMode('for_everyone')} className="w-full text-left p-3 rounded-lg bg-red-900/30 hover:bg-red-900/50 transition text-red-400 text-sm">Delete for everyone (admin)</button>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => { setDeletingMsgId(null); setDeleteMode(null); }} className="text-slate-400 hover:text-white hover:bg-white/5">Cancel</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">
                  {deleteMode === 'for_me' ? 'Delete for me only?' : 'Delete for everyone?'}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {deleteMode === 'for_me'
                    ? 'This message will be hidden from you only. Others will still see it.'
                    : 'This will permanently delete the message for everyone. This cannot be undone.'}
                </DialogDescription>
              </DialogHeader>
              {deleteMode === 'for_me' && (
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deleteConfirmChecked}
                    onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                    className="rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  I understand this only hides the message from me
                </label>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => { setDeleteMode(null); setDeleteConfirmChecked(false); }} className="text-slate-400 hover:text-white hover:bg-white/5">Back</Button>
                <Button
                  onClick={() => deletingMsgId && handleDeleteMessage(deletingMsgId, deleteMode)}
                  disabled={deleteMode === 'for_me' && !deleteConfirmChecked}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Conversation Dialog (admin only) */}
      {profile?.role === 'admin' && (
        <Dialog open={deleteConvOpen} onOpenChange={setDeleteConvOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Conversation</DialogTitle>
              <DialogDescription className="text-slate-400">This will permanently delete this conversation and all its messages for everyone. This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteConvOpen(false)} className="text-slate-400 hover:text-white hover:bg-white/5">Cancel</Button>
              <Button onClick={handleDeleteConversation} className="bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Leave Group Dialog */}
      <Dialog open={leaveGroupOpen} onOpenChange={setLeaveGroupOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Leave Group</DialogTitle>
            <DialogDescription className="text-slate-400">Are you sure you want to leave this group? You won&apos;t be able to see messages unless someone adds you back.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeaveGroupOpen(false)} className="text-slate-400 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={handleLeaveGroup} className="bg-yellow-600 hover:bg-yellow-700 text-white"><LogOut className="w-4 h-4 mr-2" /> Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debug Log Panel */}
      <Dialog open={debugOpen} onOpenChange={setDebugOpen}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> Error Logs
              {chatLogs.filter(l => l.level === 'error').length > 0 && (
                <Badge variant="destructive" className="ml-2">{chatLogs.filter(l => l.level === 'error').length}</Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Recent errors from the chat system. Share this info when reporting bugs.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {chatLogs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No errors logged</p>
            ) : (
              chatLogs.slice().reverse().map(log => (
                <div key={log.id} className={`p-3 rounded-lg border text-sm ${log.level === 'error' ? 'bg-red-500/5 border-red-500/20' : log.level === 'warn' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-cyan-400'}`}>{log.message}</p>
                      {log.detail && <p className="text-slate-400 text-xs mt-1 break-all font-mono">{log.detail}</p>}
                      <p className="text-slate-600 text-[10px] mt-1">{log.time}</p>
                    </div>
                    <button onClick={() => setChatLogs(prev => prev.filter(l => l.id !== log.id))} className="text-slate-500 hover:text-white transition-colors shrink-0">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(chatLogs.map(l => `[${l.time}] ${l.level.toUpperCase()}: ${l.message}${l.detail ? ' — ' + l.detail : ''}`).join('\n')); }} className="text-slate-400 hover:text-white text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Copy Logs
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setChatLogs([])} className="text-slate-400 hover:text-white text-xs">
              Clear All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Image Dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl p-2">
          {expandedImage && <img src={expandedImage} alt="Expanded" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Error Log Toasts + Debug Panel */}
      {chatLogs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 max-w-sm pointer-events-none">
          {chatLogs.filter(l => l.level !== 'info').slice(-5).map((log) => (
            <div key={log.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 fade-in duration-300 ${log.level === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'}`}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{log.message}</p>
                {log.detail && <p className="text-xs opacity-60 mt-0.5 break-all">{log.detail}</p>}
                <p className="text-[10px] opacity-40 mt-1">{log.time}</p>
              </div>
              <button onClick={() => setChatLogs(prev => prev.filter(l => l.id !== log.id))} className="text-current opacity-40 hover:opacity-100 transition-opacity shrink-0"><XIcon className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
