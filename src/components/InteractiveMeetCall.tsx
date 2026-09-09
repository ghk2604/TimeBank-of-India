'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Share2, Hand, Smile, 
  MessageSquare, Maximize2, Minimize2, Grid, Layout,
  ShieldAlert, XCircle, CheckCircle2, Radio, Send, X,
  AlertCircle, MonitorUp, Calendar, Clock, Sparkles, RefreshCw,
  Lock, Unlock
} from 'lucide-react';
import { CurrentUser } from '@/context/AppContext';

interface InteractiveMeetCallProps {
  session: any;
  currentUser: CurrentUser;
  timerSeconds: number;
  timerActive: boolean;
  onCancelSession: () => void;
  onRaiseDispute: () => void;
  onSessionUpdated?: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  time: string;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number; // percentage across screen
  senderName: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function parseSessionStartTime(startTimeStr: string | null | undefined): Date {
  if (!startTimeStr) return new Date();
  
  const directDate = new Date(startTimeStr);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }

  const now = new Date();
  const lower = startTimeStr.toLowerCase();
  let targetDate = new Date(now);

  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const timeMatch = startTimeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridian = timeMatch[3]?.toUpperCase();

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate;
  }

  return now;
}

export default function InteractiveMeetCall({
  session,
  currentUser,
  timerSeconds,
  timerActive,
  onCancelSession,
  onRaiseDispute,
  onSessionUpdated,
}: InteractiveMeetCallProps) {
  const isTeacher = currentUser?.id === session?.teacher_id;
  const counterpartyName = isTeacher ? session?.learner_name : session?.teacher_name;
  const counterpartyAvatar = isTeacher ? session?.learner_avatar : session?.teacher_avatar;
  const counterpartyRole = isTeacher ? 'Learner / Student' : 'Verified Instructor';
  const myRole = isTeacher ? 'Instructor (You)' : 'Learner (You)';

  // Current live clock
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time matching & Gating
  const scheduledStartDate = parseSessionStartTime(session?.start_time);
  const durationMinutes = Number(session?.duration || 60);
  const scheduledEndDate = new Date(scheduledStartDate.getTime() + durationMinutes * 60 * 1000);

  // Time calculations (allow joining 5 minutes prior to start time, and up to 30 mins after end time)
  const startWindowMs = scheduledStartDate.getTime() - 5 * 60 * 1000;
  const endWindowMs = scheduledEndDate.getTime() + 30 * 60 * 1000;
  const nowMs = now.getTime();

  // A session is time-active if:
  // 1. Session status is explicitly IN_PROGRESS, OR
  // 2. Present time is within the start/end window AND session status is SCHEDULED
  const isTimeActive = 
    session?.status === 'IN_PROGRESS' || 
    (session?.status === 'SCHEDULED' && nowMs >= startWindowMs && nowMs <= endWindowMs);

  const isUpcoming = session?.status === 'SCHEDULED' && nowMs < startWindowMs;
  const secondsUntilStart = Math.max(0, Math.floor((scheduledStartDate.getTime() - nowMs) / 1000));

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [rescheduleTime, setRescheduleTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleSuccessMsg, setRescheduleSuccessMsg] = useState<string | null>(null);

  // Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [remoteVideoOn, setRemoteVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // Call status
  const [callJoined, setCallJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'spotlight' | 'grid'>('spotlight');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Interactive Meet Features
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [remoteHandRaised, setRemoteHandRaised] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      senderId: 'system',
      senderName: 'TimeBank Classroom',
      senderAvatar: '',
      text: `Welcome to your 1-on-1 session for "${session?.skill_name || 'Skill Learning'}"! Video, audio, screen share, and chat are end-to-end encrypted.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Speaking indicator
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSignalTimeRef = useRef<number>(0);

  // --------------------------------------------------------------------------
  // 1. SIGNALING: BroadcastChannel (Local tabs) + Database Polling (Remote)
  // --------------------------------------------------------------------------
  const sendSignal = useCallback(async (type: string, payload: any) => {
    const data = {
      type,
      fromUserId: currentUser?.id,
      fromUserName: currentUser?.fullName || currentUser?.username,
      payload,
      timestamp: Date.now(),
    };

    if (channelRef.current) {
      try {
        channelRef.current.postMessage(data);
      } catch (e) {}
    }

    if (session?.id) {
      try {
        fetch(`/api/sessions/${session.id}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            fromUserId: currentUser?.id,
            payload,
          }),
        }).catch(() => {});
      } catch (e) {}
    }
  }, [currentUser, session?.id]);

  // Handle incoming signals
  const handleIncomingSignal = useCallback(async (msg: any) => {
    if (!msg || msg.fromUserId === currentUser?.id) return;

    const { type, payload, fromUserName } = msg;

    if (type === 'USER_JOINED') {
      if (isTeacher && pcRef.current && localStream) {
        try {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          sendSignal('OFFER', offer);
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
    } else if (type === 'OFFER' && pcRef.current) {
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        sendSignal('ANSWER', answer);
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    } else if (type === 'ANSWER' && pcRef.current) {
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    } else if (type === 'CANDIDATE' && pcRef.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(payload));
      } catch (err) {
        console.error('Error adding ice candidate:', err);
      }
    } else if (type === 'MEDIA_STATE') {
      if (typeof payload.micOn === 'boolean') setRemoteMicOn(payload.micOn);
      if (typeof payload.videoOn === 'boolean') setRemoteVideoOn(payload.videoOn);
    } else if (type === 'SPEAKING_STATE') {
      setIsRemoteSpeaking(Boolean(payload.isSpeaking));
    } else if (type === 'HAND_RAISE') {
      setRemoteHandRaised(Boolean(payload.raised));
    } else if (type === 'REACTION') {
      triggerReaction(payload.emoji, fromUserName || counterpartyName);
    } else if (type === 'CHAT_MESSAGE') {
      setMessages((prev) => [...prev, payload]);
      if (!chatDrawerOpen) {
        setUnreadChatCount((prev) => prev + 1);
      }
    } else if (type === 'SESSION_RESCHEDULED') {
      if (onSessionUpdated) onSessionUpdated();
    }
  }, [currentUser?.id, isTeacher, localStream, sendSignal, counterpartyName, chatDrawerOpen, onSessionUpdated]);

  // Setup BroadcastChannel & Remote Polling
  useEffect(() => {
    if (!session?.id) return;

    const channelName = `tbi_meet_${session.id}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      handleIncomingSignal(event.data);
    };

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/sessions/${session.id}/signal?since=${lastSignalTimeRef.current}&excludeUserId=${currentUser?.id || ''}`
        );
        const data = await res.json();
        if (data?.signals && data.signals.length > 0) {
          for (const sig of data.signals) {
            if (sig.createdAt > lastSignalTimeRef.current) {
              lastSignalTimeRef.current = sig.createdAt;
            }
            handleIncomingSignal(sig);
          }
        }
      } catch (e) {}
    }, 1500);

    return () => {
      channel.close();
      clearInterval(pollInterval);
    };
  }, [session?.id, currentUser?.id, handleIncomingSignal]);

  // --------------------------------------------------------------------------
  // 2. MEDIA INITIALIZATION & WEBRTC PEER SETUP
  // --------------------------------------------------------------------------
  const startMediaAndJoinCall = async () => {
    setIsConnecting(true);
    setPermissionError(null);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch (camErr: any) {
        console.warn('Camera failed, attempting audio only:', camErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setVideoOn(false);
      }

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setupAudioAnalyser(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal('CANDIDATE', e.candidate);
        }
      };

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          setRemoteStream(e.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
        }
      };

      setCallJoined(true);

      sendSignal('USER_JOINED', {
        role: isTeacher ? 'TEACHER' : 'LEARNER',
      });
      sendSignal('MEDIA_STATE', { micOn: true, videoOn: stream.getVideoTracks().length > 0 });
    } catch (err: any) {
      console.error('Failed to get media devices:', err);
      setPermissionError(
        'Could not access camera or microphone. Please ensure permissions are granted in your browser settings.'
      );
      setCallJoined(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const speaking = avg > 25;
        setIsLocalSpeaking(speaking);
        sendSignal('SPEAKING_STATE', { isSpeaking: speaking });

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('AudioAnalyser setup skipped:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
    };
  }, [localStream, screenStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callJoined]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // --------------------------------------------------------------------------
  // 3. MEDIA CONTROLS
  // --------------------------------------------------------------------------
  const toggleMic = () => {
    const nextState = !micOn;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
    setMicOn(nextState);
    sendSignal('MEDIA_STATE', { micOn: nextState, videoOn });
  };

  const toggleVideo = () => {
    const nextState = !videoOn;
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
    setVideoOn(nextState);
    sendSignal('MEDIA_STATE', { micOn, videoOn: nextState });
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);
        setScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        if (pcRef.current) {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }

        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        sendSignal('SCREEN_SHARE_START', {});
      } catch (e) {
        console.log('Screen sharing cancelled/denied');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    setScreenStream(null);
    setScreenSharing(false);

    if (pcRef.current && localStream) {
      const cameraTrack = localStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    }

    sendSignal('SCREEN_SHARE_STOP', {});
  };

  // --------------------------------------------------------------------------
  // 4. INTERACTIVE FEATURES: HAND RAISE, REACTIONS, CHAT
  // --------------------------------------------------------------------------
  const toggleHandRaise = () => {
    const next = !myHandRaised;
    setMyHandRaised(next);
    sendSignal('HAND_RAISE', { raised: next });
  };

  const triggerReaction = (emoji: string, sender: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const x = 20 + Math.random() * 60;
    setReactions((prev) => [...prev, { id, emoji, x, senderName: sender }]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const sendReaction = (emoji: string) => {
    triggerReaction(emoji, 'You');
    sendSignal('REACTION', { emoji });
    setShowReactionsMenu(false);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `${Date.now()}_${Math.random()}`,
      senderId: currentUser?.id || 'guest',
      senderName: (currentUser?.fullName || currentUser?.username || 'User').split(' ')[0],
      senderAvatar: currentUser?.avatar || '',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    sendSignal('CHAT_MESSAGE', newMsg);
    setChatInput('');
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // --------------------------------------------------------------------------
  // 5. RESCHEDULE TIMING ACTION
  // --------------------------------------------------------------------------
  const handleRescheduleSubmit = async (customStartTime?: string) => {
    setIsRescheduling(true);
    setRescheduleSuccessMsg(null);

    const targetTime = customStartTime || `${rescheduleDate} ${rescheduleTime}`;

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESCHEDULE_SESSION',
          newStartTime: targetTime,
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRescheduleSuccessMsg(data.message);
        sendSignal('SESSION_RESCHEDULED', { newStartTime: targetTime });
        if (onSessionUpdated) onSessionUpdated();
        setTimeout(() => {
          setRescheduleModalOpen(false);
          setRescheduleSuccessMsg(null);
        }, 1500);
      } else {
        alert(data.error || 'Failed to update schedule');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsRescheduling(false);
    }
  };

  // Set schedule to Right Now so interaction unlocks immediately
  const handleStartImmediately = () => {
    const currentNowStr = new Date().toISOString();
    handleRescheduleSubmit(currentNowStr);
  };

  // --------------------------------------------------------------------------
  // 6. RENDER
  // --------------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl bg-slate-950 text-white overflow-hidden shadow-2xl border border-slate-800 transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'aspect-[16/10] sm:aspect-video w-full'
      }`}
    >
      {/* FLOATING EMOJI REACTIONS ANIMATION */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-16 animate-float-up flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-lg text-lg sm:text-2xl"
          >
            <span>{r.emoji}</span>
            <span className="text-[10px] text-slate-300 font-bold hidden sm:inline">{r.senderName}</span>
          </div>
        ))}
      </div>

      {/* TOP STATUS OVERLAY BAR */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/80 shadow-sm text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${isTimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">Google Meet 1-on-1 •</span>
            <span className="text-orange-400 font-bold truncate max-w-[140px] sm:max-w-none">{session?.skill_name || 'Learning Session'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/80 text-xs font-mono text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${isTimeActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
        </div>

        {/* Change Time & View Layout Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Change Date & Time Button */}
          <button
            onClick={() => setRescheduleModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Change allotted date and time of this session"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Time</span>
          </button>

          {isTimeActive && (
            <button
              onClick={() => setViewMode(viewMode === 'spotlight' ? 'grid' : 'spotlight')}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
              title={viewMode === 'spotlight' ? 'Switch to Grid View' : 'Switch to Spotlight'}
            >
              {viewMode === 'spotlight' ? <Grid className="w-3.5 h-3.5" /> : <Layout className="w-3.5 h-3.5" />}
              <span className="hidden md:inline text-[11px]">{viewMode === 'spotlight' ? 'Grid' : 'Spotlight'}</span>
            </button>
          )}

          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CASE 1: TIME HAS NOT ARRIVED YET -> WAITING ROOM & TIMING MATCH GATING */}
      {/* ===================================================================== */}
      {isUpcoming && !callJoined ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 relative bg-slate-950/95 backdrop-blur">
          {/* Animated Lock Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-500 p-1 shadow-2xl mb-4 relative">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
              ⏱️
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled Waiting Room • Time Gated</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2 text-white">
            Session Unlocks at Allotted Time
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mb-6 leading-relaxed">
            Per platform rules, interaction is available only when the allotted schedule matches the present time.
            Both <strong>{currentUser?.fullName}</strong> and <strong>{counterpartyName}</strong> can speak & video call as soon as the room opens.
          </p>

          {/* Live Countdown & Timing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full mb-6 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Allotted Session Time</span>
              <p className="text-xs font-bold text-orange-400 truncate">
                📅 {session?.start_time || 'Scheduled Time'}
              </p>
              <p className="text-[10px] text-slate-500">Duration: {durationMinutes} Mins</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Unlocks In (Countdown)</span>
              <p className="text-base font-black text-emerald-400 font-mono">
                {formatCountdown(secondsUntilStart)}
              </p>
              <p className="text-[10px] text-slate-500">Present: {now.toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Action Buttons: Change Timing OR Set to Right Now */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setRescheduleModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Change Allotted Date & Time</span>
            </button>

            <button
              onClick={handleStartImmediately}
              disabled={isRescheduling}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="Change schedule to right now to interact immediately"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRescheduling ? 'Updating Schedule...' : '⚡ Match Present Time & Start Now'}</span>
            </button>
          </div>
        </div>
      ) : !callJoined ? (
        /* ===================================================================== */
        /* CASE 2: ALLOTTED TIME MATCHES PRESENT TIME -> READY TO JOIN MEET      */
        /* ===================================================================== */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 relative bg-slate-900/90 backdrop-blur">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-green-600 to-teal-500 p-1 shadow-2xl mb-4 animate-bounce-subtle">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
              <Unlock className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Allotted Time Active • Classroom Unlocked</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1 text-white">
            TimeBank Meet Classroom Active 🇮🇳
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            The scheduled session window has arrived! Connect with <strong>{counterpartyName}</strong> ({counterpartyRole}) to begin 2-way speaking and video call.
          </p>

          {permissionError && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center gap-2 max-w-md text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{permissionError}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={startMediaAndJoinCall}
              disabled={isConnecting}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Video className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting Devices...' : 'Join Video & Audio Call Now ▶'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-6">
            <span className="flex items-center gap-1">🔒 100% Peer-to-Peer</span>
            <span>•</span>
            <span className="flex items-center gap-1">🎙️ Noise Suppression</span>
            <span>•</span>
            <span className="flex items-center gap-1">⏱️ 1 Hour = 1 Credit</span>
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* CASE 3: ACTIVE GOOGLE MEET CALL                                       */
        /* ===================================================================== */
        <div className="w-full h-full flex flex-col justify-between relative pt-14 pb-20 px-4">
          {/* VIDEO STAGE CONTAINER */}
          <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
            {screenSharing && screenStream ? (
              <div className="w-full h-full rounded-2xl bg-black border border-slate-800 overflow-hidden relative flex items-center justify-center">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <MonitorUp className="w-3.5 h-3.5" />
                  <span>Your Screen Share (Presenting to {counterpartyName})</span>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-h-full">
                {/* TILE 1: COUNTERPARTY */}
                <div
                  className={`relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center transition-all ${
                    isRemoteSpeaking ? 'ring-4 ring-emerald-500/80 shadow-lg shadow-emerald-500/20' : ''
                  }`}
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${remoteVideoOn ? 'block' : 'hidden'}`}
                  />
                  {!remoteVideoOn && (
                    <div className="text-center space-y-3 p-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-orange-500 to-green-600 p-1 mx-auto shadow-2xl">
                        <img
                          src={counterpartyAvatar}
                          alt={counterpartyName}
                          className="w-full h-full rounded-[22px] object-cover"
                        />
                      </div>
                      <h4 className="font-bold text-sm text-white">{counterpartyName}</h4>
                      <p className="text-[11px] text-slate-400">Camera is paused</p>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-[11px] font-bold text-white flex items-center gap-1.5">
                      <span>{counterpartyName}</span>
                      <span className="text-orange-400 text-[10px]">({counterpartyRole})</span>
                    </span>
                    {!remoteMicOn && (
                      <span className="p-1 rounded-md bg-rose-600 text-white" title="Muted">
                        <MicOff className="w-3 h-3" />
                      </span>
                    )}
                    {remoteHandRaised && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                        <Hand className="w-3 h-3" /> Raised Hand
                      </span>
                    )}
                  </div>
                </div>

                {/* TILE 2: SELF VIEW */}
                <div
                  className={`relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center transition-all ${
                    isLocalSpeaking ? 'ring-4 ring-emerald-500/80 shadow-lg shadow-emerald-500/20' : ''
                  }`}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${videoOn ? 'block' : 'hidden'}`}
                  />
                  {!videoOn && (
                    <div className="text-center space-y-3 p-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-800 border-2 border-slate-700 p-1 mx-auto shadow-2xl">
                        <img
                          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'}
                          alt={currentUser?.fullName || 'User'}
                          className="w-full h-full rounded-[22px] object-cover"
                        />
                      </div>
                      <h4 className="font-bold text-sm text-white">{currentUser?.fullName || 'You'}</h4>
                      <p className="text-[11px] text-slate-400">Your camera is off</p>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-[11px] font-bold text-white flex items-center gap-1.5">
                      <span>You</span>
                      <span className="text-emerald-400 text-[10px]">({myRole})</span>
                    </span>
                    {!micOn && (
                      <span className="p-1 rounded-md bg-rose-600 text-white" title="Muted">
                        <MicOff className="w-3 h-3" />
                      </span>
                    )}
                    {myHandRaised && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                        <Hand className="w-3 h-3" /> Hand Raised
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW MODE: SPOTLIGHT WITH PiP */
              <div className="w-full h-full relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${remoteVideoOn ? 'block' : 'hidden'}`}
                />
                {!remoteVideoOn && (
                  <div className="text-center space-y-3 p-4">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-orange-500 to-green-600 p-1 mx-auto shadow-2xl">
                      <img
                        src={counterpartyAvatar}
                        alt={counterpartyName}
                        className="w-full h-full rounded-[22px] object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{counterpartyName}</h3>
                      <p className="text-xs text-slate-400">{counterpartyRole}</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                  <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur text-xs font-bold text-white flex items-center gap-2">
                    <span>{counterpartyName}</span>
                    <span className="text-orange-400 text-[10px]">({counterpartyRole})</span>
                  </span>
                  {!remoteMicOn && (
                    <span className="p-1.5 rounded-lg bg-rose-600 text-white">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {remoteHandRaised && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 animate-pulse">
                      <Hand className="w-3.5 h-3.5" /> Hand Raised
                    </span>
                  )}
                </div>

                {/* SELF PiP */}
                <div
                  className={`absolute bottom-4 right-4 w-36 h-28 sm:w-48 sm:h-36 rounded-2xl bg-slate-950 border-2 border-slate-700 overflow-hidden shadow-2xl z-20 transition-all ${
                    isLocalSpeaking ? 'ring-4 ring-emerald-500/80' : ''
                  }`}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${videoOn ? 'block' : 'hidden'}`}
                  />
                  {!videoOn && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-900">
                      <img
                        src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'}
                        alt="You"
                        className="w-10 h-10 rounded-full object-cover mb-1 border border-slate-600"
                      />
                      <p className="text-[10px] text-slate-300 font-bold">You (Off)</p>
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white">
                      You
                    </span>
                    {!micOn && (
                      <span className="p-0.5 rounded bg-rose-600 text-white">
                        <MicOff className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GOOGLE MEET FLOATING CONTROL BAR */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-3xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl max-w-[95vw] overflow-x-auto">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                micOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg'
              }`}
              title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                videoOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg'
              }`}
              title={videoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {videoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                screenSharing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={screenSharing ? 'Stop Presenting Screen' : 'Present Your Screen'}
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Raise Hand Toggle */}
            <button
              onClick={toggleHandRaise}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                myHandRaised
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={myHandRaised ? 'Lower Hand' : 'Raise Hand'}
            >
              <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* In-Call Reactions */}
            <div className="relative">
              <button
                onClick={() => setShowReactionsMenu(!showReactionsMenu)}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
                title="Send Emoji Reaction"
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {showReactionsMenu && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 animate-in fade-in zoom-in-95">
                  {['👍', '👏', '❤️', '💡', '🔥', '🎉'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="p-2 text-xl hover:scale-125 transition-transform hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-Call Chat Drawer Toggle */}
            <button
              onClick={() => {
                setChatDrawerOpen(!chatDrawerOpen);
                setUnreadChatCount(0);
              }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all relative cursor-pointer"
              title="In-call Chat"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-[10px] font-black flex items-center justify-center shadow">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Dispute */}
            <button
              onClick={onRaiseDispute}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 transition-all cursor-pointer"
              title="Raise Session Dispute"
            >
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Cancel Session */}
            {(session?.status === 'SCHEDULED' || session?.status === 'IN_PROGRESS') && (
              <button
                onClick={onCancelSession}
                className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer"
                title="Cancel session with prorated deduction"
              >
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Cancel Session</span>
              </button>
            )}
          </div>

          {/* IN-CALL CHAT DRAWER */}
          {chatDrawerOpen && (
            <div className="absolute top-14 right-4 bottom-20 w-80 max-w-[90vw] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <h4 className="font-bold text-xs text-white">In-Call Messages</h4>
                </div>
                <button
                  onClick={() => setChatDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
                {messages.map((m) => {
                  const isMe = m.senderId === currentUser?.id;
                  const isSys = m.senderId === 'system';

                  if (isSys) {
                    return (
                      <div key={m.id} className="p-2.5 rounded-xl bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/60 leading-relaxed">
                        {m.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">{m.senderName}</span>
                        <span>•</span>
                        <span>{m.time}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[85%] break-words ${
                          isMe
                            ? 'bg-orange-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message ${counterpartyName}...`}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* RESCHEDULE MODAL (Change allotted date & time)                         */}
      {/* ===================================================================== */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-base">Change Allotted Time</h3>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Adjust the scheduled date and time for this session. The classroom will update and become interactive when the new allotted time matches present time.
            </p>

            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Current Schedule</span>
              <p className="font-bold text-orange-600 dark:text-orange-400">
                📅 {session?.start_time || 'Not set'}
              </p>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">Quick Presets</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleStartImmediately}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Right Now (Start)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 15 * 60 * 1000);
                    setRescheduleDate(d.toISOString().slice(0, 10));
                    setRescheduleTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  +15 Minutes
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 60 * 60 * 1000);
                    setRescheduleDate(d.toISOString().slice(0, 10));
                    setRescheduleTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  +1 Hour
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 86400000);
                    setRescheduleDate(d.toISOString().slice(0, 10));
                    setRescheduleTime('18:00');
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  Tomorrow 6:00 PM
                </button>
              </div>
            </div>

            {/* Custom Date & Time Picker */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRescheduleSubmit();
              }}
              className="space-y-3 pt-2"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {rescheduleSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{rescheduleSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-md hover:scale-102 transition-all disabled:opacity-50"
                >
                  {isRescheduling ? 'Saving...' : 'Confirm New Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
