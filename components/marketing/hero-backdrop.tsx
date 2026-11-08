// The hero's background: trails left by the ship in the GZ mark, flying the
// same direction as its arrow. Purely decorative (aria-hidden), drawn once on
// the server, coloured with the logo tokens, and confined by CSS masks
// (.hero-backdrop in globals.css) to areas that hold no text.

type Streak = { x: number; y: number; length: number; thickness: number; tone: "mark" | "arrow"; delay: number };

/** Deterministic layout (no Math.random), so the markup is stable across renders. */
function streaks(): Streak[] {
  let seed = 7;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: 30 }, (_, i) => {
    const r = next();
    return {
      x: Math.round(-250 + next() * 1350),
      y: Math.round(20 + i * 26 + next() * 18),
      length: Math.round(180 + next() * 420),
      thickness: r > 0.8 ? 6 : r > 0.45 ? 3.5 : 2,
      tone: next() > 0.7 ? "arrow" : "mark",
      delay: Math.round(next() * 600),
    };
  });
}

const STREAKS = streaks();

export function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="hero-backdrop pointer-events-none absolute inset-x-0 top-0 h-44 lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-1/2"
    >
      <svg className="size-full" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          {(["mark", "arrow"] as const).map((tone) => (
            <linearGradient key={tone} id={`hero-trail-${tone}`} x1="0" y1="0" x2="1" y2="0">
              {/* Runtime token (--logo-*): @theme inline colours are not emitted as variables. */}
              <stop offset="0" stopOpacity="0" style={{ stopColor: `var(--logo-${tone})` }} />
              <stop offset="0.75" stopOpacity="0.55" style={{ stopColor: `var(--logo-${tone})` }} />
              <stop offset="1" stopOpacity="1" style={{ stopColor: `var(--logo-${tone})` }} />
            </linearGradient>
          ))}
        </defs>
        {/* Rotated to the arrow's heading (up and to the right). */}
        <g transform="rotate(-35 500 400)">
          {STREAKS.map((s, i) => (
            <rect
              key={i}
              className="hero-streak"
              style={{ animationDelay: `${s.delay}ms` }}
              x={s.x}
              y={s.y}
              width={s.length}
              height={s.thickness}
              rx={s.thickness / 2}
              fill={`url(#hero-trail-${s.tone})`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
