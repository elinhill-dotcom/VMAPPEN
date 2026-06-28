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

/** Left half — pairs feed into r8 89–92. */
export const BRACKET_LEFT: BracketSideTree = {
  r16Pairs: [
    [73, 75],
    [74, 77],
    [76, 78],
    [79, 80],
  ],
  r8: [89, 90, 91, 92],
  qf: [97, 98],
  sf: [101],
};

/** Right half — pairs feed into r8 93–96. */
export const BRACKET_RIGHT: BracketSideTree = {
  r16Pairs: [
    [83, 84],
    [81, 82],
    [86, 88],
    [85, 87],
  ],
  r8: [93, 94, 95, 96],
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
