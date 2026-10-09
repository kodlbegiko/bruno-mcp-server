import { Peer, DataConnection } from 'peerjs';
import { PeerMessage } from '../../types/multiplayer';

export class PeerConnectionManager {
  private peerInstance: Peer | null = null;
  private hostConnections = new Map<string, DataConnection>();
  private guestConnectionToHost: DataConnection | null = null;
  private reconnectTimer: any = null;
  private heartbeatInterval: any = null;
  private heartbeatWatchdog: any = null;
  private lastHeartbeatTimestamp = 0;
  private isManualLeave = false;

  getPeer(): Peer | null {
    return this.peerInstance;
  }

  setPeer(peer: Peer | null) {
    this.peerInstance = peer;
  }

  getHostConnections(): Map<string, DataConnection> {
    return this.hostConnections;
  }

  getGuestConnection(): DataConnection | null {
    return this.guestConnectionToHost;
  }

  setGuestConnection(conn: DataConnection | null) {
    this.guestConnectionToHost = conn;
  }

  setManualLeave(val: boolean) {
    this.isManualLeave = val;
  }

  getManualLeave(): boolean {
    return this.isManualLeave;
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  setReconnectTimer(timer: any) {
    this.clearReconnectTimer();
    this.reconnectTimer = timer;
  }

  /**
   * Broadcast message to all active guest connections on the host.
   */
  broadcastToGuests(message: PeerMessage): void {
    this.hostConnections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (err) {
          console.warn('[PeerManager] Failed to send to guest:', conn.peer, err);
        }
      }
    });
  }

  /**
   * Send message to the host from the guest.
   */
  sendToHost(message: PeerMessage): boolean {
    if (this.guestConnectionToHost && this.guestConnectionToHost.open) {
      try {
        this.guestConnectionToHost.send(message);
        return true;
      } catch (err) {
        console.warn('[PeerManager] Failed to send to host:', err);
      }
    }
    return false;
  }

  /**
   * Record that a heartbeat or message was received.
   */
  recordHeartbeat(): void {
    this.lastHeartbeatTimestamp = Date.now();
  }

  /**
   * Start heartbeat PING loop and watchdog.
   * If onTimeout is triggered, connection has silently stalled.
   */
  startHeartbeat(
    sendPingFn: () => void,
    onTimeout: () => void,
    intervalMs = 3500,
    timeoutMs = 9000
  ): void {
    this.stopHeartbeat();
    this.recordHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      sendPingFn();
    }, intervalMs);

    const checkInterval = Math.max(500, Math.min(2000, Math.floor(timeoutMs / 2)));
    this.heartbeatWatchdog = setInterval(() => {
      if (Date.now() - this.lastHeartbeatTimestamp >= timeoutMs) {
        console.warn('[PeerManager] Heartbeat timed out, connection considered dead.');
        this.stopHeartbeat();
        onTimeout();
      }
    }, checkInterval);
  }

  /**
   * Stop heartbeat pinging and watchdog timers.
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatWatchdog) {
      clearInterval(this.heartbeatWatchdog);
      this.heartbeatWatchdog = null;
    }
  }

  /**
   * Clean up all active connections, peers, and background timers.
   */
  cleanup(): void {
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.guestConnectionToHost) {
      try {
        this.guestConnectionToHost.close();
      } catch {}
      this.guestConnectionToHost = null;
    }

    this.hostConnections.forEach((conn) => {
      try {
        conn.close();
      } catch {}
    });
    this.hostConnections.clear();

    if (this.peerInstance) {
      try {
        this.peerInstance.destroy();
      } catch {}
      this.peerInstance = null;
    }
  }
}

export const peerManager = new PeerConnectionManager();
