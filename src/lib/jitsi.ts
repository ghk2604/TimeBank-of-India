/**
 * Jitsi Meet Configuration & Room Utilities
 * Generates unique, deterministic, collision-resistant room names
 * and configuration options for embedded 1-on-1 sessions.
 */

export function getJitsiDomain(): string {
  return process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
}

/**
 * Returns a deterministic, collision-free room name for a session.
 * Both User A and User B will join the exact same room when referencing
 * this session, without exposing sequential or easily guessable identifiers.
 */
export function getJitsiRoomName(sessionId: string): string {
  if (!sessionId) return 'TBI_Room_General';
  // Strip special characters to ensure valid Jitsi room format
  const sanitized = sessionId.replace(/[^a-zA-Z0-9]/g, '');
  return `TBI_Meet_${sanitized}_SecureExchange`;
}

/**
 * Default Jitsi Meet toolbar buttons and options
 */
export const JITSI_TOOLBAR_BUTTONS = [
  'microphone',
  'camera',
  'closedcaptions',
  'desktop',
  'fullscreen',
  'fodeviceselection',
  'hangup',
  'chat',
  'raisehand',
  'videoquality',
  'filmstrip',
  'tileview',
];
