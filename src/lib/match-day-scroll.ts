import { formatSvDayLabel } from "@/lib/datetime";

const CEST = "Europe/Stockholm";

export function getTodaySvDayLabel(now = new Date()): string {
  return formatSvDayLabel(now.toISOString());
}

export function daySectionId(dayLabel: string): string {
  return `match-day-${encodeURIComponent(dayLabel)}`;
}

function cestYmd(d: Date): string {
  return d.toLocaleDateString("sv-SE", {
    timeZone: CEST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type DayGroup = [string, { kickoffAt: string }[]];

/** Day section to scroll to: today, else next upcoming day, else last day. */
export function pickScrollDayKey(
  byDay: DayGroup[],
  now = new Date(),
): string | null {
  if (byDay.length === 0) return null;

  const todayLabel = getTodaySvDayLabel(now);
  const exact = byDay.find(([day]) => day === todayLabel);
  if (exact) return exact[0];

  const todayKey = cestYmd(now);
  for (const [day, matches] of byDay) {
    const first = matches[0];
    if (!first) continue;
    if (cestYmd(new Date(first.kickoffAt)) >= todayKey) return day;
  }

  return byDay[byDay.length - 1]![0];
}
