import {
  mapKnockoutPick,
  mapMatch,
  mapPlayer,
  mapPrediction,
} from "@/lib/firestore-mappers";
import type {
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
} from "@/lib/firestore-types";
import { getAdminFirestore, toErrorMessage, type DbResult } from "@/lib/firestore";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import { toSwedishTeam } from "@/lib/team-names";

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

export async function fetchPicksExport(): Promise<DbResult<PicksExportPayload>> {
  try {
    const db = getAdminFirestore();

    const [playersSnap, predsSnap, koPicksSnap, matchesSnap] = await Promise.all([
      db.collection("players").orderBy("name").get(),
      db.collection("predictions").get(),
      db.collection("knockout_picks").get(),
      db.collection("matches").where("stage", "==", "group").get(),
    ]);

    const matches = matchesSnap.docs
      .map((doc) =>
        mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
      )
      .sort((a, b) => a.id - b.id);

    const matchMap = new Map(matches.map((m) => [m.id, m]));

    const predsByPlayer = new Map<
      string,
      ReturnType<typeof mapPrediction>[]
    >();
    for (const doc of predsSnap.docs) {
      const row = doc.data() as PredictionRow;
      if (!matchMap.has(row.match_id)) continue;
      const pred = mapPrediction({ ...row, id: doc.id });
      const list = predsByPlayer.get(pred.playerId) ?? [];
      list.push(pred);
      predsByPlayer.set(pred.playerId, list);
    }

    const koByPlayer = new Map<string, KnockoutFormState>();
    for (const doc of koPicksSnap.docs) {
      koByPlayer.set(
        doc.id,
        mapKnockoutPick({ id: doc.id, ...doc.data() } as KnockoutPickRow),
      );
    }

    const players = playersSnap.docs.map((doc) =>
      mapPlayer({ id: doc.id, ...doc.data() } as PlayerRow),
    );

    const exportPlayers: PlayerPicksExport[] = players.map((p) => {
      const predMap = new Map(
        (predsByPlayer.get(p.id) ?? []).map((pred) => [pred.matchId, pred]),
      );

      const predictions = matches.map((m) => {
        const pred = predMap.get(m.id);
        return {
          matchId: m.id,
          dayLabel: m.dayLabel,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          groupCode: m.groupCode,
          homeScore: pred?.homeScore ?? null,
          awayScore: pred?.awayScore ?? null,
        };
      });

      const ko = koByPlayer.get(p.id) ?? null;
      const knockout = ko
        ? {
            sf1Home: ko.sf1Home ? toSwedishTeam(ko.sf1Home) : "",
            sf1Away: ko.sf1Away ? toSwedishTeam(ko.sf1Away) : "",
            sf2Home: ko.sf2Home ? toSwedishTeam(ko.sf2Home) : "",
            sf2Away: ko.sf2Away ? toSwedishTeam(ko.sf2Away) : "",
            finalHome: ko.finalHome ? toSwedishTeam(ko.finalHome) : "",
            finalAway: ko.finalAway ? toSwedishTeam(ko.finalAway) : "",
            bronzeHome: ko.bronzeHome ? toSwedishTeam(ko.bronzeHome) : "",
            bronzeAway: ko.bronzeAway ? toSwedishTeam(ko.bronzeAway) : "",
            champion: ko.champion ? toSwedishTeam(ko.champion) : "",
          }
        : null;

      return { playerId: p.id, name: p.name, predictions, knockout };
    });

    return {
      data: {
        exportedAt: new Date().toISOString(),
        players: exportPlayers,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

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
