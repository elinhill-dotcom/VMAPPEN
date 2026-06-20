import { getTodaySvDayLabel } from "@/lib/datetime";

const CEST = "Europe/Stockholm";

export function daySectionId(dayLabel: string): string {
  return `match-day-${encodeURIComponent(dayLabel)}`;
}

export function cestYmd(d: Date): string {
  return d.toLocaleDateString("sv-SE", {
    timeZone: CEST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type DayGroup = [string, { kickoffAt: string }[]];

export function sortMatchDayGroups<T extends { kickoffAt: string }>(
  groups: [string, T[]][],
): [string, T[]][] {
  return [...groups].sort((a, b) => {
    const ta = new Date(a[1][0]?.kickoffAt ?? 0).getTime();
    const tb = new Date(b[1][0]?.kickoffAt ?? 0).getTime();
    return ta - tb;
  });
}

/** Day section to scroll to: today, else next upcoming day, else last day. */
export function pickScrollDayKey(
  byDay: DayGroup[],
  now = new Date(),
): string | null {
  if (byDay.length === 0) return null;

  const sorted = sortMatchDayGroups(byDay);
  const todayKey = cestYmd(now);
  const todayLabel = getTodaySvDayLabel(now);

  const byLabel = sorted.find(([day]) => day === todayLabel);
  if (byLabel) return byLabel[0];

  for (const [day, matches] of sorted) {
    if (matches.some((m) => cestYmd(new Date(m.kickoffAt)) === todayKey)) {
      return day;
    }
  }

  for (const [day, matches] of sorted) {
    const first = matches[0];
    if (!first) continue;
    if (cestYmd(new Date(first.kickoffAt)) >= todayKey) return day;
  }

  return sorted[sorted.length - 1]![0];
}

export { getTodaySvDayLabel };
