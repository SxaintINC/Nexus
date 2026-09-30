// ── CHART KIT ─────────────────────────────────────────────────────────────────
// Hand-built SVG charts in the Nexus visual language — no chart library, so
// every chart inherits the ivory/ink/sage palette exactly. All charts are
// responsive (SVG viewBox + width:100%) and get their numbers from the seeded
// demo dataset.

import { useState } from "react";

import { C, SERIF } from "../../../shared/ui/kit";

const FONT = "Inter, system-ui, -apple-system, sans-serif";

// ── SPARKLINE ─────────────────────────────────────────────────────────────────
// Tiny area+line for stat cards. Purely decorative.

export function Sparkline({
  data,
  width = 96,
  height = 34,
  tone = "green",
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: "green" | "ink";
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const px = (i: number) => (i / (data.length - 1)) * (width - 2) + 1;
  const py = (v: number) => height - 3 - ((v - min) / span) * (height - 7);
  const pts = data.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const stroke = tone === "green" ? C.green : C.ink;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <polyline
        points={`1,${height} ${pts} ${width - 1},${height}`}
        fill={tone === "green" ? "rgba(90,122,63,0.10)" : "rgba(22,21,15,0.06)"}
        stroke="none"
        className="nx-fade-in"
      />
      <polyline points={pts} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="nx-draw" style={{ animationDuration: "0.9s", animationDelay: "0.15s" }} />
      <circle cx={px(data.length - 1)} cy={py(data[data.length - 1])} r="2.4" fill={stroke} />
    </svg>
  );
}

// ── TREND CHART ───────────────────────────────────────────────────────────────
// The main chart: smooth area line, dotted grid, y-axis ticks, x labels, and a
// hover crosshair + tooltip (score + submissions), like the sales-trend
// reference. Data comes pre-bucketed (daily/weekly/monthly) from the caller.

