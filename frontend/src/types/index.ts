// ============================================================================
// TypeScript Types and Interfaces for AI Babysitter Frontend
// ============================================================================

// Session Management
export interface Session {
  id?: number; // Database ID (optional for backward compatibility)
  session_id: string;
  child_name: string;
  child_age: number;
  parent_id: string;
  start_time: string;
  end_time?: string;
  is_active: boolean;
}

export interface SessionContextType {
  session: Session | null;
  startSession: (childName: string, childAge: number, parentId: string) => Promise<void>;
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
  safety_flag?: boolean;
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

export interface ImageAnalysisRequest {
  image: string; // base64
  context: string;
  session_id: string;
  child_age?: number; // Optional - child's age for age-appropriate responses
  prompt?: string; // Optional - additional instructions for the AI
}

export interface ImageAnalysisResponse {
  analysis: string;
  safety_alert?: string;
}

// Activities
export enum ActivityType {
  STORY_TIME = 'story_time',
  I_SPY = 'i_spy',
  HOMEWORK_HELPER = 'homework_helper',
  FREE_CHAT = 'free_chat'
}

export interface Activity {
  id: string;
  session_id: string;
  activity_type: ActivityType;
  start_time: string;
  end_time?: string;
  description: string;
  data?: any;
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

export interface Alert {
  id: string;
  session_id: string;
  timestamp: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  context?: string;
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

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
