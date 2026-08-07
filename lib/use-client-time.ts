"use client";

import { useState, useEffect } from "react";

/**
 * Current timestamp, but only after the component has mounted on the client.
 *
 * Returns `null` during SSR and on the very first client render so that
 * time-dependent UI (countdowns, "2h ago") renders identically on both sides
 * and never triggers a hydration mismatch. After mount it updates on an
 * interval so countdowns stay live.
 */
export function useClientTime(intervalMs = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

/** True once the component has mounted on the client. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
