import { getOutcome, pointsForPrediction } from "./scoring";

export type PickFeedback = {
  hasPick: boolean;
  hasResult: boolean;
  points: number;
  exact: boolean;
  outcomeCorrect: boolean;
  actualLabel: string;
  pickLabel: string;
  winnerLabel: string;
};

export function winnerLabel(
  home: number,
  away: number,
  homeTeam: string,
  awayTeam: string,
): string {
  const o = getOutcome(home, away);
  if (o === "draw") return "Oavgjort";
  if (o === "home") return `${homeTeam} vann`;
  return `${awayTeam} vann`;
}

export function evaluatePick(
  predHome: string,
  predAway: string,
  match: {
    finished: boolean;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: string;
    awayTeam: string;
  },
): PickFeedback | null {
  if (
    !match.finished ||
    match.homeScore === null ||
    match.awayScore === null
  ) {
    return null;
  }

  const hasPick = predHome !== "" && predAway !== "";
  const ah = match.homeScore;
  const aa = match.awayScore;

  const base = {
    hasPick,
    hasResult: true,
    actualLabel: `${ah}–${aa}`,
    winnerLabel: winnerLabel(ah, aa, match.homeTeam, match.awayTeam),
    points: 0,
    exact: false,
    outcomeCorrect: false,
    pickLabel: hasPick ? `${predHome}–${predAway}` : "—",
  };

  if (!hasPick) return base;

  const ph = Number(predHome);
  const pa = Number(predAway);
  if (!Number.isInteger(ph) || !Number.isInteger(pa)) return base;

  const points = pointsForPrediction(ph, pa, ah, aa);
  return {
    ...base,
    points,
    exact: points === 3,
    outcomeCorrect: points >= 1,
    pickLabel: `${ph}–${pa}`,
  };
}
