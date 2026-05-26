"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KnockoutPickForm } from "@/components/KnockoutPickForm";
import {
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/lib/knockout-picks";
import { ContinueAsPlayer } from "@/components/ContinueAsPlayer";
import { MatchCard, type MatchView } from "@/components/MatchCard";
import { PicksChecklist } from "@/components/PicksChecklist";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import {
  KNOCKOUT_PICK_COUNT,
  countKnockoutFilled,
  isKnockoutComplete,
} from "@/lib/knockout-picks";
import type { StoredPlayer } from "@/lib/player-storage";

type PredMap = Record<number, { home: string; away: string }>;

export default function PicksPage() {
  const { player, hydrated, remember } = usePlayerSession();
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [preds, setPreds] = useState<PredMap>({});
  const [knockout, setKnockout] = useState<KnockoutFormState>(
    emptyKnockoutForm(),
  );
  const [locked, setLocked] = useState(false);
  const [filter, setFilter] = useState<"all" | "featured" | "missing">("all");
  const [tab, setTab] = useState<"group" | "knockout">("group");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageWarn, setMessageWarn] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async (playerId: string) => {
    setLoadError("");
    const [mRes, pRes, kRes, cRes] = await Promise.all([
      fetch("/api/matches?stage=group"),
      fetch(`/api/predictions?playerId=${playerId}`),
      fetch(`/api/knockout-picks?playerId=${playerId}`),
      fetch("/api/config"),
    ]);
    const mData = await mRes.json();
    const pData = await pRes.json();
    const kData = await kRes.json();
    const cfg = await cRes.json();

    if (!mRes.ok) {
      setLoadError(
        mData.error ??
          "Could not load matches. Check Supabase settings and run npm run db:seed.",
      );
      setMatches([]);
      return;
    }

    const ms = mData.matches as MatchView[];
    const predictions = pData.predictions ?? [];
    const pick = kData.pick;

    setMatches(ms ?? []);
    setLocked(cfg.locked);

    const map: PredMap = {};
    for (const m of ms as MatchView[]) {
      map[m.id] = { home: "", away: "" };
    }
    for (const p of predictions) {
      map[p.matchId] = {
        home: String(p.homeScore),
        away: String(p.awayScore),
      };
    }
    setPreds(map);

    if (pick) {
      setKnockout({
        sf1Home: pick.sf1Home ?? "",
        sf1Away: pick.sf1Away ?? "",
        sf2Home: pick.sf2Home ?? "",
        sf2Away: pick.sf2Away ?? "",
        finalHome: pick.finalHome ?? "",
        finalAway: pick.finalAway ?? "",
        bronzeHome: pick.bronzeHome ?? "",
        bronzeAway: pick.bronzeAway ?? "",
        champion: pick.champion ?? "",
      });
    }
  }, []);

  useEffect(() => {
    if (player) load(player.id);
  }, [player, load]);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "featured") return m.featured;
      if (filter === "missing") {
        const pr = preds[m.id];
        return !pr?.home || pr.home === "" || !pr?.away || pr.away === "";
      }
      return true;
    });
  }, [matches, filter, preds]);

  const byDay = useMemo(() => {
    const groups: Record<string, MatchView[]> = {};
    for (const m of filtered) {
      const key = m.dayLabel;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups);
  }, [filtered]);

  const filledGroup = useMemo(() => {
    return matches.filter((m) => {
      const p = preds[m.id];
      return p?.home !== "" && p?.away !== "";
    }).length;
  }, [matches, preds]);

  const knockoutFilled = countKnockoutFilled(knockout);
  const groupDone = filledGroup >= matches.length && matches.length > 0;
  const knockoutDone = isKnockoutComplete(knockout);

  async function save() {
    if (!player) return;
    setSaving(true);
    setMessage("");
    setMessageWarn(false);

    const items = Object.entries(preds)
      .filter(([, v]) => v.home !== "" && v.away !== "")
      .map(([id, v]) => ({
        matchId: Number(id),
        homeScore: Number(v.home),
        awayScore: Number(v.away),
      }));

    const [groupRes, koRes] = await Promise.all([
      fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, predictions: items }),
      }),
      fetch("/api/knockout-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, ...knockout }),
      }),
    ]);

    const groupData = await groupRes.json();
    const koData = await koRes.json();
    setSaving(false);

    if (!groupRes.ok || !koRes.ok) {
      setMessage(
        groupData.error ?? koData.error ?? "Could not save",
      );
      setMessageWarn(true);
      return;
    }

    const parts: string[] = [
      `Saved! Group: ${groupData.savedCount}/${matches.length} scores.`,
      `Knockout: ${knockoutFilled}/${KNOCKOUT_PICK_COUNT} picks.`,
    ];
    if (!knockoutDone) {
      parts.push(
        "Reminder: Step 2 (Semis · Final · Bronze) is not complete yet!",
      );
      setMessageWarn(true);
    } else if (!groupDone) {
      parts.push("Reminder: some group scores are still missing.");
      setMessageWarn(true);
    }
    setMessage(parts.join(" "));
  }

  if (!hydrated) {
    return <p className="text-[var(--muted)] text-sm">Loading…</p>;
  }

  if (!player) {
    return (
      <ContinueAsPlayer
        title="My picks"
        onContinue={(p: StoredPlayer) => {
          remember(p);
          load(p.id);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PicksChecklist
        groupFilled={filledGroup}
        groupTotal={matches.length}
        knockout={knockout}
        activeTab={tab}
        onGoTo={setTab}
        locked={locked}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">My picks — {player.name}</h2>
        </div>
        {!locked && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save all picks"}
          </button>
        )}
      </div>

      {message && (
        <p
          className={`rounded-lg px-4 py-2 text-sm ${
            messageWarn
              ? "bg-[var(--danger)]/15 text-[var(--danger)]"
              : "bg-[var(--success)]/20 text-[var(--success)]"
          }`}
        >
          {message}
        </p>
      )}

      {loadError && (
        <p className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-3 text-sm space-y-2">
          <strong>Matches could not be loaded.</strong> {loadError}
          <span className="block text-[var(--muted)]">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
            .env, run supabase/schema.sql in Supabase, then{" "}
            <code className="text-white">npm run db:seed</code> and restart the
            dev server.
          </span>
        </p>
      )}

      {locked && (
        <p className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2 text-sm">
          Picks are locked — view only.
        </p>
      )}

      {!locked && tab === "group" && groupDone && !knockoutDone && (
        <p className="rounded-lg border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-4 py-3 text-sm">
          <strong>Don&apos;t stop here!</strong> Group stage looks complete. Open{" "}
          <button
            type="button"
            onClick={() => setTab("knockout")}
            className="font-semibold text-[var(--accent)] underline"
          >
            Step 2: Semis · Final · Bronze
          </button>{" "}
          ({KNOCKOUT_PICK_COUNT} picks required).
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("group")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "group"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)] text-[var(--muted)]"
          }`}
        >
          Step 1: Group stage
          <span className="ml-1 opacity-80">
            ({filledGroup}/{matches.length})
          </span>
          {groupDone && " ✓"}
        </button>
        <button
          type="button"
          onClick={() => setTab("knockout")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "knockout"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : knockoutDone
                ? "bg-[var(--card)] text-[var(--muted)]"
                : "bg-[var(--danger)]/20 text-white border border-[var(--danger)]/50"
          }`}
        >
          Step 2: Semis · Final · Bronze
          <span className="ml-1 opacity-80">
            ({knockoutFilled}/{KNOCKOUT_PICK_COUNT})
          </span>
          {knockoutDone ? " ✓" : " — required"}
        </button>
      </div>

      {tab === "group" && (
        <>
          <p className="text-sm text-[var(--muted)]">
            Predict the <strong className="text-white">score</strong> for every
            group match. Then go to Step 2 for semifinals, final, and bronze.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All matches"],
                ["featured", "Our teams (NL SE FR MX)"],
                ["missing", "Missing scores"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  filter === key
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                    : "bg-[var(--card)] text-[var(--muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {matches.length === 0 && !loadError && (
            <p className="text-sm text-[var(--muted)]">
              Loading matches…
            </p>
          )}

          {byDay.map(([day, dayMatches]) => (
            <section key={day}>
              <h3 className="mb-3 text-sm font-semibold text-[var(--accent)]">
                {day}
              </h3>
              <div className="space-y-3">
                {dayMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    predHome={preds[m.id]?.home ?? ""}
                    predAway={preds[m.id]?.away ?? ""}
                    locked={locked}
                    showResult
                    onChange={(home, away) =>
                      setPreds((prev) => ({
                        ...prev,
                        [m.id]: { home, away },
                      }))
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {tab === "knockout" && (
        <>
          <p className="text-sm text-[var(--muted)] rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3">
            <strong className="text-white">Step 2 of 2.</strong> Pick which teams
            reach the semifinals, final, bronze match, and who wins the World Cup.
            This is separate from group scores — all{" "}
            <strong className="text-white">{KNOCKOUT_PICK_COUNT} fields</strong>{" "}
            must be filled.
          </p>
          <KnockoutPickForm
            form={knockout}
            locked={locked}
            onChange={setKnockout}
          />
        </>
      )}

      {!locked && matches.length > 0 && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save all picks"}
        </button>
      )}
    </div>
  );
}
