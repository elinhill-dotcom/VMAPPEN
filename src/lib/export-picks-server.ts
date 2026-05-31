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
import type {
  PicksExportPayload,
  PlayerPicksExport,
} from "@/lib/export-picks-client";

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
