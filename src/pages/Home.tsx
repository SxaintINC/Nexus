import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Banknote,
  Info,
  Mail,
  DoorOpen,
  Rocket,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail as MailIcon,
  Lock,
  User,
  UserCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import sxaint_promo_hp from "../assets/mp4_files/sxaint_promo_hp.mp4.mp4";
import image from "../assets/gadget.png";

/* ─── Data ───────────────────────────────────────────────────────── */
const FEATURES = [
  {
    id: 0,
    tag: "Question Bank",
    title: "Create Exams in Minutes",
    subtitle: "No coding. Just results.",
    image: "https://picsum.photos/seed/questions/900/600",
    description:
      "50,000+ questions. Drag & drop. MCQ, essay, math, multimedia. Real-time preview. Launch in under 5 minutes.",
    bullets: [
      "50,000+ question bank",
      "Drag & drop interface",
      "Multiple formats supported",
    ],
  },
  {
    id: 1,
    tag: "Proctoring",
    title: "AI-Powered Proctoring",
    subtitle: "Catch cheating instantly.",
    image: "https://picsum.photos/seed/proctoring/900/600",
    description:
      "Webcam + eye tracking. Tab switch alerts. Full session recording. GDPR & FERPA compliant. Exportable reports.",
    bullets: [
      "Real-time monitoring",
      "Tab switch detection",
      "Session recording",
    ],
  },
  {
    id: 2,
    tag: "Grading",
    title: "Instant Grading & Insights",
    subtitle: "Results in seconds.",
    image: "https://picsum.photos/seed/grading/900/600",
    description:
      "Auto-grade MCQs. AI essay scoring. Interactive dashboards. Track trends. Identify weak topics.",
    bullets: ["Auto-grading", "AI essay scoring", "Analytics dashboard"],
  },
  {
    id: 3,
    tag: "Mobile",
    title: "Test Anywhere",
    subtitle: "Mobile, tablet, desktop.",
    image: "https://picsum.photos/seed/mobile/900/600",
    description:
      "Offline mode. Auto-sync. Push alerts. Low-data mode. Start, pause, resume anytime.",
    bullets: ["Offline mode", "Cross-platform", "Auto-sync"],
  },
  {
    id: 4,
    tag: "Enterprise",
    title: "Scale Without Limits",
    subtitle: "From 10 to 100,000+ users.",
    image: "https://picsum.photos/seed/analytics/900/600",
    description:
      "LMS integration. White-label. 99.99% uptime. Admin, teacher, proctor roles.",
    bullets: ["LMS integration", "White-label", "99.99% uptime"],
  },
];

const NAV_LINKS = [
  { href: "#features", Icon: Sparkles },
  { href: "#stats", Icon: Banknote },
  { href: "#about", Icon: Info },
  { href: "#contact", Icon: Mail },
];

/* ─── Easing for CountUp ───────────────────────────────────────── */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/* ─── CountUp Hook ──────────────────────────────────────────────── */
function useCountUp(
  start: number,
  end: number,
  duration: number,
  active: boolean,
) {
  const [value, setValue] = useState(start);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const t0 = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      setValue(Math.round(start + (end - start) * easeOutExpo(t)));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
      }
    };
  }, [active, start, end, duration]);

  return value;
}

