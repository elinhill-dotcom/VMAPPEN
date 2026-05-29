export type KnockoutFormState = {
  sf1Home: string;
  sf1Away: string;
  sf2Home: string;
  sf2Away: string;
  finalHome: string;
  finalAway: string;
  bronzeHome: string;
  bronzeAway: string;
  champion: string;
};

export const emptyKnockoutForm = (): KnockoutFormState => ({
  sf1Home: "",
  sf1Away: "",
  sf2Home: "",
  sf2Away: "",
  finalHome: "",
  finalAway: "",
  bronzeHome: "",
  bronzeAway: "",
  champion: "",
});

export const KNOCKOUT_PICK_COUNT = 9;

export const KNOCKOUT_STEPS = [
  { key: "semis", label: "Semifinaler", fields: 4, desc: "2 lag per semifinal" },
  { key: "final", label: "Final + mästare", fields: 3, desc: "2 finalister + vinnare" },
  { key: "bronze", label: "Bronsmatch", fields: 2, desc: "2 lag" },
] as const;

export function countKnockoutFilled(form: KnockoutFormState): number {
  return Object.values(form).filter((v) => v !== "").length;
}

export function isKnockoutComplete(form: KnockoutFormState): boolean {
  return countKnockoutFilled(form) === KNOCKOUT_PICK_COUNT;
}
