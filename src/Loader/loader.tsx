// Loader.tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type Pt = [number, number];

function pointsToAttr(pts: Pt[]) {
  return pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(" ");
}

interface LoadingScreenProps {
  onDone?: () => void;
  /** Duration of stage 1 (bar fill) in seconds. Default: 2.0 */
  stage1Duration?: number;
  /** Duration of stage 2 (bar → triangle morph) in seconds. Default: 1.0 */
  stage2Duration?: number;
  /** Duration of stage 3 (expansion and fade) in seconds. Default: 1.3 */
  stage3Duration?: number;
  /** Custom color for the loader. Default: '#fff' */
  color?: string;
  /** Custom background color. Default: '#000' */
  backgroundColor?: string;
  /** Show percentage counter. Default: true */
  showPercentage?: boolean;
}

export function LoadingScreen({
  onDone,
  stage1Duration = 2.0,
  stage2Duration = 1.0,
  stage3Duration = 1.3,
  color = "#fff",
  backgroundColor = "#000",
  showPercentage = true,
}: LoadingScreenProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const poly = useRef<SVGPolygonElement>(null);
  const track = useRef<SVGRectElement>(null);
  const blackBg = useRef<SVGRectElement>(null);
  const whiteUse = useRef<SVGUseElement>(null);
  const counter = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const writePoly = (s: Record<string, Pt>) => {
      if (poly.current) {
        poly.current.setAttribute(
          "points",
          pointsToAttr([s.tl, s.tr, s.br, s.bl]),
        );
      }
    };

    const lerp = (a: Record<string, Pt>, b: Record<string, Pt>, t: number) => ({
      tl: [
        a.tl[0] + (b.tl[0] - a.tl[0]) * t,
        a.tl[1] + (b.tl[1] - a.tl[1]) * t,
      ] as Pt,
      tr: [
        a.tr[0] + (b.tr[0] - a.tr[0]) * t,
        a.tr[1] + (b.tr[1] - a.tr[1]) * t,
      ] as Pt,
      br: [
        a.br[0] + (b.br[0] - a.br[0]) * t,
        a.br[1] + (b.br[1] - a.br[1]) * t,
      ] as Pt,
      bl: [
        a.bl[0] + (b.bl[0] - a.bl[0]) * t,
        a.bl[1] + (b.bl[1] - a.bl[1]) * t,
      ] as Pt,
    });

    const keyframes = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2;
      const cy = vh / 2;
      const BAR_W = Math.min(220, vw * 0.6);
      const BAR_H = Math.min(16, vw * 0.04);
      const triS = Math.min(240, vw * 0.55);
      const hugeS = Math.max(vw, vh) * 3;
      return {
        zero: {
          tl: [cx - BAR_W / 2, cy - BAR_H / 2],
          tr: [cx - BAR_W / 2, cy - BAR_H / 2],
          br: [cx - BAR_W / 2, cy + BAR_H / 2],
          bl: [cx - BAR_W / 2, cy + BAR_H / 2],
        } as Record<string, Pt>,
        bar: {
          tl: [cx - BAR_W / 2, cy - BAR_H / 2],
          tr: [cx + BAR_W / 2, cy - BAR_H / 2],
          br: [cx + BAR_W / 2, cy + BAR_H / 2],
          bl: [cx - BAR_W / 2, cy + BAR_H / 2],
        } as Record<string, Pt>,
        tri: {
          tl: [cx - (2 * triS) / 3, cy - triS / 3],
          tr: [cx + triS / 3, cy - triS / 3],
          br: [cx + triS / 3, cy + (2 * triS) / 3],
          bl: [cx - (2 * triS) / 3, cy - triS / 3],
        } as Record<string, Pt>,
        huge: {
          tl: [cx - (2 * hugeS) / 3, cy - hugeS / 3],
          tr: [cx + hugeS / 3, cy - hugeS / 3],
          br: [cx + hugeS / 3, cy + (2 * hugeS) / 3],
          bl: [cx - (2 * hugeS) / 3, cy - hugeS / 3],
        } as Record<string, Pt>,
      };
    };

    const positionTrack = () => {
      if (!track.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(220, vw * 0.6);
      const h = Math.min(16, vw * 0.04);
      track.current.setAttribute("x", String(vw / 2 - w / 2));
      track.current.setAttribute("y", String(vh / 2 - h / 2));
      track.current.setAttribute("width", String(w));
      track.current.setAttribute("height", String(h));
    };

    const prog = { p: 0 };
    const updateShape = () => {
      const p = prog.p;
      const k = keyframes();
      let s: Record<string, Pt>;
      if (p <= 1) s = lerp(k.zero, k.bar, p);
      else if (p <= 2) s = lerp(k.bar, k.tri, p - 1);
      else s = lerp(k.tri, k.huge, p - 2);
      writePoly(s);
      positionTrack();

      if (counter.current && showPercentage) {
        const fillPct = Math.min(p, 1);
        counter.current.textContent = String(
          Math.floor(fillPct * 100),
        ).padStart(3, "0");
      }
    };
    updateShape();

    const tl = gsap.timeline();

    // Stage 1: visible loading bar
    tl.to(prog, {
      p: 1,
      duration: stage1Duration,
      ease: "power1.inOut",
      onUpdate: updateShape,
    });

    // Stage 2: track fades, bar morphs into triangle
    tl.to(track.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
    tl.to(
      prog,
      {
        p: 2,
        duration: stage2Duration,
        ease: "power3.inOut",
        onUpdate: updateShape,
      },
      "<",
    );
    if (showPercentage) {
      tl.to(
        counter.current,
        { opacity: 0, y: 16, duration: 0.5, ease: "power2.in" },
        "<",
      );
    }

    // Stage 3: expansion and fade
    tl.to(
      [blackBg.current, whiteUse.current],
      { opacity: 0, duration: 0.5, ease: "power2.in" },
      "+=0.15",
    );
    tl.to(
      prog,
      {
        p: 3,
        duration: stage3Duration,
        ease: "power3.in",
        onUpdate: updateShape,
      },
      "<+0.05",
    );
    tl.to(
      overlay.current,
      { opacity: 0, duration: 0.35, ease: "power2.out" },
      "-=0.15",
    );

    tl.call(() => {
      document.body.style.overflow = "";
      onDone?.();
    });

    const onResize = () => updateShape();
    window.addEventListener("resize", onResize);

    return () => {
      tl.kill();
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = "";
    };
  }, [onDone, stage1Duration, stage2Duration, stage3Duration, showPercentage]);

  return (
    <div
      ref={overlay}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        overflow: "hidden",
        background: "transparent",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, display: "block" }}
      >
        <defs>
          <polygon ref={poly} id="loader-shape" />
          <mask id="loader-mask">
            <rect width="100%" height="100%" fill="white" />
            <use href="#loader-shape" fill="black" />
          </mask>
        </defs>
        {/* Layer 1: black with polygon-shaped hole */}
        <rect
          width="100%"
          height="100%"
          fill={backgroundColor}
          mask="url(#loader-mask)"
        />
        {/* Layer 2: opaque background (fades during stage 3) */}
        <rect ref={blackBg} width="100%" height="100%" fill={backgroundColor} />
        {/* Layer 3: track bar */}
        <rect ref={track} fill={`${color}29`} /> {/* 16% opacity equivalent */}
        {/* Layer 4: visible fill polygon */}
        <use ref={whiteUse} href="#loader-shape" fill={color} />
      </svg>

      {showPercentage && (
        <div
          ref={counter}
          style={{
            position: "absolute",
            bottom: "clamp(18px, 4vw, 32px)",
            left: "clamp(18px, 4vw, 32px)",
            color,
            fontSize: "clamp(44px, 12vw, 72px)",
            fontWeight: 300,
            letterSpacing: "-2px",
            lineHeight: 1,
            willChange: "transform, opacity",
          }}
        >
          000
        </div>
      )}
    </div>
  );
}
