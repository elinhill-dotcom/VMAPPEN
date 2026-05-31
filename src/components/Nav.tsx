"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePredictionsLocked } from "@/hooks/usePredictionsLocked";

const baseLinks = [
  { href: "/", label: "Start" },
  { href: "/picks", label: "Mina tips" },
  { href: "/scoreboard", label: "Topplista" },
  { href: "/results", label: "Resultat" },
  { href: "/live", label: "Livechatt" },
];

const statsLink = { href: "/stats", label: "Statistik" };

export function Nav() {
  const pathname = usePathname();
  const [liveCount, setLiveCount] = useState(0);
  const { locked } = usePredictionsLocked();

  const links = useMemo(
    () =>
      locked
        ? [
            baseLinks[0],
            baseLinks[1],
            baseLinks[2],
            statsLink,
            ...baseLinks.slice(3),
          ]
        : baseLinks,
    [locked],
  );

  useEffect(() => {
    const load = () =>
      fetch("/api/matches/live")
        .then((r) => r.json())
        .then((d) => setLiveCount(d.count ?? 0));
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="nav-bar">
      <div className="nav-bar__inner">
        {links.map((l) => {
          const active =
            l.href === "/live"
              ? pathname.startsWith("/live")
              : l.href === "/scoreboard"
                ? pathname.startsWith("/scoreboard")
                : l.href === "/stats"
                  ? pathname.startsWith("/stats")
                  : pathname === l.href;
          const isLiveLink = l.href === "/live";
          const showDot = isLiveLink && liveCount > 0;

          return (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link shrink-0 rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-2 ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)] text-[var(--muted)] hover:text-white"
              }`}
              title={
                showDot
                  ? `${liveCount} match${liveCount === 1 ? "" : "er"} live`
                  : undefined
              }
            >
              {l.label}
              {showDot && <span className="nav-live-dot" aria-hidden />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