/* ─── StatBlock Component ───────────────────────────────────────── */
function StatBlock({
  countStart,
  countEnd,
  duration,
  label,
  active,
  delay,
  isLast,
}: {
  countStart: number;
  countEnd: number;
  duration: number;
  label: string;
  active: boolean;
  delay: string;
  isLast: boolean;
}) {
  const value = useCountUp(countStart, countEnd, duration, active);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "50px",
        position: "relative",
        overflow: "hidden",
        borderBottom: !isLast ? "1px solid rgba(0,0,0,.08)" : "none",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(25px)",
        transition: `all .8s ease ${delay}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-10px",
          bottom: "-25px",
          fontSize: "clamp(8rem,18vw,15rem)",
          fontWeight: 900,
          color: "rgba(0,0,0,.04)",
          pointerEvents: "none",
        }}
      >
        {value}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          lineHeight: 0.9,
        }}
      >
        <span
          style={{
            fontSize: "clamp(6rem,12vw,10rem)",
            fontWeight: 700,
            color: "#E8E8E8",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: "clamp(3rem,6vw,5rem)",
            color: "#E8E8E8",
          }}
        >
          %
        </span>
      </div>

      <div
        style={{
          marginTop: "18px",
          fontWeight: 700,
          fontSize: "1rem",
          color: "#222",
        }}
      >
        {label}
        <span style={{ marginLeft: "12px" }}>›</span>
      </div>
    </div>
  );
}

/* ─── StatsSection Component ────────────────────────────────────── */
function StatsSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const trigger = useCallback(() => setVisible(true), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trigger();
          obs.disconnect();
        }
      },
      {
        threshold: 0.15,
      },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [trigger]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        padding: "20px",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#FFFFFF",
      }}
    >
      <section
        ref={ref}
        id="stats"
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "#FFFFFF",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,.08)",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            position: "relative",
            background: "#F7F7F7",
            overflow: "hidden",
            borderRight: "1px solid rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              position: "absolute",
              top: "50px",
              left: "50px",
              zIndex: 10,
              fontSize: "clamp(2rem,3vw,4rem)",
              fontWeight: 500,
              color: "#000",
            }}
          >
            Impact That
            <br />
            Speaks for Itself
          </h2>

          <img
            src={image}
            alt=""
            style={{
              position: "absolute",
              width: "72%",
              height: "72%",
              objectFit: "contain",
              left: "50%",
              top: "58%",
              transform: "translate(-50%,-50%)",
              opacity: visible ? 1 : 0,
              transition: "opacity 1s ease",
            }}
          />
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#F7F7F7",
            overflow: "hidden",
          }}
        >
          <StatBlock
            countStart={15}
            countEnd={95}
            duration={3000}
            label="Improved Student Performance"
            active={visible}
            delay="0.1s"
            isLast={false}
          />
          <StatBlock
            countStart={15}
            countEnd={90}
            duration={6000}
            label="Higher Exam Completion Rate"
            active={visible}
            delay="0.25s"
            isLast={true}
          />
        </div>

        <style>{`
          @media(max-width:800px){
            #stats{
              grid-template-columns:1fr;
            }
          }
        `}</style>
      </section>
    </div>
  );
}

/* ─── ImageCarouselPane ───────────────────────────────────────────── */
function ImageCarouselPane({
  features,
  current,
  isAnimating,
  direction,
  onPrev,
  onNext,
  onDot,
}: {
  features: typeof FEATURES;
  current: number;
  isAnimating: boolean;
  direction: "left" | "right" | null;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
}) {
  const total = features.length;
  const prevIdx = (current - 1 + total) % total;
  const nextIdx = (current + 1) % total;

  const slotStyle = (
    slot: "active" | "prev" | "next" | "hidden",
  ): React.CSSProperties => {
    const baseTransition =
      "transform 0.55s cubic-bezier(0.34,1.1,0.64,1), opacity 0.45s ease, filter 0.45s ease, box-shadow 0.45s ease";

    if (slot === "active") {
      return {
        transform: "translateX(0%) scale(1)",
        opacity: 1,
        filter: "blur(0px) brightness(1)",
        zIndex: 10,
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        transition: baseTransition,
        pointerEvents: "none",
      };
    }
    if (slot === "prev") {
      return {
        transform: "translateX(-58%) scale(0.82) rotateY(4deg)",
        opacity: 0.55,
        filter: "blur(1.5px) brightness(0.85)",
        zIndex: 5,
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        transition: baseTransition,
        pointerEvents: "auto",
        cursor: "pointer",
      };
    }
    if (slot === "next") {
      return {
        transform: "translateX(58%) scale(0.82) rotateY(-4deg)",
        opacity: 0.55,
        filter: "blur(1.5px) brightness(0.85)",
        zIndex: 5,
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        transition: baseTransition,
        pointerEvents: "auto",
        cursor: "pointer",
      };
    }
    return {
      transform:
        direction === "left"
          ? "translateX(-120%) scale(0.7)"
          : "translateX(120%) scale(0.7)",
      opacity: 0,
      filter: "blur(3px)",
      zIndex: 1,
      transition: baseTransition,
      pointerEvents: "none",
    };
  };

  const getSlot = (idx: number): "active" | "prev" | "next" | "hidden" => {
    if (idx === current) return "active";
    if (idx === prevIdx) return "prev";
    if (idx === nextIdx) return "next";
    return "hidden";
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <div
        className="relative w-full"
        style={{ height: "400px", perspective: "900px" }}
      >
        {features.map((f, idx) => {
          const slot = getSlot(idx);
          return (
            <div
              key={f.id}
              onClick={
                slot === "prev" ? onPrev : slot === "next" ? onNext : undefined
              }
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "70%",
                maxWidth: "400px",
                aspectRatio: "4/3",
                marginTop: "-120px",
                marginLeft: "-35%",
                borderRadius: "20px",
                overflow: "hidden",
                transformOrigin: "center center",
                willChange: "transform, opacity, filter",
                ...slotStyle(slot),
              }}
            >
              <img
                src={f.image}
                alt={f.tag}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform:
                    isAnimating && slot === "active"
                      ? "scale(1.04)"
                      : "scale(1)",
                  transition: "transform 0.55s ease",
                }}
              />
              {slot === "active" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "15px",
                    left: "15px",
                    background: "#007bff",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "6px 14px",
                    borderRadius: "24px",
                    opacity: isAnimating ? 0 : 1,
                    transform: isAnimating
                      ? "translateY(4px)"
                      : "translateY(0)",
                    transition:
                      "opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s",
                  }}
                >
                  {f.tag}
                </div>
              )}
              {slot === "active" && (
                <div
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(4px)",
                    color: "#007bff",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: "24px",
                  }}
                >
                  {current + 1} / {total}
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-center gap-3"
        style={{ marginTop: "30px" }}
      >
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => onDot(i)}
            aria-label={`Go to feature ${i + 1}`}
            style={{
              width: i === current ? "28px" : "10px",
              height: "10px",
              borderRadius: "20px",
              background: i === current ? "#007bff" : "#d1d5db",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition:
                "width 0.35s cubic-bezier(0.34,1.1,0.64,1), background 0.3s ease",
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-4" style={{ marginTop: "24px" }}>
        <button
          onClick={onPrev}
          aria-label="Previous feature"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "1.5px solid #e5e7eb",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
          }}
        >
          <ChevronLeft size={20} color="#374151" />
        </button>
        <button
          onClick={onNext}
          aria-label="Next feature"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            background: "#007bff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 14px rgba(0,123,255,0.4)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#0056b3";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#007bff";
          }}
        >
          <ChevronRight size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ─── TextContentPane ─────────────────────────────────────────────── */
function TextContentPane({
  feature,
  isAnimating,
  onGetStarted,
}: {
  feature: (typeof FEATURES)[0];
  isAnimating: boolean;
  onGetStarted: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "24px",
        padding: "48px 40px",
        height: "100%",
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? "translateY(10px)" : "translateY(0)",
        transition: "opacity 0.38s ease, transform 0.38s ease",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#eff6ff",
          color: "#007bff",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          padding: "8px 16px",
          borderRadius: "24px",
          width: "fit-content",
        }}
      >
        <Sparkles size={14} />
        {feature.subtitle}
      </span>

      <div>
        <h3
          style={{
            fontSize: "clamp(1.8rem, 3vw, 2.2rem)",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.3,
            margin: "0 0 12px",
          }}
        >
          {feature.title}
        </h3>
        <p
          style={{
            fontSize: "1rem",
            color: "#64748b",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {feature.description}
        </p>
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {feature.bullets.map((b, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "0.95rem",
              color: "#374151",
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? "translateX(8px)" : "translateX(0)",
              transition: `opacity 0.35s ease ${0.08 + i * 0.06}s, transform 0.35s ease ${0.08 + i * 0.06}s`,
            }}
          >
            <CheckCircle2 size={18} color="#007bff" style={{ flexShrink: 0 }} />
            {b}
          </li>
        ))}
      </ul>
      <button
        onClick={onGetStarted}
        style={{
          marginTop: "8px",
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: "#007bff",
          color: "#fff",
          fontSize: "0.95rem",
          fontWeight: 700,
          padding: "14px 28px",
          borderRadius: "14px",
          border: "none",
          cursor: "pointer",
          width: "fit-content",
          transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
          boxShadow: "0 4px 16px rgba(0,123,255,0.3)",
          opacity: isAnimating ? 0 : 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#0056b3";
          (e.currentTarget as HTMLButtonElement).style.transform =
            "scale(1.04)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#007bff";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        Get Started <Rocket size={16} />
      </button>
    </div>
  );
}

/* ─── AppleTabletFeatures ───────────────────────────────── */
function AppleTabletFeatures({ onGetStarted }: { onGetStarted: () => void }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const autoRotateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRotate = () => {
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    autoRotateRef.current = setTimeout(() => {
      triggerTransition("right", (p) => (p + 1) % FEATURES.length);
    }, 5000);
  };

  useEffect(() => {
    scheduleRotate();
    return () => {
      if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    };
  }, [current]);

  const triggerTransition = (
    dir: "left" | "right",
    getNext: (prev: number) => number,
  ) => {
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(getNext);
      setIsAnimating(false);
    }, 400);
  };

  const goTo = (i: number) => {
    if (i === current || isAnimating) return;
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    const dir = i > current ? "right" : "left";
    triggerTransition(dir, () => i);
    scheduleRotate();
  };

  const prev = () => {
    if (isAnimating) return;
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    triggerTransition(
      "left",
      (p) => (p - 1 + FEATURES.length) % FEATURES.length,
    );
    scheduleRotate();
  };

  const next = () => {
    if (isAnimating) return;
    if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
    triggerTransition("right", (p) => (p + 1) % FEATURES.length);
    scheduleRotate();
  };

  return (
    <div
      id="features"
      style={{
        width: "100%",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 50px 80px 50px",
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f8faff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,123,255,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          left: "-8%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,123,255,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Tablet Frame - Thicker bezel */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "600px",
          background: "#1a1a1a",
          borderRadius: "48px",
          padding: "40px 24px 45px 24px",
          boxShadow:
            "0 60px 120px rgba(0,0,0,0.3), 0 12px 36px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
          position: "relative",
        }}
      >
        {/* Camera dot - larger for thicker bezel */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#2d2d2d",
            border: "2px solid #444",
            zIndex: 20,
          }}
        />

        {/* Screen */}
        <div
          style={{
            background: "#fff",
            borderRadius: "32px",
            overflow: "hidden",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          {/* Left — image carousel */}
          <div
            style={{
              background: "#f9fafb",
              borderRight: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.025) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.025) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div style={{ width: "100%", position: "relative", zIndex: 2 }}>
              <ImageCarouselPane
                features={FEATURES}
                current={current}
                isAnimating={isAnimating}
                direction={direction}
                onPrev={prev}
                onNext={next}
                onDot={goTo}
              />
            </div>
          </div>

          {/* Right — text content */}
          <div
            style={{
              background: "#ffffff",
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <TextContentPane
              feature={FEATURES[current]}
              isAnimating={isAnimating}
              onGetStarted={onGetStarted}
            />
          </div>
        </div>

        {/* Home button indicator - larger for thicker bezel */}
        <div
          style={{
            width: "44px",
            height: "5px",
            background: "#333",
            borderRadius: "6px",
            margin: "16px auto 0",
          }}
        />
      </div>
    </div>
  );
}

/* ─── GetStartedForm Component ───────────────────────────────── */
function GetStartedForm({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    agreeTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-full md:w-[55%] lg:w-[55%] bg-white shadow-2xl z-30 transition-all duration-700 ease-[cubic-bezier(0.34,1.1,0.64,1)] overflow-y-auto ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      <div className="min-h-screen p-6 md:p-10">
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <div>
              <span className="text-gray-600 text-sm">Already a member?</span>
              <button className="text-purple-600 font-semibold text-sm hover:text-purple-700 transition-colors ml-1">
                Sign in →
              </button>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] group">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 text-sm font-medium">Google</span>
            </button>

            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] group">
              <svg
                className="w-5 h-5 text-[#1877F2]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-gray-700 text-sm font-medium">
                Facebook
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or sign up using your email address
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <MailIcon size={18} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email or Phone no."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <UserCircle size={18} />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                id="terms"
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to all{" "}
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  terms
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] hover:from-purple-700 hover:to-indigo-700"
            >
              Sign up
            </button>
          </form>

          {/* Bottom Text */}
          <div className="text-center mt-6">
            <span className="text-gray-600 text-sm">
              Already have an account?
            </span>
            <button className="text-purple-600 font-semibold text-sm hover:text-purple-700 ml-1">
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── HomepageContent ────────────────────────────────────────────────── */
// Extracted to prevent remounting during split-screen transition
function HomepageContent({ onGetStarted }: { onGetStarted: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.5), 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroOpacity = Math.max(1 - scrollProgress * 1.4, 0);
  const featuresOpacity = Math.min((scrollProgress - 0.5) * 3, 1);
  const showFeatures = scrollProgress >= 0.5;

  return (
    <div className="relative">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 md:py-4 border-b border-gray-200 bg-white z-50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <img
            src={logo}
            alt="SXaint logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
            style={{
              borderRadius: "50px",
            }}
          />
          <span className="hidden sm:inline text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-[#007bff] to-[#0056b3] bg-clip-text text-transparent tracking-tight">
            SXaint
          </span>
        </div>

        <div className="hidden md:flex items-center gap-5 lg:gap-6">
          {NAV_LINKS.map(({ href, Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#007bff] transition-colors duration-200"
            >
              <Icon size={16} />
            </a>
          ))}
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold bg-[#007bff] hover:bg-[#0056b3] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Get Started <DoorOpen size={16} />
          </button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      </nav>

      {/* Mobile slide-out menu */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-all duration-300 ${mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col p-6 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="self-end p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            <X size={24} className="text-gray-700" />
          </button>
          <nav className="flex flex-col gap-2 mt-6">
            {NAV_LINKS.map(({ href, Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 text-base font-medium text-gray-800 py-3 px-4 hover:bg-gray-50 hover:text-[#007bff] rounded-xl transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
              </a>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                onGetStarted();
              }}
              className="flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-xl text-white bg-[#007bff] hover:bg-[#0056b3] font-semibold"
            >
              Get Started <ArrowRight size={18} />
            </button>
          </nav>
        </div>
      </div>

      {/* HERO — fixed, fades out on scroll, with padding for fixed navbar */}
      <div
        className="fixed top-0 left-0 w-full h-screen overflow-hidden z-10"
        style={{
          opacity: heroOpacity,
          pointerEvents: heroOpacity > 0.05 ? "auto" : "none",
          paddingTop: "65px",
        }}
      >
        {/* Video background */}
        <main className="relative h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={sxaint_promo_hp} type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

          <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-20">
            <div className="max-w-3xl">
              <span className="inline-block text-xs font-bold tracking-widest text-blue-300 uppercase mb-4">
                Assessment Platform
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                Evidence-Based Strategies
                <br className="hidden sm:block" /> for Lasting Change
              </h1>
              <p className="text-lg sm:text-xl text-white/80 max-w-xl mb-8 leading-relaxed">
                Build resilience, overcome challenges — your path to emotional
                balance starts here.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-6 py-3 bg-[#007bff] hover:bg-[#0056b3] text-white font-semibold rounded-xl text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
                >
                  Get Started <Rocket size={16} />
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/30 transition-all backdrop-blur-sm">
                  Watch Demo
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
            <span className="text-white/70 text-xs tracking-wider uppercase">
              Scroll to explore
            </span>
            <div className="w-5 h-8 border-2 border-white/50 rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-1.5 bg-white rounded-full animate-scroll" />
            </div>
          </div>
        </main>
      </div>

      {/* Spacer so features start below the viewport */}
      <div className="h-[300px]" />

      {/* Features Section */}
      <div
        ref={featuresRef}
        style={{
          opacity: featuresOpacity,
          pointerEvents: showFeatures ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        <AppleTabletFeatures onGetStarted={onGetStarted} />
      </div>

      {/* Stats Section */}
      <StatsSection />

      {/* Chat support button */}
      <button
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 transition-transform hover:scale-110 active:scale-95"
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Open support chat"
      >
        <MessageCircle size={22} fill="white" stroke="white" />
      </button>

      <style>{`
        @keyframes scroll {
          0%   { transform: translateY(0);  opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        .animate-scroll { animation: scroll 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ─── Main Merged Homepage ────────────────────────────────────────────────── */
export default function Homepage() {
  const [showGetStarted, setShowGetStarted] = useState(false);

  const handleGetStarted = useCallback(() => {
    setShowGetStarted(true);
  }, []);

  const handleCloseGetStarted = useCallback(() => {
    setShowGetStarted(false);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Overlay/dim effect when split-screen is active */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-700 z-20 ${
          showGetStarted ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Homepage Panel - Transforms to left panel */}
      <div
        className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.1,0.64,1)] ${
          showGetStarted
            ? "w-[42%] md:w-[42%] lg:w-[42%] translate-x-0 scale-[0.97] rounded-2xl overflow-hidden shadow-2xl"
            : "w-full translate-x-0 scale-100 rounded-none"
        }`}
        style={{
          position: "relative",
          zIndex: 25,
          height: showGetStarted ? "calc(100vh - 40px)" : "auto",
          margin: showGetStarted ? "20px 0 20px 20px" : "0",
          transformOrigin: "center left",
        }}
      >
        <HomepageContent onGetStarted={handleGetStarted} />
      </div>

      {/* Get Started Panel - Slides in from right */}
      <GetStartedForm
        isVisible={showGetStarted}
        onClose={handleCloseGetStarted}
      />
    </div>
  );
}
