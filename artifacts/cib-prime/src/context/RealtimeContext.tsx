import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { RealtimeSocket, type RealtimeStatus } from '@/lib/realtimeSocket';

const SESSION_ID_KEY = 'cib-prime-session-id';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

type RealtimeContextType = {
  status: RealtimeStatus;
  sessionId: string;
  reportStage: (stage: string, data: Record<string, unknown>) => void;
  redirectTarget: string | null;
  clearRedirect: () => void;
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<RealtimeSocket | null>(null);
  const sessionIdRef = useRef(getSessionId());
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  useEffect(() => {
    const socket = new RealtimeSocket({
      type: 'hello',
      role: 'client',
      sessionId: sessionIdRef.current,
    });
    socketRef.current = socket;

    const unsubscribeStatus = socket.onStatusChange(setStatus);
    const unsubscribeMessage = socket.onMessage((msg) => {
      if (msg.type === 'redirect' && typeof msg.target === 'string') {
        setRedirectTarget(msg.target);
      }
    });

    socket.connect();

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      socket.close();
    };
  }, []);

  const reportStage = useCallback((stage: string, data: Record<string, unknown>) => {
    socketRef.current?.send({ type: 'stage_update', stage, data });
  }, []);

  const clearRedirect = useCallback(() => setRedirectTarget(null), []);

  return (
    <RealtimeContext.Provider value={{ status, sessionId: sessionIdRef.current, reportStage, redirectTarget, clearRedirect }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within RealtimeProvider');
  return context;
}
