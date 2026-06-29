/** Knockout bracket tree layout (match ids). */

export const KNOCKOUT_STAGE_LABELS: Record<string, string> = {
  r16: "16-delsfinal",
  r8: "Åttondelsfinal",
  qf: "Kvartsfinal",
  sf: "Semifinal",
  bronze: "Bronsmatch",
  final: "Final",
};

export type BracketSideTree = {
  r16Pairs: readonly (readonly [number, number])[];
  r8: readonly number[];
  qf: readonly number[];
  sf: readonly number[];
};

/** Left half — feeds into r8 90, 89, 93, 94 (top to bottom). */
export const BRACKET_LEFT: BracketSideTree = {
  r16Pairs: [
    [75, 78],
    [73, 76],
    [84, 83],
    [82, 81],
  ],
  r8: [90, 89, 93, 94],
  qf: [97, 98],
  sf: [101],
};

/** Right half — feeds into r8 91, 92, 95, 96 (top to bottom). */
export const BRACKET_RIGHT: BracketSideTree = {
  r16Pairs: [
    [74, 77],
    [79, 80],
    [87, 86],
    [85, 88],
  ],
  r8: [91, 92, 95, 96],
  qf: [99, 100],
  sf: [102],
};

export const BRACKET_FINAL = 104;
export const BRACKET_BRONZE = 103;

export const BRACKET_ROUND_LABELS = {
  r16: "16-dels",
  r8: "8-dels",
  qf: "Kvarts",
  sf: "Semi",
} as const;
