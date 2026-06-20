"use client";

import { useEffect, useRef } from "react";
import { daySectionId, pickScrollDayKey } from "@/lib/match-day-scroll";

type DayGroup = [string, { kickoffAt: string }[]];

export function useScrollToTodayMatchDay(
  byDay: DayGroup[],
  enabled: boolean,
  resetKey?: string,
) {
  const scrolledRef = useRef(false);

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
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledRef.current = true;
    }, 80);

    return () => window.clearTimeout(timer);
  }, [byDay, enabled, resetKey]);
}
