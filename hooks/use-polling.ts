"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingOptions<T> {
    fetcher: () => Promise<T>;
    interval?: number;
    enabled?: boolean;
}

export function usePolling<T>({
    fetcher,
    interval = 10000,
    enabled = true,
}: UsePollingOptions<T>) {
    const [data, setData] = useState<T | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const fetcherRef = useRef(fetcher);

    // Keep fetcher ref updated without triggering effect
    useEffect(() => {
        fetcherRef.current = fetcher;
    }, [fetcher]);

    const poll = useCallback(async () => {
        try {
            const result = await fetcherRef.current();
            setData(result);
        } catch (error) {
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        const id = setInterval(poll, interval);

        return () => {
            clearInterval(id);
        };
    }, [enabled, interval, poll]);

    return { data, isPolling, refetch: poll };
}
