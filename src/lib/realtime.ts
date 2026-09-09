// Client-side instant event synchronization for cross-tab and cross-component updates

export type RequestEventType = 'REQUEST_CREATED' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'REQUEST_EXPIRED';

export interface RequestEventPayload {
  requestId?: string;
  learnerId?: string;
  learnerName?: string;
  learnerAvatar?: string;
  teacherId?: string;
  teacherName?: string;
  skillName?: string;
  sessionId?: string;
  duration?: number;
  learningGoal?: string;
  creditCost?: number;
  timestamp?: number;
}

const CHANNEL_NAME = 'tbi_requests_channel';

// Singleton BroadcastChannel instance
let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

export function broadcastRequestEvent(type: RequestEventType, payload: RequestEventPayload = {}) {
  if (typeof window === 'undefined') return;

  const eventData = {
    type,
    payload,
    timestamp: Date.now(),
  };

  // 1. Same-window custom event (0ms dispatch)
  try {
    window.dispatchEvent(new CustomEvent('tbi_request_event', { detail: eventData }));
  } catch (e) {
    console.error('CustomEvent dispatch error:', e);
  }

  // 2. Cross-tab BroadcastChannel
  if (channel) {
    try {
      channel.postMessage(eventData);
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }

  // 3. Cross-tab fallback via localStorage
  try {
    localStorage.setItem('tbi_request_sync', JSON.stringify(eventData));
  } catch (e) {
    // Ignore quota or disabled storage errors
  }
}

export function subscribeToRequestEvents(callback: (type: RequestEventType, payload: RequestEventPayload) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Handler for custom DOM event
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent?.detail) {
      callback(customEvent.detail.type, customEvent.detail.payload || {});
    }
  };

  // Handler for BroadcastChannel
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data.type, e.data.payload || {});
    }
  };

  // Handler for Storage Event
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'tbi_request_sync' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.type) {
          callback(parsed.type, parsed.payload || {});
        }
      } catch (err) {
        // Ignore parse error
      }
    }
  };

  window.addEventListener('tbi_request_event', handleCustomEvent);
  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage);
  }
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('tbi_request_event', handleCustomEvent);
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}
