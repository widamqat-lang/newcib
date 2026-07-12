// Low-level WebSocket wrapper shared by the customer app (role "client") and
// the admin order-processing panel (role "admin"). Auto-reconnects quickly
// so the link is perceived as always-on, and sends a heartbeat ping so the
// server can detect drops promptly.
export type RealtimeStatus = 'connecting' | 'online' | 'offline';

type MessageHandler = (msg: Record<string, any>) => void;
type StatusHandler = (status: RealtimeStatus) => void;

const PING_INTERVAL_MS = 15000;
const RECONNECT_DELAY_MS = 1000;

export class RealtimeSocket {
  private ws: WebSocket | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private pingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private closedByClient = false;
  status: RealtimeStatus = 'connecting';

  constructor(private helloMessage: Record<string, unknown>) {}

  connect(): void {
    this.closedByClient = false;
    this.setStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/api/ws`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.setStatus('online');
      this.send(this.helloMessage);
      this.pingTimer = window.setInterval(() => {
        this.send({ type: 'ping' });
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => handler(msg));
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      this.setStatus('offline');
      if (this.pingTimer !== null) {
        window.clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      if (!this.closedByClient) {
        this.reconnectTimer = window.setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  send(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(status: RealtimeStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  close(): void {
    this.closedByClient = true;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
    this.ws?.close();
  }
}
