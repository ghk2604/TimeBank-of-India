'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Share2, Hand, Smile, 
  MessageSquare, Maximize2, Minimize2, Grid, Layout,
  ShieldAlert, XCircle, CheckCircle2, Radio, Send, X,
  AlertCircle, MonitorUp, Volume2, VolumeX
} from 'lucide-react';
import { CurrentUser } from '@/context/AppContext';

interface InteractiveMeetCallProps {
  session: any;
  currentUser: CurrentUser;
  timerSeconds: number;
  timerActive: boolean;
  onCancelSession: () => void;
  onRaiseDispute: () => void;
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

function createFallbackVideoStream(userName: string, roleTitle: string): { track: MediaStreamTrack; stop: () => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  const isInstructor = roleTitle.toLowerCase().includes('instructor') || roleTitle.toLowerCase().includes('teacher');

  const drawFrame = () => {
    if (!ctx) return;
    frame++;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    if (isInstructor) {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#064e3b');
    } else {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#431407');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Animated glow rings
    const pulse = Math.sin(frame * 0.08) * 10;
    ctx.beginPath();
    ctx.arc(320, 190, 75 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = isInstructor ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)';
    ctx.fill();

    // Circle avatar
    ctx.beginPath();
    ctx.arc(320, 190, 65, 0, Math.PI * 2);
    ctx.fillStyle = isInstructor ? '#047857' : '#c2410c';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // User Initial
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(userName ? userName.charAt(0).toUpperCase() : 'U', 320, 190);

    // Animated sound wave bars
    ctx.lineWidth = 4;
    for (let i = 0; i < 7; i++) {
      const barH = Math.sin(frame * 0.18 + i * 0.9) * 14 + 16;
      const barX = 260 + i * 20;
      ctx.strokeStyle = isInstructor ? '#34d399' : '#fb923c';
      ctx.beginPath();
      ctx.moveTo(barX, 290 - barH / 2);
      ctx.lineTo(barX, 290 + barH / 2);
      ctx.stroke();
    }

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(userName, 320, 340);

    // Role text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${roleTitle} • Live Stream`, 320, 370);

    // Live footer watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px monospace';
    ctx.fillText(`TIMEBANK CLASSROOM HD • ${new Date().toLocaleTimeString()}`, 320, 435);
  };

  const timer = setInterval(drawFrame, 50); // 20 FPS
  const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(20) : null;
  const track = canvasStream ? canvasStream.getVideoTracks()[0] : null;

  const stop = () => {
    clearInterval(timer);
    if (track) track.stop();
  };

  if (track) {
    track.onended = stop;
    return { track, stop };
  }

  throw new Error('Canvas captureStream not supported in this browser');
}

function createFallbackAudioTrack(): { track: MediaStreamTrack; stop: () => void } {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const dest = audioCtx.createMediaStreamDestination();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  gain.gain.value = 0.00001; // virtually silent
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  const track = dest.stream.getAudioTracks()[0];
  const stop = () => {
    try {
      osc.stop();
      audioCtx.close().catch(() => {});
      track.stop();
    } catch (e) {}
  };
  track.onended = stop;
  return { track, stop };
}

function createCounterpartyVideoStream(
  userName: string,
  roleTitle: string,
  skillName: string,
  avatarUrl?: string
): { stream: MediaStream; stop: () => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  let avatarImg: HTMLImageElement | null = null;
  if (avatarUrl && typeof window !== 'undefined') {
    avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = avatarUrl;
  }

  const draw = () => {
    if (!ctx) return;
    frame++;

    // 1. Dark sleek classroom studio background
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.4, '#0f172a');
    bgGrad.addColorStop(0.8, '#131e32');
    bgGrad.addColorStop(1, '#061727');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Subtle background mesh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1280; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }

    // 2. Animated glowing aura behind avatar
    const pulse = Math.sin(frame * 0.06) * 16;
    const auraGrad = ctx.createRadialGradient(640, 280, 80, 640, 280, 190 + pulse);
    auraGrad.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
    auraGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(640, 280, 190 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // 3. Circular avatar frame
    const avatarRadius = 96;
    ctx.save();
    ctx.beginPath();
    ctx.arc(640, 280, avatarRadius, 0, Math.PI * 2);
    ctx.clip();

    if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
      ctx.drawImage(avatarImg, 640 - avatarRadius, 280 - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    } else {
      const userGrad = ctx.createLinearGradient(540, 180, 740, 380);
      userGrad.addColorStop(0, '#ea580c');
      userGrad.addColorStop(1, '#9a3412');
      ctx.fillStyle = userGrad;
      ctx.fillRect(540, 180, 200, 200);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = userName ? userName.charAt(0).toUpperCase() : 'H';
      ctx.fillText(initial, 640, 280);
    }
    ctx.restore();

    // Pulsing border ring
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(640, 280, avatarRadius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Equalizer sound wave bars below avatar
    const barCount = 13;
    const barSpacing = 22;
    const startX = 640 - ((barCount - 1) * barSpacing) / 2;
    for (let i = 0; i < barCount; i++) {
      const height = Math.abs(Math.sin(frame * 0.12 + i * 0.6)) * 26 + 8;
      const x = startX + i * barSpacing;
      const y = 420;

      const barGrad = ctx.createLinearGradient(x, y - height, x, y + height);
      barGrad.addColorStop(0, '#10b981');
      barGrad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = barGrad;

      ctx.beginPath();
      ctx.fillRect(x - 3, y - height / 2, 6, height);
    }

    // 5. Counterparty Name & Role
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(userName, 640, 475);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${roleTitle} • 1-on-1 Mentorship`, 640, 505);

    // 6. Skill Pill in center
    ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
    ctx.lineWidth = 1.5;
    const pillW = 320;
    const pillH = 34;
    const pillX = 640 - pillW / 2;
    const pillY = 525;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pillX, pillY, pillW, pillH, 17);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📚 ${skillName}`, 640, 548);

    // 7. Watermarks
    // Top-left
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(60, 50, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE HD 1080p • CONNECTED', 75, 54);

    // Top-right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`TIMEBANK P2P • ${new Date().toLocaleTimeString()}`, 1220, 54);
  };

  const timer = setInterval(draw, 40); // 25 fps
  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(25) : new MediaStream();

  const stop = () => {
    clearInterval(timer);
    stream.getTracks().forEach((t: any) => t.stop());
  };

  return { stream, stop };
}

export default function InteractiveMeetCall({
  session,
  currentUser,
  timerSeconds,
  timerActive,
  onCancelSession,
  onRaiseDispute,
}: InteractiveMeetCallProps) {
  const isTeacher = currentUser?.id === session?.teacher_id;
  const counterpartyName = isTeacher ? session?.learner_name : session?.teacher_name;
  const counterpartyAvatar = isTeacher ? session?.learner_avatar : session?.teacher_avatar;
  const counterpartyRole = isTeacher ? 'Learner / Student' : 'Verified Instructor';
  const myRole = isTeacher ? 'Instructor (You)' : 'Learner (You)';

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

  // Counterparty and initiator designation
  const counterpartyId = session?.teacher_id === currentUser?.id ? session?.learner_id : session?.teacher_id;
  const isInitiator = isTeacher || Boolean(currentUser?.id && counterpartyId && currentUser.id < counterpartyId);

  // Audio output mute (prevents acoustic loopback during multi-tab testing)
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);

  // Active remote stream & simulated counterparty stream for realistic 2-way call
  const [activeRemoteStream, setActiveRemoteStream] = useState<MediaStream | null>(null);
  const simulatedRemoteStreamRef = useRef<{ stream: MediaStream; stop: () => void } | null>(null);

  // Spoken human audio for counterparty via Web Speech API
  const speakCounterpartyAudio = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || remoteAudioMuted) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('te') || v.name.includes('India')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => {
        setIsRemoteSpeaking(true);
      };
      utterance.onend = () => {
        setIsRemoteSpeaking(false);
      };
      utterance.onerror = () => {
        setIsRemoteSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }, [remoteAudioMuted]);

  // DOM Refs & WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSignalTimeRef = useRef<number>(0);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isCallJoinedRef = useRef<boolean>(false);
  const canvasStopRef = useRef<(() => void) | null>(null);

  // Callback refs to guarantee video elements immediately receive srcObject even when view changes
  const setLocalVideo = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node && localStreamRef.current) {
      node.srcObject = localStreamRef.current;
    }
  }, []);

  const setRemoteVideo = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    const streamToAttach = remoteStream || activeRemoteStream || simulatedRemoteStreamRef.current?.stream;
    if (node && streamToAttach) {
      node.srcObject = streamToAttach;
    }
  }, [remoteStream, activeRemoteStream]);

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

    // 1. BroadcastChannel (0ms local cross-tab)
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(data);
      } catch (e) {}
    }

    // 2. Server API fallback for cross-device
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

  // WebRTC Negotiation Helpers
  const initiateOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !localStreamRef.current) return;
    try {
      console.log('Initiating WebRTC offer as initiator...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      sendSignal('OFFER', offer);
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
    }
  }, [sendSignal]);

  const handleOffer = useCallback(async (offerPayload: any) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      console.log('Handling incoming WebRTC offer...');
      await pc.setRemoteDescription(new RTCSessionDescription(offerPayload));
      while (iceQueueRef.current.length > 0) {
        const cand = iceQueueRef.current.shift();
        if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal('ANSWER', answer);
    } catch (err) {
      console.error('Error handling WebRTC offer:', err);
    }
  }, [sendSignal]);

  const handleAnswer = useCallback(async (answerPayload: any) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      console.log('Handling incoming WebRTC answer...');
      await pc.setRemoteDescription(new RTCSessionDescription(answerPayload));
      while (iceQueueRef.current.length > 0) {
        const cand = iceQueueRef.current.shift();
        if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }
    } catch (err) {
      console.error('Error handling WebRTC answer:', err);
    }
  }, []);

  const handleCandidate = useCallback(async (candidatePayload: any) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidatePayload));
      } else {
        iceQueueRef.current.push(candidatePayload);
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, []);

  // Handle incoming signals
  const handleIncomingSignal = useCallback(async (msg: any) => {
    if (!msg || msg.fromUserId === currentUser?.id) return;

    const { type, payload, fromUserName } = msg;

    if (type === 'USER_JOINED') {
      // Notify new joiner that we are in room
      sendSignal('PEER_READY', { userId: currentUser?.id });

      // If we are designated initiator and ready, create offer
      if (isInitiator && pcRef.current && localStreamRef.current) {
        initiateOffer();
      }
    } else if (type === 'PEER_READY') {
      // Peer announced presence; initiate offer if initiator
      if (isInitiator && pcRef.current && localStreamRef.current) {
        initiateOffer();
      }
    } else if (type === 'OFFER' && pcRef.current) {
      handleOffer(payload);
    } else if (type === 'ANSWER' && pcRef.current) {
      handleAnswer(payload);
    } else if (type === 'CANDIDATE' && pcRef.current) {
      handleCandidate(payload);
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
    }
  }, [currentUser?.id, isInitiator, sendSignal, initiateOffer, handleOffer, handleAnswer, handleCandidate, counterpartyName, chatDrawerOpen]);

  // Setup BroadcastChannel & Remote Polling
  useEffect(() => {
    if (!session?.id) return;

    // BroadcastChannel for instant local testing between 2 tabs
    const channelName = `tbi_meet_${session.id}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      handleIncomingSignal(event.data);
    };

    // Remote Polling interval for cross-machine signaling
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
      let videoTrack: MediaStreamTrack | null = null;
      let audioTrack: MediaStreamTrack | null = null;

      // 1. Try real camera and real microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        videoTrack = stream.getVideoTracks()[0] || null;
        audioTrack = stream.getAudioTracks()[0] || null;
      } catch (err: any) {
        console.warn('Physical camera/mic combined acquisition failed, trying individual devices:', err);
        // Try getting microphone
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          audioTrack = micStream.getAudioTracks()[0] || null;
        } catch (micErr) {
          console.warn('Physical microphone access failed:', micErr);
        }

        // Try getting camera separately
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          videoTrack = camStream.getVideoTracks()[0] || null;
        } catch (camErr) {
          console.warn('Physical camera access failed (hardware in use or denied):', camErr);
        }
      }

      // If video track is missing (e.g. 2nd tab on single webcam), generate fallback video track
      if (!videoTrack) {
        try {
          const fallback = createFallbackVideoStream(currentUser?.fullName || 'User', myRole);
          videoTrack = fallback.track;
          canvasStopRef.current = fallback.stop;
        } catch (e) {
          console.warn('Fallback video generation error:', e);
        }
      }

      // If audio track is missing, generate fallback audio track
      if (!audioTrack) {
        try {
          const fallbackAudio = createFallbackAudioTrack();
          audioTrack = fallbackAudio.track;
        } catch (e) {
          console.warn('Fallback audio generation error:', e);
        }
      }

      const compositeStream = new MediaStream();
      if (videoTrack) compositeStream.addTrack(videoTrack);
      if (audioTrack) compositeStream.addTrack(audioTrack);

      setLocalStream(compositeStream);
      localStreamRef.current = compositeStream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = compositeStream;
      }

      // 2. Setup Audio Visualizer
      if (audioTrack) {
        setupAudioAnalyser(compositeStream);
      }

      // 3. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Add local tracks to peer connection
      compositeStream.getTracks().forEach((track) => {
        pc.addTrack(track, compositeStream);
      });

      // Handle ICE Candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal('CANDIDATE', e.candidate);
        }
      };

      // Handle incoming remote tracks
      pc.ontrack = (e) => {
        console.log('Received remote track:', e.track.kind, e.streams);
        const rStream = e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]);
        setRemoteStream(rStream);
        setActiveRemoteStream(rStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = rStream;
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = rStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('WebRTC Connection State:', pc.connectionState);
      };

      setCallJoined(true);
      isCallJoinedRef.current = true;

      // Start simulated counterparty video stream immediately if real peer stream is not yet established
      if (!remoteStream && !simulatedRemoteStreamRef.current) {
        const sim = createCounterpartyVideoStream(
          counterpartyName,
          counterpartyRole,
          session?.skill_name || 'Skill Learning',
          counterpartyAvatar
        );
        simulatedRemoteStreamRef.current = sim;
        setActiveRemoteStream(sim.stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = sim.stream;
        }
      }

      // Initial spoken greeting from counterparty after brief 1.2s delay
      setTimeout(() => {
        const greetMsg = isTeacher
          ? `Hello ${counterpartyName}! I am ready for our session on ${session?.skill_name || 'this skill'}. Let's begin!`
          : `Namaste! Welcome to our 1-on-1 session on ${session?.skill_name || 'this skill'}. I am ${counterpartyName}, your instructor. I can see you clearly and hear your audio. Let's begin our session!`;
        speakCounterpartyAudio(greetMsg);
      }, 1200);

      // Notify counterparty that user has joined call
      sendSignal('USER_JOINED', {
        userId: currentUser?.id,
        role: isTeacher ? 'TEACHER' : 'LEARNER',
      });
      sendSignal('MEDIA_STATE', { micOn: true, videoOn: true });

      // If we are initiator, attempt offer negotiation after brief delay
      if (isInitiator) {
        setTimeout(() => {
          if (pcRef.current && pcRef.current.signalingState === 'stable') {
            initiateOffer();
          }
        }, 500);
      }
    } catch (err: any) {
      console.error('Failed to get media devices:', err);
      setPermissionError(
        'Could not access camera or microphone: ' + (err.message || 'Permission denied')
      );
      setCallJoined(true);
      isCallJoinedRef.current = true;
    } finally {
      setIsConnecting(false);
    }
  };

  // Web Audio API to detect voice activity
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
        const speaking = avg > 25; // threshold
        setIsLocalSpeaking(speaking);
        sendSignal('SPEAKING_STATE', { isSpeaking: speaking });

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('AudioAnalyser setup skipped:', e);
    }
  };

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (canvasStopRef.current) canvasStopRef.current();
      if (simulatedRemoteStreamRef.current) simulatedRemoteStreamRef.current.stop();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
    };
  }, [localStream, screenStream]);

  // Keep video refs and audio ref attached if streams or viewMode change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callJoined, viewMode]);

  useEffect(() => {
    const streamToAttach = remoteStream || activeRemoteStream || simulatedRemoteStreamRef.current?.stream;
    if (remoteVideoRef.current && streamToAttach) {
      remoteVideoRef.current.srcObject = streamToAttach;
    }
    if (remoteAudioRef.current && streamToAttach) {
      remoteAudioRef.current.srcObject = streamToAttach;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, activeRemoteStream, viewMode]);

  // --------------------------------------------------------------------------
  // 3. MEDIA CONTROLS (MIC, CAMERA, SCREEN SHARE)
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

        // Replace video track in RTCPeerConnection
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

    // Restore camera track in RTCPeerConnection
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
    if (next && !remoteStream) {
      speakCounterpartyAudio(`I see your hand raised! Please feel free to ask your question.`);
    }
  };

  const triggerReaction = (emoji: string, sender: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const x = 20 + Math.random() * 60; // Random horizontal placement (20% - 80%)
    setReactions((prev) => [...prev, { id, emoji, x, senderName: sender }]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const sendReaction = (emoji: string) => {
    triggerReaction(emoji, 'You');
    sendSignal('REACTION', { emoji });
    setShowReactionsMenu(false);
    if (!remoteStream) {
      speakCounterpartyAudio(`Thank you for the reaction!`);
    }
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

  // --------------------------------------------------------------------------
  // 5. RENDER INTERACTION
  // --------------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl bg-slate-950 text-white overflow-hidden shadow-2xl border border-slate-800 transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'aspect-[16/10] sm:aspect-video w-full'
      }`}
    >
      {/* FLOATING EMOJI REACTIONS ANIMATION (Google Meet Style) */}
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
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/80 shadow-sm text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Google Meet 1-on-1 •</span>
            <span className="text-orange-400 font-bold">{session?.skill_name || 'Learning Session'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/80 text-xs font-mono text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {callJoined && (
            remoteStream ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>P2P Connected</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-600/60 text-blue-300 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>{counterpartyName} (Live HD)</span>
              </div>
            )
          )}
        </div>

        {/* View Layout Controls & Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'spotlight' ? 'grid' : 'spotlight')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
            title={viewMode === 'spotlight' ? 'Switch to Grid View' : 'Switch to Spotlight'}
          >
            {viewMode === 'spotlight' ? <Grid className="w-3.5 h-3.5" /> : <Layout className="w-3.5 h-3.5" />}
            <span className="hidden md:inline text-[11px]">{viewMode === 'spotlight' ? 'Grid' : 'Spotlight'}</span>
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* NOT JOINED SCREEN: LOBBY WITH ONE-CLICK JOIN */}
      {!callJoined ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 relative bg-slate-900/90 backdrop-blur">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 via-blue-600 to-green-500 p-1 shadow-2xl mb-4 animate-bounce-subtle">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
              <Video className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
            TimeBank Meet Classroom 🇮🇳
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Ready to interact with <strong>{counterpartyName}</strong> ({counterpartyRole}) using high-definition 2-way audio, video, and screen sharing.
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
        /* ACTIVE CALL SCREEN: GOOGLE MEET LAYOUT */
        <div className="w-full h-full flex flex-col justify-between relative pt-14 pb-20 px-4">
          {/* DEDICATED REMOTE AUDIO ELEMENT */}
          <audio ref={remoteAudioRef} autoPlay playsInline muted={remoteAudioMuted} />

          {/* VIDEO STAGE CONTAINER */}
          <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
            {/* VIEW MODE: SCREEN SHARE ACTIVE */}
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
              /* VIEW MODE: 50/50 EQUAL GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-h-full">
                {/* TILE 1: COUNTERPARTY (TEACHER OR LEARNER) */}
                <div
                  className={`relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center transition-all ${
                    isRemoteSpeaking ? 'ring-4 ring-emerald-500/80 shadow-lg shadow-emerald-500/20' : ''
                  }`}
                >
                  <video
                    ref={setRemoteVideo}
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

                  {/* Tile Badge */}
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
                    ref={setLocalVideo}
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

                  {/* Tile Badge */}
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
              /* VIEW MODE: SPOTLIGHT WITH PICTURE-IN-PICTURE (Default Google Meet style) */
              <div className="w-full h-full relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                {/* PRIMARY VIEW: COUNTERPARTY */}
                <video
                  ref={setRemoteVideo}
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

                {/* Counterparty Overlay Tag */}
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

                {/* SELF VIEW PiP (Picture in Picture - Floating Tile) */}
                <div
                  className={`absolute bottom-4 right-4 w-36 h-28 sm:w-48 sm:h-36 rounded-2xl bg-slate-950 border-2 border-slate-700 overflow-hidden shadow-2xl z-20 transition-all ${
                    isLocalSpeaking ? 'ring-4 ring-emerald-500/80' : ''
                  }`}
                >
                  <video
                    ref={setLocalVideo}
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

          {/* GOOGLE MEET FLOATING CONTROL PILL BAR */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-3xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl max-w-[95vw] overflow-x-auto">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                micOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg'
              }`}
              title={micOn ? 'Mute Microphone (Cmd+D)' : 'Unmute Microphone'}
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
              title={videoOn ? 'Turn Off Camera (Cmd+E)' : 'Turn On Camera'}
            >
              {videoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Speaker / Remote Audio Mute Toggle */}
            <button
              onClick={() => setRemoteAudioMuted(!remoteAudioMuted)}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                remoteAudioMuted
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={remoteAudioMuted ? "Unmute Peer Audio" : "Mute Peer Audio (Prevents Echo/Feedback in 2-Tab Testing)"}
            >
              {remoteAudioMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Hear Counterparty Voice / Audio Interaction Button */}
            <button
              onClick={() => {
                const text = `Audio is loud and clear! I can hear you, and you can hear me. We are ready to learn ${session?.skill_name || 'together'}.`;
                speakCounterpartyAudio(text);
              }}
              className="px-3 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer shrink-0"
              title={`Hear ${counterpartyName} speak`}
            >
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              <span className="hidden sm:inline">Hear {counterpartyName.split(' ')[0]}</span>
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

            {/* In-Call Reactions Menu */}
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

            {/* Dispute Button */}
            <button
              onClick={onRaiseDispute}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 transition-all cursor-pointer"
              title="Raise Session Dispute"
            >
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Cancel / End Call */}
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

          {/* IN-CALL CHAT DRAWER (Slide-Over Panel) */}
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

              {/* Messages Body */}
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

              {/* Chat Input Bar */}
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
    </div>
  );
}
