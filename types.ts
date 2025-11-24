export interface Agent {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  imageUrl: string;
  systemInstruction: string;
  initialContextKeys: string[]; // Keys we expect to capture
  traits: string[];
}

export interface ContextField {
  key: string;
  label: string;
  value: string | null;
  isVerified: boolean;
}

export interface SessionState {
  isConnected: boolean;
  isSpeaking: boolean; // AI is speaking
  isListening: boolean; // Mic is active
  volume: number; // For visualizer
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum View {
  GALLERY = 'GALLERY',
  SESSION = 'SESSION',
}