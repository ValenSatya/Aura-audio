import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { AccountManager } from './accountManager';

export interface SyncPlaybackState {
  currentTrack: any | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: any[];
  repeatMode: string;
  isShuffle: boolean;
}

export class SyncServer {
  private static wss: WebSocketServer | null = null;
  private static clients: Set<WebSocket> = new Set();
  private static currentState: SyncPlaybackState = {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    queue: [],
    repeatMode: 'off',
    isShuffle: false,
  };

  private static commandListeners: Array<(cmd: { action: string; payload?: any }) => void> = [];

  public static init(server: http.Server, accountManager: AccountManager) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ server, path: '/ws/sync' });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('[SyncServer] Mobile device connected via WebSocket');

      // Send current state and user profile on connect
      const user = accountManager.getCurrentUser();
      ws.send(
        JSON.stringify({
          type: 'init:state',
          user,
          state: this.currentState,
        })
      );

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'playback:command') {
            for (const listener of this.commandListeners) {
              listener(data.command);
            }
          }
        } catch (e) {
          console.warn('[SyncServer] Bad payload from client:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[SyncServer] Mobile device disconnected');
      });
    });
  }

  public static broadcastPlaybackState(state: Partial<SyncPlaybackState>) {
    this.currentState = { ...this.currentState, ...state };
    const payload = JSON.stringify({
      type: 'playback:state',
      state: this.currentState,
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public static onCommand(listener: (cmd: { action: string; payload?: any }) => void) {
    this.commandListeners.push(listener);
  }
}
