"use client";

import { useState } from "react";
import type { MatchBettingStats } from "@/lib/betting-stats-types";
import { MatchBettingSummary } from "@/components/MatchBettingSummary";
import { MatchFamilyTipsDetail } from "@/components/MatchFamilyTipsDetail";
import type { MatchPlayerTip } from "@/lib/match-tips";

type MatchInfo = {
  id: number;
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: string;
  awayTeam: string;
};

type UserPick = {
  home: string;
  away: string;
};

type Props = {
  stats: MatchBettingStats;
  match: MatchInfo;
  userPick?: UserPick | null;
};

export function ExpandableMatchBettingSummary({
  stats,
  match,
  userPick,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tips, setTips] = useState<MatchPlayerTip[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canExpand = stats.tipCount > 0;

  async function toggleFamilyTips() {
    if (!canExpand) return;

    const next = !open;
    setOpen(next);

    if (next && tips === null) {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/matches/${match.id}/tips`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Kunde inte ladda tips");
          return;
        }
        setTips(data.tips ?? []);
      } catch {
        setError("Kunde inte ladda tips");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <MatchBettingSummary
        stats={stats}
        compact
        userPick={userPick}
        match={match}
        onFamilyTipsClick={canExpand ? toggleFamilyTips : undefined}
        familyTipsOpen={open}
        hideFamilyStats={open}
      />
      {open && (
        <MatchFamilyTipsDetail
          stats={stats}
          match={match}
          tips={tips}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
