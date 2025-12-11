'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
}

export function usePolling<T>({ fetcher, interval = 10000, enabled = true }: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const fetcherRef = useRef(fetcher);

  // Keep fetcher ref updated without triggering effect
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const poll = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const id = setInterval(poll, interval);

    return () => {
      clearInterval(id);
    };
  }, [enabled, interval, poll]);

  // Derive isPolling from enabled prop
  return { data, isPolling: enabled, refetch: poll };
}
