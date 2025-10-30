// ============================================================================
// useBackendAPI Hook - Wrapper for API calls with loading/error states
// ============================================================================

import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseBackendAPIReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export const useBackendAPI = <T = any>(
  apiFunction: (...args: any[]) => Promise<T>
): UseBackendAPIReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        console.error('API call error:', err);

        let errorMessage = 'An unexpected error occurred';

        if (err instanceof AxiosError) {
          if (err.response) {
            // Server responded with error status
            errorMessage =
              err.response.data?.message ||
              err.response.data?.error ||
              `Server error: ${err.response.status}`;
          } else if (err.request) {
            // Request made but no response
            errorMessage = 'No response from server. Please check your connection.';
          } else {
            // Error setting up request
            errorMessage = err.message || 'Failed to make request';
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};
