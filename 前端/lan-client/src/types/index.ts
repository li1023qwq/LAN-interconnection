import type { IFrame } from '@stomp/stompjs'

export type { IFrame }

export interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'RENAME';
  content?: string;
  sender: string;
  avatar?: string;
  oldUsername?: string;
  timestamp?: number;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: number;
}

export interface ScreenShare {
  type: string;
  sender: string;
  avatar?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  viewerId?: string;
} 