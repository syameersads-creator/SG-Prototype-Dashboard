"use client";

import { useEffect, useState } from "react";

/**
 * A clock that ticks locally, so ETA countdowns move every second without
 * a round trip. Data freshness comes from Realtime; this is only the
 * "time remaining" arithmetic.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
