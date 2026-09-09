'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Video, PhoneOff, Maximize2, Minimize2, ShieldCheck, 
  Radio, RotateCcw, AlertCircle, Sparkles, ExternalLink
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

  // States: 'idle' | 'active' | 'ended'
  const [isCallActive, setIsCallActive] = useState<boolean>(autoJoin);
  const [isCallEnded, setIsCallEnded] = useState<boolean>(false);
  const [isIframeReady, setIsIframeReady] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isTeacher = session?.teacher_id === currentUser?.id;
  const counterpartyName = isTeacher ? session?.learner_name : session?.teacher_name;
  const counterpartyAvatar = isTeacher ? session?.learner_avatar : session?.teacher_avatar;
  const counterpartyRole = isTeacher ? 'Learner (Consumer)' : 'Teacher (Provider)';
  const roomName = getJitsiRoomName(session?.id);
  const domain = getJitsiDomain();

  const handleEndCall = useCallback(() => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        console.warn('Error disposing Jitsi API:', e);
      }
      jitsiApiRef.current = null;
    }
    setIsCallActive(false);
    setIsCallEnded(true);
    setIsIframeReady(false);
    if (onEndCall) onEndCall();
  }, [onEndCall]);

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

  // Start Meeting handler
  const startMeeting = () => {
    setIsCallEnded(false);
    setIsCallActive(true);
    setIsIframeReady(false);
    setErrorMessage(null);
  };

  // Initialize Jitsi Meet when isCallActive is true
  useEffect(() => {
    if (!isCallActive) return;

    let isSubscribed = true;

    const initJitsi = () => {
      if (!containerRef.current || !isSubscribed) return;

      // Clean up previous instance if any
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {}
        jitsiApiRef.current = null;
      }
      containerRef.current.innerHTML = '';

      const userName = currentUser?.fullName || currentUser?.username || (isTeacher ? 'Teacher' : 'Learner');
      const userEmail = currentUser?.email || '';

      if ((window as any).JitsiMeetExternalAPI) {
        try {
          const options = {
            roomName: roomName,
            parentNode: containerRef.current,
            width: '100%',
            height: '100%',
            userInfo: {
              displayName: userName,
              email: userEmail,
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
              channelLastN: -1,
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
            if (isSubscribed) setIsIframeReady(true);
          });

          api.addListener('readyToClose', () => {
            if (isSubscribed) handleEndCall();
          });

          api.addListener('videoConferenceLeft', () => {
            if (isSubscribed) handleEndCall();
          });

          // Safety timeout: dismiss loading overlay after 3 seconds even if event is delayed
          setTimeout(() => {
            if (isSubscribed) setIsIframeReady(true);
          }, 3000);

        } catch (err: any) {
          console.error('Error instantiating Jitsi Meet:', err);
          if (isSubscribed) {
            loadDirectIframeFallback();
          }
        }
      } else {
        // Load external_api.js script
        const existingScript = document.getElementById('jitsi-external-api-script');
        if (existingScript) {
          existingScript.onload = () => {
            if (isSubscribed) initJitsi();
          };
          return;
        }

        const script = document.createElement('script');
        script.id = 'jitsi-external-api-script';
        script.src = `https://${domain}/external_api.js`;
        script.async = true;
        script.onload = () => {
          if (isSubscribed) initJitsi();
        };
        script.onerror = () => {
          console.warn('Could not load external_api.js, switching to direct iframe fallback');
          if (isSubscribed) loadDirectIframeFallback();
        };
        document.body.appendChild(script);
      }
    };

    // Direct fallback if external script fails
    const loadDirectIframeFallback = () => {
      if (!containerRef.current || !isSubscribed) return;
      containerRef.current.innerHTML = '';
      const userName = encodeURIComponent(currentUser?.fullName || currentUser?.username || 'User');
      const iframe = document.createElement('iframe');
      iframe.src = `https://${domain}/${roomName}#userInfo.displayName="${userName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; fullscreen; display-capture; autoplay; clipboard-write';
      containerRef.current.appendChild(iframe);
      setIsIframeReady(true);
    };

    initJitsi();

    return () => {
      isSubscribed = false;
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {}
        jitsiApiRef.current = null;
      }
    };
  }, [isCallActive, roomName, domain, counterpartyName, currentUser, isTeacher, handleEndCall]);

  const toggleFullscreen = () => {
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
      {!isCallActive && !isCallEnded && (
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="max-w-xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Jitsi Meet Secure 1-on-1 Video Room</span>
            </div>

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

      {/* 2. ACTIVE LIVE CALL STATE (Always Visible when Active) */}
      {isCallActive && (
        <div className="rounded-3xl bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
          {/* Live Call Control Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE • Jitsi 2-Way Video & Audio</span>
              </div>
              <span className="hidden md:inline text-xs text-slate-300 font-medium truncate max-w-xs">
                {session?.skill_name} with {counterpartyName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
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

          {/* Embedded Jitsi Meeting Iframe Container (Always Mounted & Visible) */}
          <div className="relative w-full h-[560px] sm:h-[640px] bg-black">
            <div
              ref={containerRef}
              className="w-full h-full"
            />

            {/* Subtle Non-blocking Connecting Spinner (Fades out when ready) */}
            {!isIframeReady && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white space-y-4 z-10 pointer-events-none transition-opacity duration-300">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                  <Video className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold">Connecting to Private Meeting Room...</h3>
                  <p className="text-xs text-slate-400">
                    Connecting camera, microphone, and audio bridge for {counterpartyName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ENDED STATE (Call Concluded) */}
      {isCallEnded && (
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

      {/* Error Alert if Jitsi Fails */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
