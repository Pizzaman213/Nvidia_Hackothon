// ============================================================================
// API Service Layer - Backend Communication
// ============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  Alert,
  Activity,
  Session,
  ParentSettings,
  Child,
  ChildCreate,
  ChildUpdate,
  ChildSummary,
  ChildSettings,
  ChildSettingsUpdate,
} from '../types';
import { logger, LogCategory } from '../utils/logger';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

logger.info(LogCategory.API, `API Client initialized with base URL: ${API_BASE_URL}`);

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
    // Log the outgoing request
    logger.api.request(
      config.url || 'unknown',
      config.method?.toUpperCase() || 'UNKNOWN',
      config.data
    );

    // Add any auth tokens here if needed
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    logger.error(LogCategory.API, 'Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses
    logger.api.response(
      response.config.url || 'unknown',
      response.status,
      response.data
    );
    return response;
  },
  (error: AxiosError) => {
    const endpoint = error.config?.url || 'unknown';

    if (error.response) {
      // Server responded with error status
      logger.api.error(endpoint, error, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // Request made but no response
      logger.api.error(endpoint, error, {
        message: 'No response received from server',
        request: error.request,
      });
    } else {
      // Something else happened
      logger.api.error(endpoint, error, {
        message: 'Error setting up request',
      });
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
      childNameOrId: string, // Can be child_id or child_name
      childAge: number,
      parentId: string,
      childGender?: 'boy' | 'girl' | null,
      isChildId: boolean = false // Flag to indicate if first param is child_id
    ): Promise<Session> => {
      // Backend returns Session directly, not wrapped in ApiResponse
      const requestData: any = {
        parent_id: parentId,
      };

      if (isChildId) {
        // Using child profile ID
        requestData.child_id = childNameOrId;
      } else {
        // Legacy: using name, age, gender directly
        requestData.child_name = childNameOrId;
        requestData.child_age = childAge;
        requestData.child_gender = childGender;
      }

      logger.session.start('pending', isChildId ? 'child_profile' : childNameOrId, childAge);

      try {
        const response = await apiClient.post<Session>('/api/sessions', requestData);
        logger.session.start(response.data.session_id, response.data.child_name, response.data.child_age);
        return response.data;
      } catch (error) {
        logger.session.error('Failed to start session', error as Error);
        throw error;
      }
    },

    // Convenience method for starting session with child profile
    startWithChild: async (childId: string, parentId: string): Promise<Session> => {
      logger.info(LogCategory.SESSION, `Starting session with child profile: ${childId}`);
      const requestData = {
        child_id: childId,
        parent_id: parentId,
      };

      try {
        const response = await apiClient.post<Session>('/api/sessions', requestData);
        logger.session.start(response.data.session_id, response.data.child_name, response.data.child_age);
        return response.data;
      } catch (error) {
        logger.session.error('Failed to start session with child profile', error as Error);
        throw error;
      }
    },

    end: async (sessionId: string): Promise<void> => {
      logger.info(LogCategory.SESSION, `Ending session: ${sessionId}`);
      try {
        await apiClient.post(`/api/sessions/${sessionId}/end`);
        logger.session.end(sessionId);
      } catch (error) {
        logger.session.error(`Failed to end session: ${sessionId}`, error as Error);
        throw error;
      }
    },

    get: async (sessionId: string): Promise<Session> => {
      logger.debug(LogCategory.SESSION, `Fetching session: ${sessionId}`);
      const response = await apiClient.get<Session>(
        `/api/sessions/${sessionId}`
      );
      return response.data;
    },

    getMessages: async (sessionId: string, limit: number = 50): Promise<ChatMessage[]> => {
      logger.debug(LogCategory.SESSION, `Fetching messages for session: ${sessionId}`);
      const response = await apiClient.get<ChatMessage[]>(
        `/api/sessions/${sessionId}/messages`,
        { params: { limit } }
      );
      return response.data;
    },

    getByParentId: async (parentId: string): Promise<Session[]> => {
      logger.debug(LogCategory.SESSION, `Fetching sessions for parent: ${parentId}`);
      try {
        const response = await apiClient.get<Session[]>(
          `/api/sessions/parent/${parentId}`
        );
        return response.data;
      } catch (error) {
        logger.error(LogCategory.SESSION, `Failed to fetch parent sessions: ${parentId}`, error as Error);
        throw error;
      }
    },
  },

  // Chat and Voice Interaction
  chat: {
    sendMessage: async (request: ChatRequest, retries = 2): Promise<ChatResponse> => {
      logger.info(LogCategory.API, 'Sending chat message', {
        sessionId: request.session_id,
        messageLength: request.message.length,
        childAge: request.child_age,
      });

      let lastError: any;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            logger.info(LogCategory.API, `Retry attempt ${attempt} for chat message`);
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }

          // Backend returns ChatResponse directly, not wrapped
          const response = await apiClient.post<ChatResponse>(
            '/api/chat',
            request
          );

          logger.info(LogCategory.API, 'Received chat response', {
            hasAudio: !!response.data.audio_url,
            requiresCamera: response.data.requires_camera,
            safetyStatus: response.data.safety_status,
            emotion: response.data.emotion,
          });

          // Check if safety status indicates a concern (not "none" or "low")
          if (response.data.safety_status && !['none', 'low'].includes(response.data.safety_status)) {
            logger.safety.alert('warning', `Safety concern detected: ${response.data.safety_status}`);
          }

          return response.data;
        } catch (error: any) {
          lastError = error;

          // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
          if (error.response?.status >= 400 && error.response?.status < 500) {
            if (error.response?.status !== 408 && error.response?.status !== 429) {
              logger.error(LogCategory.API, 'Client error - not retrying', error as Error);
              break;
            }
          }

          logger.warn(LogCategory.API, `Attempt ${attempt + 1} failed for chat message`, {
            error: error.message,
            willRetry: attempt < retries
          });
        }
      }

      logger.error(LogCategory.API, 'Failed to send chat message after all retries', lastError as Error);

      // Provide helpful error message based on error type
      let errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";

      if (lastError?.response?.status === 404) {
        errorMessage = "Session not found. Please start a new session.";
      } else if (lastError?.response?.status === 401 || lastError?.response?.status === 403) {
        errorMessage = "I need to be set up first! Please ask your parent to configure the NVIDIA API key. See the backend logs or NVIDIA_API_SETUP.md for help.";
      } else if (lastError?.response?.status === 429) {
        errorMessage = "I'm a bit busy right now. Please wait a minute and try again.";
      } else if (lastError?.message?.includes('Network Error') || lastError?.message?.includes('ECONNREFUSED')) {
        errorMessage = "I can't connect to the backend. Please make sure the backend server is running on http://localhost:8000";
      }

      // Return a fallback response instead of throwing
      return {
        response: errorMessage,
        audio_url: undefined,
        requires_camera: false,
        safety_status: 'none',
        emotion: 'neutral',
        ai_reasoning: undefined,
        sources: undefined
      };
    },

    generateStory: async (request: {
      session_id: string;
      theme: string;
      child_age: number;
      length?: 'short' | 'medium' | 'long';
      voice_output?: boolean;
    }, retries = 2): Promise<ChatResponse> => {
      logger.info(LogCategory.API, 'Generating story', {
        sessionId: request.session_id,
        theme: request.theme,
        length: request.length || 'medium',
      });

      let lastError: any;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            logger.info(LogCategory.API, `Retry attempt ${attempt} for story generation`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }

          const response = await apiClient.post<ChatResponse>(
            '/api/chat/story',
            request
          );

          logger.info(LogCategory.API, 'Story generated successfully', {
            hasAudio: !!response.data.audio_url,
          });

          return response.data;
        } catch (error: any) {
          lastError = error;

          // Don't retry on client errors (4xx) except 408 and 429
          if (error.response?.status >= 400 && error.response?.status < 500) {
            if (error.response?.status !== 408 && error.response?.status !== 429) {
              logger.error(LogCategory.API, 'Client error - not retrying', error as Error);
              break;
            }
          }

          logger.warn(LogCategory.API, `Attempt ${attempt + 1} failed for story generation`, {
            error: error.message,
            willRetry: attempt < retries
          });
        }
      }

      logger.error(LogCategory.API, 'Failed to generate story after all retries', lastError as Error);

      // Return a fallback story
      return {
        response: "I'm having trouble creating a story right now. How about we try something else, or you can ask me again in a moment!",
        audio_url: undefined,
        requires_camera: false,
        safety_status: 'none',
        emotion: 'neutral',
        ai_reasoning: undefined,
        sources: undefined
      };
    },
  },

  // Image Analysis (Camera)
  image: {
    analyze: async (
      request: ImageAnalysisRequest,
      onProgress?: (progress: number) => void
    ): Promise<ImageAnalysisResponse> => {
      logger.info(LogCategory.CAMERA, 'Analyzing image', {
        sessionId: request.session_id,
        context: request.context,
        hasPrompt: !!request.prompt,
      });

      try {
        // Backend expects multipart/form-data with file upload
        // NOT JSON - so we need to create FormData

        // Convert base64 to Blob
        let base64Data = request.image;

        // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }

        // Clean the base64 string - remove any whitespace or invalid characters
        base64Data = base64Data.replace(/\s/g, '');

        // Validate base64 string before decoding
        if (!base64Data || base64Data.length === 0) {
          throw new Error('Invalid image data: empty base64 string');
        }

        // Check if it's valid base64 (basic check)
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64Data)) {
          throw new Error('Invalid image data: malformed base64 string');
        }

        let blob: Blob;
        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: 'image/jpeg' });
        } catch (decodeError) {
          logger.error(LogCategory.CAMERA, 'Failed to decode base64 image', decodeError as Error);
          throw new Error('Failed to decode image data. Please try taking the photo again.');
        }

        logger.debug(LogCategory.CAMERA, `Image size: ${blob.size} bytes`);

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

        // Send as multipart/form-data with upload progress tracking
        const response = await apiClient.post<ImageAnalysisResponse>(
          '/api/images/analyze',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
              }
            },
          }
        );

        logger.info(LogCategory.CAMERA, 'Image analysis complete', {
          hasAnalysis: !!response.data.analysis,
          hasSafetyAlert: !!response.data.safety_alert,
        });

        if (response.data.safety_alert) {
          logger.safety.alert('camera', 'Safety alert from image analysis', {
            alert: response.data.safety_alert,
          });
        }

        return response.data;
      } catch (error: any) {
        // Enhanced error handling with specific messages
        let errorMessage = 'Failed to analyze image';

        if (error.message?.includes('Invalid image data')) {
          // Base64 encoding issue
          errorMessage = error.message;
        } else if (error.response?.status === 413) {
          errorMessage = 'Image is too large. Please try taking a smaller photo.';
        } else if (error.response?.status === 503) {
          errorMessage = error.response?.data?.detail || 'Image analysis service is temporarily unavailable.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }

        logger.camera.error(errorMessage, error);

        // Re-throw with enhanced message
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).response = error.response;
        throw enhancedError;
      }
    },
  },

  // Alerts
  alerts: {
    getAll: async (sessionId: string): Promise<Alert[]> => {
      // Backend returns Alert[] directly, not wrapped
      const response = await apiClient.get<Alert[]>(
        `/api/sessions/${sessionId}/alerts`
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

    resolve: async (alertId: number | string): Promise<void> => {
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
        `/api/sessions/${sessionId}/activities`,
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
          description: description,
          details: null,
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
      logger.safety.panic(sessionId);
      logger.error(LogCategory.SAFETY, `EMERGENCY: Panic button triggered for session ${sessionId}`, undefined, { reason });

      try {
        await apiClient.post('/api/emergency', {
          session_id: sessionId,
          reason: reason || 'Child triggered panic button',
        });
        logger.info(LogCategory.SAFETY, 'Emergency notification sent successfully');
      } catch (error) {
        logger.error(LogCategory.SAFETY, 'CRITICAL: Failed to send emergency notification', error as Error);
        throw error;
      }
    },

    triggerWithoutSession: async (childId: string, parentId: string, childName: string, reason?: string): Promise<void> => {
      logger.error(LogCategory.SAFETY, `EMERGENCY: Panic button triggered without session - Child: ${childName} (${childId})`, undefined, { reason });

      try {
        await apiClient.post('/api/emergency/no-session', {
          child_id: childId,
          parent_id: parentId,
          child_name: childName,
          reason: reason || 'Child triggered panic button (no active session)',
        });
        logger.info(LogCategory.SAFETY, 'Session-less emergency notification sent successfully');
      } catch (error) {
        logger.error(LogCategory.SAFETY, 'CRITICAL: Failed to send session-less emergency notification', error as Error);
        throw error;
      }
    },
  },

  // Parent Assistant - AI-powered parenting advice
  parentAssistant: {
    getAdvice: async (request: {
      session_id: string;
      parent_question: string;
      include_conversation_history?: boolean;
      child_name?: string;
      child_age?: number;
    }): Promise<{
      advice: string;
      conversation_summary: string | null;
      key_insights: string[];
      suggested_actions: string[];
      citations: Array<{
        source: string;
        url: string;
        relevance: number;
        source_type: string;
      }>;
    }> => {
      const response = await apiClient.post(
        '/api/parent-assistant',
        request,
        {
          timeout: 60000, // 60 seconds for AI response
        }
      );
      return response.data;
    },

    getConversationHistory: async (sessionId: string): Promise<{
      session_id: string;
      messages: Array<{
        id: string;
        role: 'parent' | 'assistant';
        content: string;
        timestamp: string;
        response?: {
          advice: string;
          conversation_summary: string | null;
          key_insights: string[];
          suggested_actions: string[];
          citations: Array<{
            source: string;
            url: string;
            relevance: number;
            source_type: string;
          }>;
        };
      }>;
      total_messages: number;
    }> => {
      const response = await apiClient.get(
        `/api/parent-assistant/conversation-history/${sessionId}`
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

  // Child Profile Management
  children: {
    create: async (parentId: string, childData: ChildCreate): Promise<Child> => {
      logger.info(LogCategory.API, 'Creating child profile', { parentId, childData });
      try {
        const response = await apiClient.post<Child>(
          `/api/children?parent_id=${parentId}`,
          childData
        );
        logger.info(LogCategory.API, 'Child profile created', { childId: response.data.child_id });
        return response.data;
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to create child profile', error as Error);
        throw error;
      }
    },

    getAll: async (parentId: string): Promise<Child[]> => {
      logger.debug(LogCategory.API, `Fetching all children for parent: ${parentId}`);
      const response = await apiClient.get<Child[]>(`/api/children/parent/${parentId}`);
      return response.data;
    },

    get: async (childId: string): Promise<Child> => {
      logger.debug(LogCategory.API, `Fetching child profile: ${childId}`);
      const response = await apiClient.get<Child>(`/api/children/${childId}`);
      return response.data;
    },

    update: async (childId: string, childData: ChildUpdate): Promise<Child> => {
      logger.info(LogCategory.API, `Updating child profile: ${childId}`, childData);
      try {
        const response = await apiClient.put<Child>(
          `/api/children/${childId}`,
          childData
        );
        logger.info(LogCategory.API, 'Child profile updated', { childId });
        return response.data;
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to update child profile', error as Error);
        throw error;
      }
    },

    delete: async (childId: string): Promise<void> => {
      logger.info(LogCategory.API, `Deleting child profile: ${childId}`);
      try {
        await apiClient.delete(`/api/children/${childId}`);
        logger.info(LogCategory.API, 'Child profile deleted', { childId });
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to delete child profile', error as Error);
        throw error;
      }
    },

    getSummary: async (childId: string): Promise<ChildSummary> => {
      logger.debug(LogCategory.API, `Fetching child summary: ${childId}`);
      const response = await apiClient.get<ChildSummary>(`/api/children/${childId}/summary`);
      return response.data;
    },

    getSessions: async (childId: string, activeOnly: boolean = false): Promise<Session[]> => {
      logger.debug(LogCategory.API, `Fetching sessions for child: ${childId}`);
      const response = await apiClient.get<Session[]>(
        `/api/children/${childId}/sessions`,
        { params: { active_only: activeOnly } }
      );
      return response.data;
    },

    autoDiscover: async (parentId: string): Promise<{ discovered_count: number; children: Child[] }> => {
      logger.info(LogCategory.API, `Auto-discovering children for parent: ${parentId}`);
      try {
        const response = await apiClient.post<{ discovered_count: number; children: Child[] }>(
          `/api/children/parent/${parentId}/auto-discover`
        );
        logger.info(LogCategory.API, 'Auto-discovery complete', {
          discovered: response.data.discovered_count
        });
        return response.data;
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to auto-discover children', error as Error);
        throw error;
      }
    },

    uploadProfilePicture: async (childId: string, file: File): Promise<Child> => {
      logger.info(LogCategory.API, `Uploading profile picture for child: ${childId}`);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<Child>(
          `/api/children/${childId}/upload-profile-picture`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        logger.info(LogCategory.API, 'Profile picture uploaded', { childId });
        return response.data;
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to upload profile picture', error as Error);
        throw error;
      }
    },
  },

  // Child Settings Management
  childSettings: {
    get: async (childId: string): Promise<ChildSettings> => {
      logger.debug(LogCategory.API, `Fetching settings for child: ${childId}`);
      try {
        const response = await apiClient.get<ChildSettings>(`/api/settings/child/${childId}`);
        logger.debug(LogCategory.API, 'Child settings retrieved', { childId });
        return response.data;
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to fetch child settings', error as Error);
        throw error;
      }
    },

    update: async (childId: string, settings: ChildSettingsUpdate): Promise<ChildSettings> => {
      logger.info(LogCategory.API, `Updating settings for child: ${childId}`, settings);
      try {
        const response = await apiClient.put<ChildSettings>(
          `/api/settings/child/${childId}`,
          settings
        );
        logger.info(LogCategory.API, 'Child settings updated', { childId });
        return response.data;
      } catch (error) {
        logger.error(LogCategory.API, 'Failed to update child settings', error as Error);
        throw error;
      }
    },
  },
};

export default api;
