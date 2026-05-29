/** Stadionljus, konfetti och plan — matchar SUPER VMAPP-bannern. */
export function FootballDecor() {
  return (
    <div className="football-decor" aria-hidden>
      <div className="football-decor__spotlight football-decor__spotlight--left" />
      <div className="football-decor__spotlight football-decor__spotlight--right" />
      <div className="football-decor__grass" />
      <ul className="football-decor__confetti">
        {CONFETTI.map((c, i) => (
          <li
            key={i}
            className={`football-decor__confetti-piece football-decor__confetti-piece--${c.color}`}
            style={{
              left: c.x,
              top: c.y,
              width: c.w,
              height: c.h,
              ["--rot" as string]: `${c.rot}deg`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </ul>
      <svg
        className="football-decor__ball football-decor__ball--tl"
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M32 8 L38 22 L52 24 L42 34 L44 48 L32 40 L20 48 L22 34 L12 24 L26 22 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.08"
        />
      </svg>
      <svg
        className="football-decor__ball football-decor__ball--br"
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M32 8 L38 22 L52 24 L42 34 L44 48 L32 40 L20 48 L22 34 L12 24 L26 22 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.08"
        />
      </svg>
    </div>
  );
}

const CONFETTI = [
  { x: "8%", y: "12%", w: 8, h: 5, rot: 12, color: "yellow", delay: 0 },
  { x: "92%", y: "18%", w: 6, h: 9, rot: -24, color: "blue", delay: 0.4 },
  { x: "15%", y: "45%", w: 7, h: 4, rot: 45, color: "blue", delay: 0.8 },
  { x: "88%", y: "55%", w: 9, h: 5, rot: -8, color: "yellow", delay: 1.2 },
  { x: "5%", y: "72%", w: 5, h: 8, rot: 30, color: "yellow", delay: 0.2 },
  { x: "95%", y: "78%", w: 8, h: 4, rot: -35, color: "blue", delay: 0.6 },
  { x: "48%", y: "8%", w: 6, h: 6, rot: 15, color: "yellow", delay: 1 },
  { x: "72%", y: "32%", w: 5, h: 7, rot: -18, color: "blue", delay: 1.4 },
  { x: "28%", y: "85%", w: 7, h: 5, rot: 50, color: "yellow", delay: 0.5 },
  { x: "62%", y: "88%", w: 6, h: 6, rot: -42, color: "blue", delay: 0.9 },
] as const;
