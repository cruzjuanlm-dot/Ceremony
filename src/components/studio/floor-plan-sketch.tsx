/** Decorative floor-plan sketch for the Design studio placeholder. Not interactive. */
export function FloorPlanSketch({ className }: { className?: string }) {
  const tables = [
    [70, 60], [130, 60], [190, 60], [250, 60],
    [70, 190], [130, 190], [190, 190], [250, 190],
    [40, 125], [280, 125],
  ];
  return (
    <svg viewBox="0 0 320 250" className={className} aria-hidden fill="none">
      <rect x="4" y="4" width="312" height="242" rx="10" className="stroke-border" strokeWidth="2" />
      {/* stage */}
      <rect x="110" y="12" width="100" height="22" rx="4" className="fill-primary/15 stroke-primary/50" />
      {/* dance floor */}
      <rect x="110" y="95" width="100" height="60" rx="4" className="stroke-primary/50" strokeDasharray="4 4" />
      {/* sweetheart table */}
      <rect x="135" y="80" width="50" height="9" rx="4.5" className="fill-primary/40" />
      {tables.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="15" className="fill-muted stroke-muted-foreground/30" />
          {Array.from({ length: 8 }, (_, s) => {
            const a = (s / 8) * Math.PI * 2;
            return <circle key={s} cx={cx + Math.cos(a) * 21} cy={cy + Math.sin(a) * 21} r="3" className="fill-muted-foreground/25" />;
          })}
        </g>
      ))}
    </svg>
  );
}
