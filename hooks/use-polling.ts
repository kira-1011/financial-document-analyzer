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
        console.log("[usePolling] Polling...");
        try {
            const result = await fetcherRef.current();
            console.log("[usePolling] Result:", result);
            setData(result);
        } catch (error) {
            console.error("[usePolling] Error:", error);
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            console.log("[usePolling] Disabled, stopping poll");
            setIsPolling(false);
            return;
        }

        console.log(`[usePolling] Starting poll with interval: ${interval}ms`);
        setIsPolling(true);
        const id = setInterval(poll, interval);

        return () => {
            console.log("[usePolling] Cleanup, clearing interval");
            clearInterval(id);
        };
    }, [enabled, interval, poll]);

    return { data, isPolling, refetch: poll };
}
