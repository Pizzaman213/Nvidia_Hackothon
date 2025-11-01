// ============================================================================
// TypeScript Types and Interfaces for AI Babysitter Frontend
// ============================================================================

// Child Profile Management
export interface Child {
  id: number;
  child_id: string;
  parent_id: string;
  name: string;
  age: number;
  gender?: 'boy' | 'girl' | null;
  avatar_color: string;
  profile_picture_url?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

export interface ChildCreate {
  name: string;
  age: number;
  gender?: 'boy' | 'girl' | null;
  avatar_color?: string;
  profile_picture_url?: string;
  emergency_contact?: string;
}

export interface ChildUpdate {
  name?: string;
  age?: number;
  gender?: 'boy' | 'girl' | null;
  avatar_color?: string;
  profile_picture_url?: string;
  emergency_contact?: string;
}

export interface ChildSummary {
  child: Child;
  stats: {
    total_sessions: number;
    active_sessions: number;
    total_activities: number;
    total_alerts: number;
    unresolved_alerts: number;
  };
}

// Child-specific settings
export interface ChildSettings {
  id: number;
  child_id: number;
  allowed_activities: ActivityType[];
  session_timeout_minutes: number;
  content_filter_level: 'strict' | 'moderate' | 'relaxed';
  enable_camera: boolean;
  enable_microphone: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildSettingsUpdate {
  allowed_activities?: ActivityType[];
  session_timeout_minutes?: number;
  content_filter_level?: 'strict' | 'moderate' | 'relaxed';
  enable_camera?: boolean;
  enable_microphone?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

// Session Management
export interface Session {
  id?: number; // Database ID (optional for backward compatibility)
  session_id: string;
  child_id?: string; // Links to child profile
  child_name: string;
  child_age: number;
  child_gender?: 'boy' | 'girl' | null; // Theme preference
  parent_id: string;
  start_time: string;
  end_time?: string;
  is_active: boolean;
}

export interface SessionContextType {
  session: Session | null;
  startSession: (childName: string, childAge: number, parentId: string, childGender?: 'boy' | 'girl' | null) => Promise<void>;
  endSession: () => void;
  loading: boolean;
  error: string | null;
}

// Chat and Voice
export interface Message {
  id: string;
  content: string;
  sender: 'child' | 'ai';
  timestamp: Date;
  audio_url?: string;
  requires_camera?: boolean;
  ai_reasoning?: string; // AI's internal thinking (for parent view)
}

export interface ChatMessage {
  id: number;
  session_id: string;
  timestamp: string;
  role: string; // 'child' or 'assistant'
  content: string;
  audio_url?: string;
  has_image: boolean;
  emotion?: string;
}

export interface ChatRequest {
  message: string;
  session_id: string;
  child_age: number;
}

export interface ChatResponse {
  response: string;
  audio_url?: string;
  requires_camera?: boolean;
  safety_status: string; // Backend returns this field (e.g., "none", "low", "medium", "high", "critical")
  emotion?: string; // Detected emotion from child's message
  ai_reasoning?: string; // AI's internal thinking process (visible to parents only)
  sources?: Array<{
    title: string;
    url: string;
    type: string;
    relevance: number;
  }>; // RAG source citations
}

// Voice Interface
export interface VoiceContextType {
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  error: string | null;
}

// Camera
export interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
}

export type ImageAnalysisContext = 'homework' | 'game' | 'safety_check' | 'show_tell';

export interface ImageAnalysisRequest {
  image: string; // base64
  context: ImageAnalysisContext;
  session_id: string;
  child_age?: number; // Optional - child's age for age-appropriate responses
  prompt?: string; // Optional - additional instructions for the AI
}

export interface ImageAnalysisResponse {
  analysis: string;
  detected_objects?: string[]; // For game mode (I Spy)
  safety_alert?: string;
  ai_response: string; // Child-friendly response from AI
}

// Activities
export enum ActivityType {
  STORY_TIME = 'story_time',
  I_SPY = 'i_spy',
  HOMEWORK_HELPER = 'homework_helper',
  FREE_CHAT = 'free_chat'
}

export interface Activity {
  id: number; // Backend returns number, not string
  session_id: string;
  activity_type: string; // Backend returns string, not enum (can be converted to ActivityType)
  start_time: string;
  end_time?: string;
  description?: string; // Backend may not always include this
  details?: any; // Backend returns 'details' with message count, etc.
  images_used?: number; // Backend includes this field
  data?: any; // Keep for backward compatibility
}

export interface ActivityCard {
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  color: string;
  requiresCamera: boolean;
}

// Alerts and Safety
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Backend alert levels (matches backend AlertLevel enum)
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export interface Alert {
  id: number; // Backend returns number, not string
  session_id: string;
  timestamp: string;
  alert_level: AlertLevel; // Backend uses 'alert_level', not 'severity'
  message: string;
  context?: string;
  ai_assessment?: string; // Backend includes AI assessment
  requires_action: boolean; // Backend includes this field
  parent_notified: boolean; // Backend includes this field
  resolved: boolean;
}

export interface SafetySettings {
  allowed_activities: ActivityType[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  emergency_contact: string;
  enable_camera: boolean;
  enable_microphone: boolean;
  session_timeout_minutes: number;
  content_filter_level: 'strict' | 'moderate' | 'relaxed';
}

// Parent Dashboard
export interface ParentSettings {
  parent_id: string;
  child_name: string;
  child_age: number;
  safety_settings: SafetySettings;
  notification_preferences: {
    email: boolean;
    push: boolean;
    alert_threshold: AlertSeverity;
  };
}

export interface ActivitySummary {
  date: string;
  total_duration_minutes: number;
  activities: {
    [key in ActivityType]?: number; // count
  };
  alert_count: number;
  total_messages: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total_count: number;
  has_more: boolean;
}

// UI State
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
}

// Web Speech API Types (for browsers that don't have them)
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Theme Management
export type ThemeType = 'boy' | 'girl' | 'neutral' | 'teen';

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
}

export interface ThemePreference {
  childId?: string; // Which child this preference is for
  theme: ThemeType;
  customColors?: Partial<ColorScheme>;
  autoTheme: boolean; // Whether to auto-select based on gender/age
  lastModified: string;
}

export interface ParentThemePreference {
  parentId: string;
  mode: 'dark' | 'light';
  accentColor?: string;
  preferences: {
    animations: boolean;
    compactMode: boolean;
    highContrast: boolean;
  };
}

export interface ThemeContextType {
  // Child theme
  childTheme: ThemeType;
  childColors: ColorScheme;
  setChildTheme: (theme: ThemeType) => void;
  setCustomColors: (colors: Partial<ColorScheme>) => void;

  // Parent theme
  parentTheme: 'dark' | 'light';
  setParentTheme: (mode: 'dark' | 'light') => void;

  // Preferences
  preferences: ThemePreference | null;
  parentPreferences: ParentThemePreference | null;
  savePreferences: () => Promise<void>;
  loadPreferences: (childId?: string) => Promise<void>;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
