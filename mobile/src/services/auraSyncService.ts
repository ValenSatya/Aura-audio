/**
 * AuraSync Hybrid Client for Mobile Android
 * Connects to Laptop on Local Wi-Fi (<10ms) or Cloud Room Relay
 */

export interface RemoteUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

export interface RemotePlaybackState {
  currentTrack: any | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

type SyncListener = (data: { isConnected: boolean; user: RemoteUser | null; state: RemotePlaybackState | null }) => void;

export class AuraSyncService {
  private static ws: WebSocket | null = null;
  private static listeners: Set<SyncListener> = new Set();
  private static isConnected: boolean = false;
  private static user: RemoteUser | null = null;
  private static state: RemotePlaybackState | null = null;
  private static reconnectTimer: number | null = null;
  private static localHostIp: string = '192.168.1.100'; // Default gateway or configurable

  public static subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({ isConnected: this.isConnected, user: this.user, state: this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    for (const l of this.listeners) {
      l({ isConnected: this.isConnected, user: this.user, state: this.state });
    }
  }

  public static connect(ip?: string) {
    if (ip) this.localHostIp = ip;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      // Connect to Desktop WebSocket server on port 45454
      const wsUrl = `ws://${this.localHostIp}:45454/ws/sync`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[AuraSync] Connected to Laptop');
        this.isConnected = true;
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init:state') {
            if (data.user) {
              this.user = {
                id: data.user.id,
                name: data.user.name,
                username: data.user.username,
                avatarUrl: data.user.avatarUrl,
              };
            }
            if (data.state) {
              this.state = data.state;
            }
            this.notify();
          } else if (data.type === 'playback:state') {
            this.state = data.state;
            this.notify();
          }
        } catch (e) {
          console.warn('[AuraSync] Parse error:', e);
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notify();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify();
        this.scheduleReconnect();
      };
    } catch {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private static scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, 10000);
  }

  public static sendCommand(action: string, payload?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'playback:command',
          command: { action, payload },
        })
      );
    }
  }
}
