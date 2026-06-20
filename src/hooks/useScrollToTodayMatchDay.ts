"use client";

import { useEffect, useRef } from "react";
import { daySectionId, pickScrollDayKey } from "@/lib/match-day-scroll";

type DayGroup = [string, { kickoffAt: string }[]];

type ScrollOptions = {
  /** Extra px subtracted from scroll position (e.g. fixed header). */
  scrollOffset?: number;
  /** Wait before scrolling so layout can settle. */
  delayMs?: number;
};

export function useScrollToTodayMatchDay(
  byDay: DayGroup[],
  enabled: boolean,
  resetKey?: string,
  options?: ScrollOptions,
) {
  const scrolledRef = useRef(false);
  const scrollOffset = options?.scrollOffset ?? 0;
  const delayMs = options?.delayMs ?? 80;

  useEffect(() => {
    scrolledRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!enabled || byDay.length === 0 || scrolledRef.current) return;

    const targetDay = pickScrollDayKey(byDay);
    if (!targetDay) return;

    const id = daySectionId(targetDay);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;

      const top =
        el.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      scrolledRef.current = true;
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [byDay, enabled, resetKey, scrollOffset, delayMs]);
}
