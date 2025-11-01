// ============================================================================
// useAsyncData - Hook for managing async data loading with race condition prevention
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncDataOptions {
  /** If true, automatically fetch data on mount and when dependencies change */
  autoFetch?: boolean;
  /** Dependencies to trigger a refetch */
  deps?: any[];
  /** Initial data value */
  initialData?: any;
}

/**
 * Hook for managing async data with loading and error states
 * Prevents race conditions by canceling stale requests
 */
export function useAsyncData<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncDataOptions = {}
): AsyncDataState<T> & { refetch: () => Promise<void> } {
  const { autoFetch = true, deps = [], initialData = null } = options;

  const [state, setState] = useState<AsyncDataState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track the current request to cancel stale ones
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    // Increment request ID to invalidate previous requests
    const currentRequestId = ++requestIdRef.current;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunction();

      // Only update state if this is still the latest request and component is mounted
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (error) {
      // Only update state if this is still the latest request and component is mounted
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData, ...deps]);

  // Cleanup: mark component as unmounted
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook for managing multiple parallel async operations
 */
export function useParallelAsyncData<T extends Record<string, () => Promise<any>>>(
  asyncFunctions: T,
  options: UseAsyncDataOptions = {}
): {
  data: { [K in keyof T]: Awaited<ReturnType<T[K]>> | null };
  loading: boolean;
  errors: { [K in keyof T]: Error | null };
  refetch: () => Promise<void>;
} {
  type DataType = { [K in keyof T]: Awaited<ReturnType<T[K]>> | null };
  type ErrorsType = { [K in keyof T]: Error | null };

  const { autoFetch = true, deps = [] } = options;

  const [data, setData] = useState<DataType>(() => {
    const initial = {} as DataType;
    Object.keys(asyncFunctions).forEach((key) => {
      initial[key as keyof T] = null;
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorsType>(() => {
    const initial = {} as ErrorsType;
    Object.keys(asyncFunctions).forEach((key) => {
      initial[key as keyof T] = null;
    });
    return initial;
  });

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchAll = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    const results = await Promise.allSettled(
      Object.entries(asyncFunctions).map(async ([key, fn]) => {
        try {
          const result = await fn();
          return { key, result, error: null };
        } catch (error) {
          return {
            key,
            result: null,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      })
    );

    // Only update if still mounted and this is the latest request
    if (isMountedRef.current && currentRequestId === requestIdRef.current) {
      const newData = {} as DataType;
      const newErrors = {} as ErrorsType;

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { key, result: data, error } = result.value;
          newData[key as keyof T] = data;
          newErrors[key as keyof T] = error;
        }
      });

      setData(newData);
      setErrors(newErrors);
      setLoading(false);
    }
  }, [asyncFunctions]);

  useEffect(() => {
    if (autoFetch) {
      fetchAll();
    }
  }, [autoFetch, fetchAll, ...deps]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    errors,
    refetch: fetchAll,
  };
}
