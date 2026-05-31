import type { KnockoutFormState } from "@/lib/knockout-picks";

export type PlayerPicksExport = {
  playerId: string;
  name: string;
  predictions: {
    matchId: number;
    dayLabel: string;
    homeTeam: string;
    awayTeam: string;
    groupCode: string | null;
    homeScore: number | null;
    awayScore: number | null;
  }[];
  knockout: KnockoutFormState | null;
};

export type PicksExportPayload = {
  exportedAt: string;
  players: PlayerPicksExport[];
};

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildPicksCsv(payload: PicksExportPayload): string {
  const lines: string[] = [
    "SUPER VMAPP — alla tips",
    `Exporterad;${new Date(payload.exportedAt).toLocaleString("sv-SE")}`,
    "",
    "GRUPPTIPS",
    "Spelare;Match;Dag;Grupp;Tip",
  ];

  for (const player of payload.players) {
    for (const p of player.predictions) {
      if (p.homeScore === null || p.awayScore === null) continue;
      lines.push(
        [
          csvCell(player.name),
          csvCell(`${p.homeTeam} – ${p.awayTeam}`),
          csvCell(p.dayLabel),
          csvCell(p.groupCode ?? ""),
          csvCell(`${p.homeScore}–${p.awayScore}`),
        ].join(";"),
      );
    }
  }

  lines.push("", "SLUTSPEL");
  lines.push(
    "Spelare;SF1 hemma;SF1 borta;SF2 hemma;SF2 borta;Final 1;Final 2;Brons 1;Brons 2;VM-vinnare",
  );

  for (const player of payload.players) {
    const k = player.knockout;
    if (!k) continue;
    const hasAny = Object.values(k).some((v) => v !== "");
    if (!hasAny) continue;
    lines.push(
      [
        csvCell(player.name),
        csvCell(k.sf1Home),
        csvCell(k.sf1Away),
        csvCell(k.sf2Home),
        csvCell(k.sf2Away),
        csvCell(k.finalHome),
        csvCell(k.finalAway),
        csvCell(k.bronzeHome),
        csvCell(k.bronzeAway),
        csvCell(k.champion),
      ].join(";"),
    );
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadCsv(payload: PicksExportPayload, filename?: string) {
  const blob = new Blob([buildPicksCsv(payload)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `vmapp-tips-${new Date(payload.exportedAt).toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
