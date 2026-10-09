import { PeerJSOption } from 'peerjs';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:openrelay.metered.ca:80' },
];

export const PEER_CONFIG: PeerJSOption = {
  debug: 0,
  config: {
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
  },
};

export function generateRoomCode(): string {
  // Generate a distinct 6-character uppercase alphanumeric code (excluding ambiguous 0/O, 1/I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatPeerId(roomCode: string, suffix?: string): string {
  const sanitized = roomCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (suffix) {
    return `dk-${sanitized}-${suffix}`;
  }
  return `dk-${sanitized}`;
}
