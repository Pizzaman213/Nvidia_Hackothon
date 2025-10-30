// ============================================================================
// API Service Layer - Backend Communication
// ============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ChatRequest,
  ChatResponse,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  Alert,
  Activity,
  Session,
  ParentSettings,
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for adding auth tokens, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.message);
    console.error('Full error:', error);

    if (error.response) {
      // Server responded with error status
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // Request made but no response
      console.error('No response received');
      console.error('Request:', error.request);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API Service Functions
// ============================================================================

export const api = {
  // Session Management
  session: {
    start: async (
      childName: string,
      childAge: number,
      parentId: string
    ): Promise<Session> => {
      // Backend returns Session directly, not wrapped in ApiResponse
      const requestData = {
        child_name: childName,
        child_age: childAge,
        parent_id: parentId,
      };

      console.log('Creating session with data:', requestData);

      const response = await apiClient.post<Session>('/api/sessions', requestData);

      console.log('Session created successfully:', response.data);
      return response.data;
    },

    end: async (sessionId: string): Promise<void> => {
      await apiClient.post(`/api/sessions/${sessionId}/end`);
    },

    get: async (sessionId: string): Promise<Session> => {
      // Backend returns Session directly, not wrapped in ApiResponse
      const response = await apiClient.get<Session>(
        `/api/sessions/${sessionId}`
      );

      return response.data;
    },
  },

  // Chat and Voice Interaction
  chat: {
    sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
      // Backend returns ChatResponse directly, not wrapped
      const response = await apiClient.post<ChatResponse>(
        '/api/chat',
        request
      );

      return response.data;
    },
  },

  // Image Analysis (Camera)
  image: {
    analyze: async (request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> => {
      // Backend expects multipart/form-data with file upload
      // NOT JSON - so we need to create FormData

      // Convert base64 to Blob
      const base64Data = request.image.split(',')[1] || request.image;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      formData.append('session_id', request.session_id);
      formData.append('context', request.context);

      // Optional fields
      if (request.child_age) {
        formData.append('child_age', request.child_age.toString());
      }
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }

      // Send as multipart/form-data
      const response = await apiClient.post<ImageAnalysisResponse>(
        '/api/images/analyze',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    },
  },

  // Alerts
  alerts: {
    getAll: async (sessionId: string): Promise<Alert[]> => {
      // Backend returns Alert[] directly, not wrapped
      const response = await apiClient.get<Alert[]>(
        `/api/alerts/${sessionId}`
      );

      return response.data;
    },

    getUnresolved: async (sessionId: string): Promise<Alert[]> => {
      // Backend returns Alert[] directly, not wrapped
      const response = await apiClient.get<Alert[]>(
        `/api/alerts/${sessionId}/unresolved`
      );

      return response.data;
    },

    resolve: async (alertId: string): Promise<void> => {
      await apiClient.put(`/api/alerts/${alertId}/resolve`);
    },
  },

  // Activities
  activities: {
    getAll: async (
      sessionId: string,
      page: number = 1,
      pageSize: number = 20
    ): Promise<Activity[]> => {
      // Backend returns Activity[] directly (not paginated yet)
      const response = await apiClient.get<Activity[]>(
        `/api/activities/${sessionId}`,
        { params: { page, page_size: pageSize } }
      );

      return response.data;
    },

    create: async (sessionId: string, activityType: string, description: string): Promise<Activity> => {
      // Backend returns Activity directly, not wrapped
      const response = await apiClient.post<Activity>(
        '/api/activities',
        {
          session_id: sessionId,
          activity_type: activityType,
          details: description ? { description } : null,
        }
      );

      return response.data;
    },

    end: async (activityId: string): Promise<void> => {
      await apiClient.put(`/api/activities/${activityId}/end`);
    },
  },

  // Parent Settings
  settings: {
    get: async (parentId: string): Promise<ParentSettings> => {
      // Backend returns ParentSettings directly, not wrapped
      const response = await apiClient.get<ParentSettings>(
        `/api/settings/${parentId}`
      );

      return response.data;
    },

    update: async (parentId: string, settings: Partial<ParentSettings>): Promise<ParentSettings> => {
      // Backend returns ParentSettings directly, not wrapped
      const response = await apiClient.put<ParentSettings>(
        `/api/settings/${parentId}`,
        settings
      );

      return response.data;
    },
  },

  // Emergency/Panic
  emergency: {
    trigger: async (sessionId: string, reason?: string): Promise<void> => {
      await apiClient.post('/api/emergency', {
        session_id: sessionId,
        reason: reason || 'Child triggered panic button',
      });
    },
  },

  // Parent Assistant - AI-powered parenting advice
  parentAssistant: {
    getAdvice: async (request: {
      session_id: string;
      parent_question: string;
      include_conversation_history?: boolean;
    }): Promise<{
      advice: string;
      conversation_summary: string | null;
      key_insights: string[];
      suggested_actions: string[];
    }> => {
      const response = await apiClient.post(
        '/api/parent-assistant',
        request
      );
      return response.data;
    },

    getConversationSummary: async (sessionId: string): Promise<{
      summary: string;
      message_count: number;
      emotions_detected: string[];
      child_name: string;
      child_age: number;
    }> => {
      const response = await apiClient.get(
        `/api/parent-assistant/conversation-summary/${sessionId}`
      );
      return response.data;
    },
  },
};

export default api;
