"use client";

import { useEffect, useRef } from "react";
import { daySectionId, pickScrollDayKey } from "@/lib/match-day-scroll";

type DayGroup = [string, { kickoffAt: string }[]];

type ScrollOptions = {
  scrollOffset?: number;
  delayMs?: number;
  behavior?: ScrollBehavior;
  /** Extra scroll attempts after layout shifts (ms). */
  retries?: number[];
  /** Keep correcting scroll while layout shifts (ms). */
  stabilizeMs?: number;
};

function scrollToDayHeading(
  dayLabel: string,
  scrollOffset: number,
  behavior: ScrollBehavior,
): boolean {
  const el = document.getElementById(daySectionId(dayLabel));
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

function isDayHeadingPlaced(dayLabel: string, scrollOffset: number): boolean {
  const el = document.getElementById(daySectionId(dayLabel));
  if (!el) return false;

  const top = el.getBoundingClientRect().top;
  return top >= scrollOffset - 24 && top <= scrollOffset + 80;
}

export function useScrollToTodayMatchDay(
  byDay: DayGroup[],
  enabled: boolean,
  resetKey?: string,
  options?: ScrollOptions,
) {
  const scrolledRef = useRef(false);
  const scrollOffset = options?.scrollOffset ?? 0;
  const delayMs = options?.delayMs ?? 80;
  const behavior = options?.behavior ?? "auto";
  const retriesRef = useRef(options?.retries ?? []);
  retriesRef.current = options?.retries ?? [];
  const stabilizeMs = options?.stabilizeMs ?? 4000;

  useEffect(() => {
    scrolledRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) {
      scrolledRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || byDay.length === 0 || scrolledRef.current) return;

    const targetDay = pickScrollDayKey(byDay);
    if (!targetDay) return;

    const timers: number[] = [];
    const retries = retriesRef.current;
    let active = true;

    const runScroll = () => {
      if (!active) return;
      scrollToDayHeading(targetDay, scrollOffset, "auto");
    };

    const finish = () => {
      active = false;
      scrolledRef.current = true;
    };

    timers.push(
      window.setTimeout(() => {
        scrollToDayHeading(targetDay, scrollOffset, behavior);
      }, delayMs),
    );

    for (const ms of retries) {
      timers.push(window.setTimeout(runScroll, delayMs + ms));
    }

    let resizeTimer = 0;
    const onLayoutShift = () => {
      if (!active) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!active || isDayHeadingPlaced(targetDay, scrollOffset)) return;
        runScroll();
      }, 60);
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onLayoutShift)
        : null;

    resizeObserver?.observe(document.body);
    for (const section of document.querySelectorAll(".match-day-section")) {
      resizeObserver?.observe(section);
    }

    const lastRetry = retries.length > 0 ? retries[retries.length - 1]! : 0;
    timers.push(
      window.setTimeout(finish, delayMs + lastRetry + stabilizeMs),
    );

    return () => {
      active = false;
      for (const id of timers) window.clearTimeout(id);
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
    };
  }, [byDay, enabled, resetKey, scrollOffset, delayMs, behavior, stabilizeMs]);
}
