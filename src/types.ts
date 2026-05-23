export interface Rectangle {
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  width: number; // percentage of canvas width (0 to 100)
  height: number; // percentage of canvas height (0 to 100)
}

export interface SelectedRegion {
  id: string;
  pageNumber: number;
  rect: Rectangle;
  text?: string;
  image?: string; // base64 representation of this crop
  selectionMode?: 'text' | 'image'; // mode used when region was drawn
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'gemini';
  text: string;
  timestamp: string;
}

export interface TagSession {
  id: string; // unique lowercase ID
  name: string; // display name (e.g. "Core Concept 1")
  color: string; // hex or tailwind class color (e.g. "bg-amber-500/10 border-amber-500")
  themeColor: string; // visual clean hex code
  regions: SelectedRegion[];
  chatHistory: ChatMessage[];
  selectionMode: 'text' | 'image';
  isProcessing: boolean;
  isDefault?: boolean; // true for the 4 pre-built tags
  notes?: string; // quick scratchpad note for this tag (persisted in sessions_json)
}

export type ModelProvider = 'gemini' | 'local';

export type UserRole = 'admin' | 'user';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  token: string | null;
}

export interface ProviderSettings {
  provider: ModelProvider;
  localBaseUrl: string;
  localModel: string;
  userGeminiApiKey: string;
  userGeminiModel: string;
}

export interface HistoryItem {
  id: string;
  name: string;
  pdf_filename?: string | null;
  pdf_base64?: string | null;
  current_page: number;
  sessions_json?: string;
  created_at: string;
}

export interface FutureModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
}
