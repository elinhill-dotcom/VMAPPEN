const CEST = "Europe/Stockholm";

function capFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Swedish calendar day label from a Date in CEST, e.g. "Söndag 15 juni". */
export function formatSvDayLabelFromDate(d: Date): string {
  const weekday = capFirst(
    d.toLocaleDateString("sv-SE", { weekday: "long", timeZone: CEST }),
  );
  const day = d.toLocaleDateString("sv-SE", { day: "numeric", timeZone: CEST });
  const month = d.toLocaleDateString("sv-SE", { month: "long", timeZone: CEST });
  return `${weekday} ${day} ${month}`;
}

/** Swedish calendar day label, e.g. "Söndag 15 juni". */
export function formatSvDayLabel(iso: string): string {
  return formatSvDayLabelFromDate(new Date(iso));
}

/** Today's day label in Swedish (CEST), e.g. "Måndag 15 juni". */
export function getTodaySvDayLabel(now = new Date()): string {
  return formatSvDayLabelFromDate(now);
}

/** Date/time in CEST (Swedish). */
export function formatCestDateTime(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: CEST,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const hour = get("hour").padStart(2, "0");
  const minute = get("minute").padStart(2, "0");

  return `${get("day")} ${get("month")} ${get("year")} kl. ${hour}:${minute}`;
}

export function formatCestMatchKickoff(iso: string): string {
  const d = new Date(iso);
  return capFirst(
    d.toLocaleString("sv-SE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: CEST,
    }),
  );
}

/** When chat opens (15 min before kickoff), Swedish. */
export function formatCestTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: CEST,
  });
}
