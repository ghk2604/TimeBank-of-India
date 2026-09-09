'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Maximize2, Minimize2, 
  Sparkles, ShieldCheck, Users, Radio, ArrowRight, RotateCcw, AlertCircle
} from 'lucide-react';
import { getJitsiRoomName, getJitsiDomain, JITSI_TOOLBAR_BUTTONS } from '@/lib/jitsi';

interface JitsiMeetingRoomProps {
  session: any;
  currentUser: any;
  autoJoin?: boolean;
  onEndCall?: () => void;
  onCancelSession?: () => void;
  onRaiseDispute?: () => void;
}

export default function JitsiMeetingRoom({
  session,
  currentUser,
  autoJoin = false,
  onEndCall,
  onCancelSession,
  onRaiseDispute,
}: JitsiMeetingRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  const [callState, setCallState] = useState<'idle' | 'loading' | 'joined' | 'ended'>(
    autoJoin ? 'loading' : 'idle'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isTeacher = session?.teacher_id === currentUser?.id;
  const counterpartyName = isTeacher ? session?.learner_name : session?.teacher_name;
  const counterpartyAvatar = isTeacher ? session?.learner_avatar : session?.teacher_avatar;
  const counterpartyRole = isTeacher ? 'Learner (Consumer)' : 'Teacher (Provider)';
  const roomName = getJitsiRoomName(session?.id);
  const domain = getJitsiDomain();

  // 1. Ensure external_api.js is loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).JitsiMeetExternalAPI) {
      setApiReady(true);
      return;
    }

    const existingScript = document.getElementById('jitsi-external-api-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setApiReady(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-external-api-script';
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => setApiReady(true);
    script.onerror = () => {
      setErrorMessage('Could not load Jitsi Meet library. Please check your internet connection.');
    };
    document.body.appendChild(script);
  }, [domain]);

  // 2. Start Jitsi Call
  const startMeeting = () => {
    setCallState('loading');
    setErrorMessage(null);
  };

  // 3. Initialize Jitsi API once state is loading and container is available
  useEffect(() => {
    if (callState !== 'loading') return;
    if (!apiReady || !(window as any).JitsiMeetExternalAPI) return;
    if (!containerRef.current) return;

    // Clean up any previous instance
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        console.warn('Error disposing previous Jitsi instance', e);
      }
      jitsiApiRef.current = null;
    }

    // Clear inner container
    containerRef.current.innerHTML = '';

    try {
      const options = {
        roomName: roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: currentUser?.fullName || currentUser?.username || (isTeacher ? 'Teacher' : 'Learner'),
          email: currentUser?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          p2p: { enabled: true },
          resolution: 720,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: JITSI_TOOLBAR_BUTTONS,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_POWERED_BY: false,
          DEFAULT_REMOTE_DISPLAY_NAME: counterpartyName || 'Participant',
        },
      };

      const api = new (window as any).JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      api.addListener('videoConferenceJoined', () => {
        setCallState('joined');
        setParticipantCount(1);
      });

      api.addListener('participantJoined', () => {
        setParticipantCount((prev) => prev + 1);
      });

      api.addListener('participantLeft', () => {
        setParticipantCount((prev) => Math.max(1, prev - 1));
      });

      api.addListener('readyToClose', () => {
        handleEndCall();
      });

      api.addListener('videoConferenceLeft', () => {
        handleEndCall();
      });
    } catch (err: any) {
      console.error('Failed to initialize Jitsi Meet:', err);
      setErrorMessage(err.message || 'Failed to initialize video call.');
      setCallState('idle');
    }
  }, [callState, apiReady, roomName, domain]);

  // Handle auto-join trigger
  useEffect(() => {
    if (autoJoin && apiReady && callState === 'idle') {
      startMeeting();
    }
  }, [autoJoin, apiReady]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          // ignore cleanup errors
        }
        jitsiApiRef.current = null;
      }
    };
  }, []);

  const handleEndCall = () => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        // ignore
      }
      jitsiApiRef.current = null;
    }
    setCallState('ended');
    if (onEndCall) onEndCall();
  };

  const triggerHangup = () => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.executeCommand('hangup');
      } catch {
        handleEndCall();
      }
    } else {
      handleEndCall();
    }
  };

  const toggleContainerFullscreen = () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* 1. LOBBY STATE (Before Joining) */}
      {callState === 'idle' && (
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-xl relative overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="max-w-xl mx-auto text-center space-y-6 relative z-10">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Jitsi Meet Secure 1-on-1 Video Room</span>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {session?.skill_name || '1-on-1 Learning Session'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2">
                Video conference ready between{' '}
                <strong className="text-white">{currentUser?.fullName}</strong> and{' '}
                <strong className="text-orange-400">{counterpartyName}</strong>.
              </p>
            </div>

            {/* Counterparty Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <img
                  src={counterpartyAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`}
                  alt={counterpartyName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-400"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{counterpartyName}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {counterpartyRole}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Duration: {session?.duration || 60} mins • Credits: {Number(session?.credit_amount ?? 1).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Room Ready</span>
              </div>
            </div>

            {/* Action Button: Join Video Call */}
            <div className="pt-2">
              <button
                onClick={startMeeting}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-sm shadow-xl hover:shadow-emerald-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
              >
                <Video className="w-5 h-5 fill-white" />
                <span>Join Video Call (Start Meeting) ▶</span>
              </button>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/10">
              <div className="flex items-center justify-center gap-1">
                <span className="text-emerald-400">✓</span> 2-Way HD Video
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-emerald-400">✓</span> 2-Way Crystal Audio
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-emerald-400">✓</span> Screen Sharing
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-emerald-400">✓</span> In-App Meeting
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {callState === 'loading' && (
        <div className="h-[540px] sm:h-[600px] w-full rounded-3xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-white space-y-4 shadow-xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <Video className="w-7 h-7 text-emerald-400 absolute inset-0 m-auto" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold">Connecting to Private Meeting Room...</h3>
            <p className="text-xs text-slate-400">
              Initializing camera, microphone, and Jitsi Meet bridge for {counterpartyName}
            </p>
          </div>
          {/* Mount point for API creation */}
          <div ref={containerRef} className="hidden" />
        </div>
      )}

      {/* 3. ACTIVE LIVE CALL STATE */}
      {callState === 'joined' && (
        <div className="rounded-3xl bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
          {/* Live Call Control Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE • 2-Way Jitsi Call</span>
              </div>
              <span className="hidden md:inline text-xs text-slate-300 font-medium truncate max-w-xs">
                {session?.skill_name} with {counterpartyName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen Toggle */}
              <button
                onClick={toggleContainerFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
              </button>

              {/* End Call Button */}
              <button
                onClick={triggerHangup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                title="End Video Call"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>

          {/* Embedded Jitsi Meeting Iframe Container */}
          <div
            ref={containerRef}
            className="w-full h-[540px] sm:h-[620px] bg-black relative"
          />
        </div>
      )}

      {/* 4. ENDED STATE (Call Concluded) */}
      {callState === 'ended' && (
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white border border-slate-700 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 mx-auto flex items-center justify-center border border-slate-700 shadow-inner">
            <PhoneOff className="w-8 h-8 text-rose-400" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black">Video Call Concluded</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Your 1-on-1 session video meeting with {counterpartyName} has ended.
              You can rejoin the meeting at any time or proceed with the Learning Goal Contract confirmation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={startMeeting}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejoin Video Call</span>
            </button>

            {onCancelSession && (
              <button
                onClick={onCancelSession}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <span>Report Cancellation</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Alert if Jitsi Fails to Load */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