export function TrendChart({ points, showTrendLine }: { points: { label: string; score: number; submissions: number }[]; showTrendLine?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 260;
  const PAD = { t: 18, r: 16, b: 30, l: 40 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;

  const scores = points.map((p) => p.score);
  const lo = Math.max(0, Math.floor((Math.min(...scores) - 6) / 10) * 10);
  const hi = Math.min(100, Math.ceil((Math.max(...scores) + 6) / 10) * 10);
  const span = hi - lo || 1;

  const px = (i: number) => PAD.l + (i / (points.length - 1)) * iw;
  const py = (v: number) => PAD.t + ih - ((v - lo) / span) * ih;

  // Smooth cubic path through the points.
  const line = points
    .map((p, i) => {
      if (i === 0) return `M ${px(i)} ${py(p.score)}`;
      const x0 = px(i - 1);
      const y0 = py(points[i - 1].score);
      const cx = (x0 + px(i)) / 2;
      return `C ${cx} ${y0}, ${cx} ${py(p.score)}, ${px(i)} ${py(p.score)}`;
    })
    .join(" ");
  const area = `${line} L ${px(points.length - 1)} ${PAD.t + ih} L ${PAD.l} ${PAD.t + ih} Z`;

  // Least-squares trend line (the reference's "Show Trend Line" checkbox).
  const trendPath = (() => {
    const n = points.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = scores.reduce((s, v) => s + v, 0);
    const sumXY = scores.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = scores.reduce((s, _v, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const at = (i: number) => Math.max(lo - 4, Math.min(hi + 4, slope * i + intercept));
    return `M ${px(0)} ${py(at(0))} L ${px(n - 1)} ${py(at(n - 1))}`;
  })();

  const yTicks = 4;
  const hp = hover != null ? points[hover] : null;

  return (
    <div style={{ position: "relative", fontFamily: FONT }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((x - PAD.l) / iw) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(90,122,63,0.20)" />
            <stop offset="100%" stopColor="rgba(90,122,63,0.01)" />
          </linearGradient>
        </defs>

        {/* Grid + y ticks */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = lo + (span / yTicks) * i;
          const y = py(v);
          return (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke={C.lineSoft} strokeDasharray="2 5" />
              <text x={PAD.l - 9} y={y + 3.5} textAnchor="end" fontSize="10.5" fill={C.faint} fontFamily={FONT}>
                {v}
              </text>
            </g>
          );
        })}

        {/* Area + line */}
        <path d={area} fill="url(#trendFill)" className="nx-fade-in" />
        <path
          key={points.length + String(showTrendLine)}
          d={line}
          fill="none"
          stroke={C.green}
          strokeWidth="2.4"
          strokeLinecap="round"
          pathLength={1}
          className="nx-draw"
        />

        {/* Optional straight trend line (dashed ink) */}
        {showTrendLine && <path d={trendPath} fill="none" stroke={C.ink} strokeWidth="1.6" strokeDasharray="5 5" strokeLinecap="round" opacity={0.65} />}

        {/* X labels — thin out when crowded */}
        {points.map((p, i) => {
          const every = points.length > 10 ? Math.ceil(points.length / 8) : 1;
          if (i % every !== 0 && i !== points.length - 1) return null;
          return (
            <text key={`${p.label}-${i}`} x={px(i)} y={H - 9} textAnchor="middle" fontSize="10.5" fill={i === hover ? C.ink : C.faint} fontWeight={i === hover ? 600 : 400} fontFamily={FONT}>
              {p.label}
            </text>
          );
        })}

        {/* Crosshair */}
        {hover != null && hp && (
          <g>
            <line x1={px(hover)} x2={px(hover)} y1={PAD.t} y2={PAD.t + ih} stroke={C.ink} strokeOpacity="0.25" strokeDasharray="3 4" />
            <circle cx={px(hover)} cy={py(hp.score)} r="5.5" fill={C.white} stroke={C.green} strokeWidth="2.4" />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hover != null && hp && (
        <div
          style={{
            position: "absolute",
            left: `calc(${((px(hover) / W) * 100).toFixed(2)}% + ${px(hover) / W > 0.75 ? -150 : 14}px)`,
            top: 6,
            background: C.white,
            border: `1px solid ${C.lineSoft}`,
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(30,35,20,0.12)",
            padding: "10px 14px",
            pointerEvents: "none",
            minWidth: 132,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>
            {hp.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.ink }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: C.green, flexShrink: 0 }} />
            Avg score <b style={{ marginLeft: "auto" }}>{hp.score}%</b>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.ink, marginTop: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: C.ink, flexShrink: 0 }} />
            Submissions <b style={{ marginLeft: "auto" }}>{hp.submissions}</b>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DONUT ─────────────────────────────────────────────────────────────────────
// Grade distribution ring with the pass-rate in the middle and a legend.

const DONUT_COLORS = [C.green, "#8FAF6E", "#B9CD9C", C.amber, "#D9A648", C.red];

export function Donut({
  data,
  centerLabel,
  centerSub,
  size = 190,
}: {
  data: { label: string; value: number; remark?: string }[];
  centerLabel: string;
  centerSub: string;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 60;
  const CIRC = 2 * Math.PI * R;

  // Each segment starts where all previous ones end — computed functionally so
  // nothing mutates during render.
  const segs = data.map((d, i) => {
    const frac = d.value / total;
    const before = data.slice(0, i).reduce((s, x) => s + x.value, 0) / total;
    return { ...d, frac, dash: frac * CIRC, offset: before * CIRC, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <div className="nx-pop" style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="80" cy="80" r={R} fill="none" stroke={C.blob} strokeWidth="17" />
          {segs.map((s) => (
            <circle
              key={s.label}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="17"
              strokeDasharray={`${Math.max(0, s.dash - 2.5)} ${CIRC - Math.max(0, s.dash - 2.5)}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, letterSpacing: "-0.5px", color: C.ink }}>{centerLabel}</span>
          <span style={{ fontSize: 11, color: C.faint, letterSpacing: "0.4px" }}>{centerSub}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 148 }}>
        {segs.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: C.muted }}>
              {s.label} · {s.remark ?? ""}
            </span>
            <b style={{ marginLeft: "auto", color: C.ink, fontWeight: 600 }}>{s.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HORIZONTAL BARS ───────────────────────────────────────────────────────────
// Subject ranking: value bar, average marker, trend chip at the end.

export function HBars({
  rows,
  max = 100,
}: {
  rows: { name: string; avg: number; trend: number }[];
  max?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((r) => (
        <div key={r.name}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{r.name}</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                fontWeight: 600,
                color: r.trend >= 0 ? C.green : C.red,
                background: r.trend >= 0 ? C.greenDarkWash : C.redWash,
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              {r.trend >= 0 ? "▲" : "▼"} {Math.abs(r.trend)}
            </span>
            <b style={{ fontSize: 13.5, fontWeight: 700, minWidth: 34, textAlign: "right" }}>{r.avg}%</b>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: C.blob, overflow: "hidden" }}>
            <div
              className="nx-bar-x"
              style={{
                height: "100%",
                width: `${(r.avg / max) * 100}%`,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${C.green}, ${C.greenBright})`,
                transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                animationDelay: `${rows.findIndex((x) => x.name === r.name) * 90}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MINI BARS ─────────────────────────────────────────────────────────────────
// Fee-collection bars — compact vertical columns with labels beneath.

export function MiniBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 132 }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, height: "100%", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10.5, color: C.faint, fontWeight: 600 }}>₦{Math.round(d.value / 1000)}k</span>
          <div
            className="nx-bar-y"
            style={{
              width: "100%",
              maxWidth: 34,
              height: `${(d.value / max) * 86}%`,
              minHeight: 6,
              borderRadius: "7px 7px 3px 3px",
              background: `linear-gradient(180deg, ${C.greenBright}, ${C.green})`,
              opacity: 0.92,
              animationDelay: `${data.findIndex((x) => x.label === d.label) * 60}ms`,
            }}
          />
          <span style={{ fontSize: 11, color: C.muted }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
