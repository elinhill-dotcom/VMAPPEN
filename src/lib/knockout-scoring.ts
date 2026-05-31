export type KnockoutPickData = {
  sf1Home: string | null;
  sf1Away: string | null;
  sf2Home: string | null;
  sf2Away: string | null;
  finalHome: string | null;
  finalAway: string | null;
  bronzeHome: string | null;
  bronzeAway: string | null;
  champion: string | null;
};

export const KNOCKOUT_POINTS = {
  semifinalist: 2,
  finalist: 3,
  champion: 5,
  bronzeTeam: 2,
} as const;

function teamsInSemis(answer: KnockoutPickData): string[] {
  return [answer.sf1Home, answer.sf1Away, answer.sf2Home, answer.sf2Away].filter(
    (t): t is string => !!t,
  );
}

function teamsInFinal(answer: KnockoutPickData): string[] {
  return [answer.finalHome, answer.finalAway].filter((t): t is string => !!t);
}

function teamsInBronze(answer: KnockoutPickData): string[] {
  return [answer.bronzeHome, answer.bronzeAway].filter((t): t is string => !!t);
}

export function scoreKnockoutPick(
  pick: KnockoutPickData,
  answer: KnockoutPickData,
): number {
  return breakdownKnockoutPick(pick, answer).reduce((sum, s) => sum + s.points, 0);
}

export type KnockoutSlotBreakdown = {
  key: keyof KnockoutPickData;
  label: string;
  picked: string | null;
  points: number;
  hit: boolean;
  category: keyof typeof KNOCKOUT_POINTS;
};

const KNOCKOUT_SLOT_DEFS: {
  key: keyof KnockoutPickData;
  label: string;
  category: keyof typeof KNOCKOUT_POINTS;
  actualTeams: (answer: KnockoutPickData) => string[];
}[] = [
  { key: "sf1Home", label: "Semifinal 1 — hemma", category: "semifinalist", actualTeams: teamsInSemis },
  { key: "sf1Away", label: "Semifinal 1 — borta", category: "semifinalist", actualTeams: teamsInSemis },
  { key: "sf2Home", label: "Semifinal 2 — hemma", category: "semifinalist", actualTeams: teamsInSemis },
  { key: "sf2Away", label: "Semifinal 2 — borta", category: "semifinalist", actualTeams: teamsInSemis },
  { key: "finalHome", label: "Final — lag 1", category: "finalist", actualTeams: teamsInFinal },
  { key: "finalAway", label: "Final — lag 2", category: "finalist", actualTeams: teamsInFinal },
  { key: "champion", label: "VM-vinnare", category: "champion", actualTeams: (a) => (a.champion ? [a.champion] : []) },
  { key: "bronzeHome", label: "Brons — lag 1", category: "bronzeTeam", actualTeams: teamsInBronze },
  { key: "bronzeAway", label: "Brons — lag 2", category: "bronzeTeam", actualTeams: teamsInBronze },
];

export function breakdownKnockoutPick(
  pick: KnockoutPickData,
  answer: KnockoutPickData,
): KnockoutSlotBreakdown[] {
  if (!answer.champion) return [];

  return KNOCKOUT_SLOT_DEFS.map(({ key, label, category, actualTeams }) => {
    const picked = pick[key] ?? null;
    const actual = new Set(actualTeams(answer));
    const hit = !!picked && actual.has(picked);
    return {
      key,
      label,
      picked,
      hit,
      category,
      points: hit ? KNOCKOUT_POINTS[category] : 0,
    };
  });
}
