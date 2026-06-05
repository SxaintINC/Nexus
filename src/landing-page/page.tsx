import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { useLoader } from "../Loader/loadercontext";

gsap.registerPlugin(ScrollTrigger);

// Local video pool. Drop new .mp4 files into public/video/ and add them here —
// the hero picks one at random on mount and cycles to a different one each time
// the current clip ends.
const VIDEOS = ["/video/student.mp4", "/video/road.mp4", "/video/teacher.mp4"];

// ── EDGE-DETECT SVG FILTER ────────────────────────────────────────────────────
function EdgeFilterDefs() {
  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter
          id="edge-detect"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="gamma" amplitude="1" exponent="0.55" offset="0" />
            <feFuncG type="gamma" amplitude="1" exponent="0.55" offset="0" />
            <feFuncB type="gamma" amplitude="1" exponent="0.55" offset="0" />
          </feComponentTransfer>
          <feConvolveMatrix
            order="3"
            kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
            preserveAlpha="false"
          />
          <feColorMatrix
            type="matrix"
            values="
              0 0 0 0 1
              0 0 0 0 1
              0 0 0 0 1
              2.4 2.4 2.4 0 0"
          />
        </filter>
      </defs>
    </svg>
  );
}

// ── PALETTE ───────────────────────────────────────────────────────────────────

const BLACK = "#000000";
const OFF_WHITE = "#F2F2EF";
const GREEN = "#1F4D3E";
const GREEN_BRIGHT = "#2E6F5A";
const GREEN_TEXT = "#88A99A";
const LIGHT_BG = "#EFEFEC";
const HERO_BG = "#FFFFFF";

// ── DATA ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Products", "Solutions", "Research", "Resources"];

// ── MEGA MENU DATA ────────────────────────────────────────────────────────────

type MenuSection = {
  heading?: string;
  links: { label: string; primary?: boolean }[];
};
type MenuMedia =
  | { kind: "feature"; image: string; tag?: string; title?: string }
  | { kind: "cards"; items: { image: string; title: string; tag: string }[] };
type MegaMenu = { columns: MenuSection[][]; media: MenuMedia };

const MENU_IMG = (seed: string, w = 1000, h = 720) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const MEGA_MENUS: Record<string, MegaMenu> = {
  Products: {
    columns: [
      [
        {
          heading: "Build",
          links: [
            { label: "Question Bank", primary: true },
            { label: "Live Exams" },
            { label: "Proctoring Suite" },
            { label: "Mobile Companion" },
            { label: "Offline Mode" },
            { label: "Templates" },
          ],
        },
      ],
      [
        {
          heading: "Manage",
          links: [
            { label: "Admin Console" },
            { label: "Analytics" },
            { label: "Reporting" },
          ],
        },
        {
          heading: "Integrate",
          links: [
            { label: "REST API" },
            { label: "Single Sign-On" },
            { label: "Webhooks" },
          ],
        },
      ],
    ],
    media: {
      kind: "feature",
      image: MENU_IMG("examly-products"),
      tag: "FEATURED",
      title: "Question Bank 2.0 — now with AI-assisted authoring",
    },
  },
  Solutions: {
    columns: [
      [
        {
          heading: "By tier",
          links: [
            { label: "Primary Schools" },
            { label: "Secondary Schools" },
            { label: "Universities", primary: true },
            { label: "District Networks" },
          ],
        },
      ],
      [
        {
          heading: "By exam type",
          links: [
            { label: "Mock Exams" },
            { label: "Final Exams" },
            { label: "Practice & CA" },
            { label: "Entrance Tests" },
            { label: "Government Exams" },
          ],
        },
      ],
    ],
    media: {
      kind: "feature",
      image: MENU_IMG("examly-solutions"),
      tag: "CASE STUDY",
      title: "How Babcock University runs 5,000-student finals on Examly",
    },
  },
  Research: {
    columns: [
      [
        {
          heading: "Research",
          links: [
            { label: "Research Papers" },
            { label: "Examly Labs", primary: true },
            { label: "Assessment Standards" },
            { label: "Research Blog" },
            { label: "Open Datasets" },
            { label: "Research Careers" },
          ],
        },
      ],
    ],
    media: {
      kind: "feature",
      image: MENU_IMG("examly-research"),
      tag: "LATEST",
      title: "Toward fairer adaptive assessment — Examly Labs Q2 report",
    },
  },
  Resources: {
    columns: [
      [
        {
          heading: "In Examly",
          links: [
            { label: "About" },
            { label: "Security" },
            { label: "Guides" },
            { label: "Careers" },
          ],
        },
      ],
      [
        {
          links: [
            { label: "Contact us" },
            { label: "Blog" },
            { label: "Events" },
            { label: "Documentation" },
          ],
        },
      ],
    ],
    media: {
      kind: "cards",
      items: [
        {
          image: MENU_IMG("examly-labs", 700, 900),
          title: "Introducing Examly Labs",
          tag: "RESEARCH",
        },
        {
          image: MENU_IMG("examly-partner", 700, 900),
          title: "How Babcock deploys CBT that actually works",
          tag: "COMPANY",
        },
      ],
    },
  },
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  bg: string;
  fg: string;
  featured?: boolean;
  span: number;
  avatar: string;
};

const AVATAR = (seed: string) => `https://i.pravatar.cc/200?u=${seed}`;

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "It's the first system my teachers actually want to use. Authoring a paper is faster than typing it in Word.",
    name: "Mrs. Okeke",
    role: "Principal, Day Waterman College",
    bg: "#1F4D3E",
    fg: "#F2F2EF",
    featured: true,
    span: 5,
    avatar: AVATAR("examly-okeke"),
  },
  {
    quote:
      "Examly cut our marking time by 80%. We went from a 2-week turnaround on mocks to same-day results — across 1,400 students.",
    name: "Mrs. Adebayo",
    role: "Exams Coordinator, Greensprings School",
    bg: "#EFEEEA",
    fg: "#0A0A0A",
    span: 7,
    avatar: AVATAR("examly-adebayo"),
  },
  {
    quote:
      "I went from D7 to B2 in Chemistry in one term. The instant feedback after every drill is what changed it.",
    name: "David Okafor",
    role: "SS3 Student, Loyola Jesuit College",
    bg: "#3A6F84",
    fg: "#F2F2EF",
    span: 4,
    avatar: AVATAR("examly-david"),
  },
  {
    quote:
      "Setting up our first paperless mock took half a day. Three months later, every JS3 exam runs on Examly.",
    name: "Mr. Nwosu",
    role: "Vice Principal, Atlantic Hall Epe",
    bg: "#FBFAF6",
    fg: "#0A0A0A",
    span: 5,
    avatar: AVATAR("examly-nwosu"),
  },
  {
    quote:
      "Our pass rate on JAMB went up 18 points after we ran daily Examly drills for one term.",
    name: "Dr. Akinola",
    role: "Head of Sciences, Babcock University",
    bg: "#C5764C",
    fg: "#F2F2EF",
    span: 3,
    avatar: AVATAR("examly-akinola"),
  },
  {
    quote:
      "Examly's adaptive engine knew I was weak in calculus before I did. It built me a study plan in 30 seconds.",
    name: "Chinwe Adeyemi",
    role: "A-Level Student, Lekki British School",
    bg: "#EFEEEA",
    fg: "#0A0A0A",
    span: 4,
    avatar: AVATAR("examly-chinwe"),
  },
  {
    quote:
      "Proctoring just works. Zero incidents across eight mocks this year — that's a first for us.",
    name: "Mr. Bassey",
    role: "Director of Curriculum, Vivian Fowler Memorial",
    bg: "#9A99B6",
    fg: "#0A0A0A",
    span: 4,
    avatar: AVATAR("examly-bassey"),
  },
  {
    quote:
      "For the price of one part-time invigilator we get infrastructure that used to need a full IT team. It just paid for itself.",
    name: "Mr. Akande",
    role: "Founder, Olashore International",
    bg: "#0A0B0E",
    fg: "#F2F2EF",
    span: 4,
    avatar: AVATAR("examly-akande"),
  },
];

// ── SECTION LABEL ─────────────────────────────────────────────────────────────

function SectionLabel({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 28,
      }}
    >
      <span
        style={{
          width: 0,
          height: 0,
          borderTop: `8px solid ${dark ? "#0A0A0A" : GREEN_TEXT}`,
          borderLeft: "8px solid transparent",
          opacity: 0.85,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "2.4px",
          color: dark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ── NAVBAR ────────────────────────────────────────────────────────────────────

function Navbar() {
  const wrap = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const openRef = useRef<string | null>(null);
  const closeT = useRef<number | null>(null);

  useEffect(() => {
    openRef.current = openMenu;
  }, [openMenu]);

  const handleEnter = (key: string | null) => {
    if (closeT.current) {
      window.clearTimeout(closeT.current);
      closeT.current = null;
    }
    setOpenMenu(key);
  };
  const handleLeave = () => {
    if (closeT.current) window.clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrap.current,
        { yPercent: -100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.1,
        },
      );
    });

    let lastY = window.scrollY;
    let hidden = false;
    const TOP_THRESHOLD = 30;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      const top = y < TOP_THRESHOLD;
      setAtTop(top);
      if (openRef.current) {
        lastY = y;
        return;
      }
      if (top) {
        if (hidden) {
          gsap.to(wrap.current, {
            yPercent: 0,
            duration: 0.35,
            ease: "power2.out",
          });
          hidden = false;
        }
      } else if (dy > 4 && y > 80) {
        if (!hidden) {
          gsap.to(wrap.current, {
            yPercent: -100,
            duration: 0.35,
            ease: "power2.in",
          });
          hidden = true;
        }
      } else if (dy < -4) {
        if (hidden) {
          gsap.to(wrap.current, {
            yPercent: 0,
            duration: 0.35,
            ease: "power2.out",
          });
          hidden = false;
        }
      }
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ctx.revert();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const light = atTop || !!openMenu;

  const fg = light ? "#0A0A0A" : OFF_WHITE;
  const fgMuted = light ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.75)";
  const navBg = light ? "rgba(248,248,247,0.94)" : "rgba(0,0,0,0.72)";
  const navBorder = light
    ? "1px solid transparent"
    : "1px solid rgba(255,255,255,0.04)";
  const btnBorder = light ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.18)";
  const btnHover = light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)";
  const ctaBg = light ? "#0A0A0A" : OFF_WHITE;
  const ctaText = light ? OFF_WHITE : "#0A0A0A";
  const tx =
    "color 0.35s ease, background 0.35s ease, border-color 0.35s ease, opacity 0.25s ease";

  const navigate = useNavigate();
  const { showLoader } = useLoader();

  return (
    <>
      <div
        ref={wrap}
        onMouseEnter={() =>
          closeT.current && window.clearTimeout(closeT.current)
        }
        onMouseLeave={handleLeave}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: navBg,
          backdropFilter: "blur(20px)",
          borderBottom: navBorder,
          transition: tx,
        }}
      >
        <nav
          className="r-nav"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "22px 40px",
          }}
        >
          <div
            className="r-nav-cluster"
            style={{ display: "flex", alignItems: "center", gap: 48 }}
          >
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderTop: `13px solid ${fg}`,
                  borderLeft: "13px solid transparent",
                  transition: tx,
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: fg,
                  letterSpacing: "-0.5px",
                  transition: tx,
                }}
              >
                examly
              </span>
            </Link>
            <div className="r-hide-mobile" style={{ display: "flex", gap: 32 }}>
              {NAV_LINKS.map((item) => {
                const isOpen = openMenu === item;
                const dimmed = openMenu && !isOpen;
                return (
                  <a
                    key={item}
                    href="#"
                    onMouseEnter={() =>
                      handleEnter(MEGA_MENUS[item] ? item : null)
                    }
                    style={{
                      color: isOpen ? fg : dimmed ? "rgba(0,0,0,0.4)" : fgMuted,
                      fontSize: 14,
                      fontWeight: isOpen ? 600 : 500,
                      textDecoration: "none",
                      transition: tx,
                    }}
                  >
                    {item}
                  </a>
                );
              })}
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 12, alignItems: "center" }}
            onMouseEnter={() => handleEnter(null)}
          >
            <button
              className="r-hide-mobile"
              style={{
                background: "transparent",
                border: `1px solid ${btnBorder}`,
                borderRadius: 12,
                padding: "9px 22px",
                color: fg,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: tx,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = btnHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Log In
            </button>

            <button
              onClick={() => {
                showLoader();

                setTimeout(() => {
                  navigate("/getstarted");
                }, 50);
              }}
              style={{
                background: ctaBg,
                border: `1px solid ${ctaBg}`,
                borderRadius: 12,
                padding: "9px 22px",
                color: ctaText,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: `${tx}, transform 0.2s`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              Book Demo
            </button>

            <button
              className="r-show-mobile"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              style={{
                background: "transparent",
                border: `1px solid ${btnBorder}`,
                borderRadius: 10,
                width: 38,
                height: 38,
                padding: 0,
                color: fg,
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
                transition: tx,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                {mobileOpen ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>
        <MegaPanel openKey={openMenu} />
      </div>
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        light={light}
      />
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  light,
}: {
  open: boolean;
  onClose: () => void;
  light: boolean;
}) {
  const [sub, setSub] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => setSub(null), 500);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      if (open) document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sub) setSub(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, sub, onClose]);

  const bg = light ? "#FAFAF7" : "#0A0B0D";
  const fg = light ? "#0A0A0A" : "#F2F2EF";
  const fgDim = light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.55)";
  const border = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = light ? "#FFFFFF" : "#15161B";
  const ctaBg = light ? "#0A0A0A" : "#F2F2EF";
  const ctaText = light ? "#F2F2EF" : "#0A0A0A";
  const serif = "'Source Serif 4', 'Iowan Old Style', Georgia, serif";

  const subMenu = sub ? MEGA_MENUS[sub] : null;
  const flatSections = subMenu ? subMenu.columns.flatMap((col) => col) : [];

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      aria-hidden={!open}
      style={{
        position: "fixed",
        inset: 0,
        background: bg,
        zIndex: 1050,
        transform: open ? "translateY(0)" : "translateY(-100%)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition:
          "transform 0.45s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.3s ease",
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "200%",
          height: "100%",
          transform: sub ? "translateX(-50%)" : "translateX(0)",
          transition: "transform 0.42s cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        <div
          style={{
            width: "50%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              to="/"
              onClick={handleClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderTop: `13px solid ${fg}`,
                  borderLeft: "13px solid transparent",
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: fg,
                  letterSpacing: "-0.5px",
                }}
              >
                examly
              </span>
            </Link>
            <button
              onClick={handleClose}
              aria-label="Close menu"
              style={iconBtn(fg, border)}
            >
              <CloseIcon />
            </button>
          </div>

          <nav
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 24px 130px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {NAV_LINKS.map((item, i) => {
              const hasSub = !!MEGA_MENUS[item];
              return (
                <button
                  key={item}
                  onClick={() => (hasSub ? setSub(item) : handleClose())}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      i === NAV_LINKS.length - 1
                        ? "none"
                        : `1px solid ${border}`,
                    padding: "26px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    color: fg,
                    fontFamily: serif,
                    fontSize: 38,
                    fontWeight: 500,
                    letterSpacing: "-1.2px",
                    textAlign: "left",
                  }}
                >
                  <span>{item}</span>
                  <span
                    style={{
                      color: fgDim,
                      fontSize: 28,
                      fontFamily: "inherit",
                    }}
                  >
                    ›
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div
          style={{
            width: "50%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              position: "relative",
              minHeight: 60,
            }}
          >
            <button
              onClick={() => setSub(null)}
              aria-label="Back"
              style={iconBtn(fg, border, {
                background: "transparent",
                border: "none",
              })}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18 L9 12 L15 6" />
              </svg>
            </button>
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: 16,
                fontWeight: 500,
                color: fg,
                pointerEvents: "none",
                fontFamily: "inherit",
              }}
            >
              {sub || ""}
            </span>
            <button
              onClick={handleClose}
              aria-label="Close menu"
              style={{ ...iconBtn(fg, border), marginLeft: "auto" }}
            >
              <CloseIcon />
            </button>
          </div>

          <nav
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "4px 24px 130px",
            }}
          >
            {flatSections.map((section, si) => (
              <div key={si}>
                {section.heading && (
                  <div
                    style={{
                      fontSize: 14,
                      color: fgDim,
                      fontWeight: 500,
                      padding: "22px 0 10px",
                      letterSpacing: 0.2,
                    }}
                  >
                    {section.heading}
                  </div>
                )}
                {section.links.map((l, li) => (
                  <a
                    key={l.label}
                    href="#"
                    onClick={handleClose}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 0",
                      borderBottom:
                        li === section.links.length - 1
                          ? "none"
                          : `1px solid ${border}`,
                      fontSize: 24,
                      fontWeight: 500,
                      color: fg,
                      textDecoration: "none",
                      letterSpacing: "-0.5px",
                      fontFamily: serif,
                    }}
                  >
                    <span>{l.label}</span>
                    <span
                      style={{
                        color: fgDim,
                        fontSize: 22,
                        fontFamily: "inherit",
                      }}
                    >
                      ›
                    </span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: 10,
          display: "flex",
          gap: 10,
          boxShadow: light
            ? "0 16px 40px rgba(0,0,0,0.14)"
            : "0 16px 40px rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(12px)",
          transition:
            "opacity 0.35s 0.25s ease, transform 0.4s 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <button
          onClick={handleClose}
          style={{
            flex: 1,
            background: "transparent",
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: "14px",
            color: fg,
            fontSize: 15,
            fontWeight: 500,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Log In
        </button>
        <button
          onClick={handleClose}
          style={{
            flex: 1,
            background: ctaBg,
            color: ctaText,
            border: "none",
            borderRadius: 12,
            padding: "14px",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Book Demo
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

function iconBtn(
  fg: string,
  border: string,
  override?: React.CSSProperties,
): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${border}`,
    borderRadius: 10,
    width: 38,
    height: 38,
    padding: 0,
    color: fg,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...override,
  };
}

// ── MEGA PANEL ────────────────────────────────────────────────────────────────

function MegaPanel({ openKey }: { openKey: string | null }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const menu = openKey ? MEGA_MENUS[openKey] : null;
  const open = !!menu;

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".mp-heading",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.04 },
      );
      gsap.fromTo(
        ".mp-link",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.035,
          delay: 0.06,
        },
      );
      gsap.fromTo(
        ".mp-media-card",
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.05,
        },
      );
      gsap.fromTo(
        ".mp-media-img",
        { scale: 1.12 },
        {
          scale: 1,
          duration: 1.6,
          ease: "power3.out",
          stagger: 0.05,
          delay: 0.05,
        },
      );
    }, panelRef);
    return () => ctx.revert();
  }, [openKey, open]);

  return (
    <div
      ref={panelRef}
      style={{
        overflow: "hidden",
        maxHeight: open ? 540 : 0,
        opacity: open ? 1 : 0,
        transition:
          "max-height 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease",
      }}
    >
      {menu && (
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            padding: "12px 40px 60px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1.6fr",
            gap: 60,
            color: "#0A0A0A",
          }}
        >
          {[0, 1].map((ci) => (
            <div
              key={ci}
              style={{ display: "flex", flexDirection: "column", gap: 32 }}
            >
              {(menu.columns[ci] || []).map((section, si) => (
                <div key={si}>
                  {section.heading && (
                    <div
                      className="mp-heading"
                      style={{
                        fontSize: 14,
                        color: "rgba(0,0,0,0.5)",
                        marginBottom: 18,
                        fontWeight: 500,
                      }}
                    >
                      {section.heading}
                    </div>
                  )}
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {section.links.map((l) => (
                      <li key={l.label} style={{ marginBottom: 12 }}>
                        <a
                          href="#"
                          className="mp-link"
                          style={{
                            fontSize: 18,
                            fontWeight: l.primary ? 600 : 500,
                            color: "#0A0A0A",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "rgba(0,0,0,0.55)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#0A0A0A")
                          }
                        >
                          {l.label}
                          <span className="mp-arrow">›</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column" }}>
            {menu.media.kind === "feature" ? (
              <a
                href="#"
                className="mp-media-card"
                style={{
                  display: "block",
                  borderRadius: 14,
                  height: 380,
                  position: "relative",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: OFF_WHITE,
                  background: "#1A1A1C",
                }}
              >
                <img
                  src={menu.media.image}
                  alt=""
                  className="mp-media-img"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transformOrigin: "center center",
                    willChange: "transform",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    padding: "26px 30px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  {menu.media.tag && (
                    <div
                      className="mp-link"
                      style={{
                        fontSize: 11,
                        letterSpacing: 2,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.78)",
                        marginBottom: 10,
                      }}
                    >
                      {menu.media.tag}
                    </div>
                  )}
                  {menu.media.title && (
                    <div
                      className="mp-link"
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        lineHeight: 1.22,
                        color: OFF_WHITE,
                        maxWidth: 380,
                      }}
                    >
                      {menu.media.title}
                    </div>
                  )}
                </div>
              </a>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  height: 380,
                }}
              >
                {menu.media.items.map((c, i) => (
                  <a
                    key={i}
                    href="#"
                    className="mp-media-card"
                    style={{
                      borderRadius: 14,
                      position: "relative",
                      overflow: "hidden",
                      textDecoration: "none",
                      color: OFF_WHITE,
                      background: "#1A1A1C",
                    }}
                  >
                    <img
                      src={c.image}
                      alt=""
                      className="mp-media-img"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transformOrigin: "center center",
                        willChange: "transform",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "22px 24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        className="mp-link"
                        style={{
                          fontSize: 10,
                          letterSpacing: 2,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.72)",
                          marginBottom: 8,
                        }}
                      >
                        {c.tag}
                      </div>
                      <div
                        className="mp-link"
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          color: OFF_WHITE,
                        }}
                      >
                        {c.title}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SCROLL CHOREOGRAPHY ───────────────────────────────────────────────────────

function Choreography() {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const panels = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLVideoElement>(null);
  const brackets = useRef<HTMLDivElement>(null);
  const greenBlock = useRef<HTMLDivElement>(null);
  const greenH = useRef<HTMLHeadingElement>(null);

  const videoEl = useRef<HTMLVideoElement>(null);
  const videoIdx = useRef(-1);

  useEffect(() => {
    if (!videoEl.current) return;
    videoIdx.current = Math.floor(Math.random() * VIDEOS.length);
    const src = VIDEOS[videoIdx.current];
    videoEl.current.src = src;
    videoEl.current.play().catch(() => {});
    if (edge.current) {
      edge.current.src = src;
      edge.current.play().catch(() => {});
    }
  }, []);

  const cycleVideo = () => {
    if (!videoEl.current) return;
    if (VIDEOS.length < 2) {
      videoEl.current.currentTime = 0;
      videoEl.current.play().catch(() => {});
      if (edge.current) {
        edge.current.currentTime = 0;
        edge.current.play().catch(() => {});
      }
      return;
    }
    let next = videoIdx.current;
    while (next === videoIdx.current)
      next = Math.floor(Math.random() * VIDEOS.length);
    videoIdx.current = next;
    const src = VIDEOS[next];
    videoEl.current.src = src;
    videoEl.current.play().catch(() => {});
    if (edge.current) {
      edge.current.src = src;
      edge.current.play().catch(() => {});
    }
  };

  const t1 = useRef<HTMLDivElement>(null);
  const t2 = useRef<HTMLDivElement>(null);
  const t3 = useRef<HTMLDivElement>(null);
  const t4 = useRef<HTMLDivElement>(null);
  const t5 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const isStacked = window.matchMedia("(max-width: 900px)").matches;
      gsap.set(frame.current, {
        xPercent: -50,
        yPercent: -50,
        y: isStacked ? -window.innerHeight * 0.28 : 40,
      });

      gsap.set(
        [t2.current, t3.current, t4.current, t5.current, greenBlock.current],
        { opacity: 0 },
      );
      gsap.set(panels.current, { opacity: 0 });
      gsap.set(edge.current, { opacity: 0 });
      gsap.set(brackets.current, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: stage.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      const VW = () => window.innerWidth;

      tl.addLabel("s1to2")
        .to(t1.current, { opacity: 0, y: -30, duration: 0.4 }, "s1to2")
        .to(
          stage.current,
          { background: BLACK, duration: 0.8, ease: "power2.inOut" },
          "s1to2",
        )
        .to(
          frame.current,
          {
            x: () => VW() * 0.22,
            y: 0,
            scale: 0.42,
            rotateY: 24,
            rotateX: 6,
            rotateZ: -2,
            duration: 1,
            ease: "power2.inOut",
          },
          "s1to2",
        )
        .to(panels.current, { opacity: 1, duration: 0.6 }, "s1to2+=0.3")
        .to(edge.current, { opacity: 1, duration: 0.6 }, "s1to2+=0.4")
        .fromTo(
          t2.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6 },
          "s1to2+=0.5",
        );

      tl.to({}, { duration: 0.6 });

      tl.addLabel("s2to3")
        .to(t2.current, { opacity: 0, y: -30, duration: 0.4 }, "s2to3")
        .to(
          frame.current,
          {
            x: 0,
            y: () => -window.innerHeight * 0.06,
            scale: 0.6,
            rotateY: 4,
            rotateX: 14,
            rotateZ: 0,
            duration: 1,
            ease: "power2.inOut",
          },
          "s2to3",
        )
        .fromTo(
          t3.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6 },
          "s2to3+=0.5",
        );

      tl.to({}, { duration: 0.6 });

      tl.addLabel("s3to4")
        .to(t3.current, { opacity: 0, y: -30, duration: 0.4 }, "s3to4")
        .to(
          frame.current,
          {
            x: () => -VW() * 0.22,
            y: 0,
            scale: 0.42,
            rotateY: -24,
            rotateX: 6,
            rotateZ: 2,
            duration: 1,
            ease: "power2.inOut",
          },
          "s3to4",
        )
        .fromTo(
          t4.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6 },
          "s3to4+=0.5",
        );

      tl.to({}, { duration: 0.6 });

      tl.addLabel("s4to5")
        .to(t4.current, { opacity: 0, y: -30, duration: 0.4 }, "s4to5")
        .to(panels.current, { opacity: 0, duration: 0.4 }, "s4to5")
        .to(edge.current, { opacity: 0, duration: 0.4 }, "s4to5")
        .to(
          frame.current,
          {
            x: () => -VW() * 0.34,
            y: 0,
            scale: 0.2,
            rotateY: 0,
            rotateX: 0,
            rotateZ: 0,
            duration: 1,
            ease: "power2.inOut",
          },
          "s4to5",
        )
        .to(brackets.current, { opacity: 1, duration: 0.5 }, "s4to5+=0.4")
        .fromTo(
          greenBlock.current,
          { opacity: 0, x: 60 },
          { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
          "s4to5+=0.4",
        )
        .fromTo(
          t5.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6 },
          "s4to5+=0.5",
        );

      const words = greenH.current!.querySelectorAll<HTMLElement>(".gw");
      tl.fromTo(
        words,
        { color: "rgba(242,242,239,0.22)" },
        {
          color: "rgba(242,242,239,1)",
          stagger: 0.06,
          duration: 0.4,
          ease: "none",
        },
        "s4to5+=0.7",
      );
    }, wrap);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrap} style={{ position: "relative", height: "500vh" }}>
      <div
        ref={stage}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: HERO_BG,
          perspective: "1600px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div
          ref={t1}
          className="r-hero-text"
          style={{
            position: "absolute",
            left: "8%",
            bottom: "12%",
            maxWidth: 600,
            zIndex: 5,
            color: OFF_WHITE,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              className="r-hero-eyebrow-tri"
              style={{
                width: 0,
                height: 0,
                borderTop: `9px solid ${GREEN_TEXT}`,
                borderLeft: "9px solid transparent",
              }}
            />
            <span
              className="r-hero-eyebrow"
              style={{
                fontSize: 11,
                letterSpacing: 2.4,
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              EXAMLY FOR SCHOOLS
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(40px, 5vw, 72px)",
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: "-2.5px",
              margin: 0,
              marginBottom: 24,
              // background: "linear-gradient(to bottom, #d6d1d1, #ffffff)",
              //WebkitBackgroundClip: "text",
              //WebkitTextFillColor: "transparent",
            }}
          >
            The exam system
            <br />
            schools actually trust.
          </h1>
          <Link to="/getstarted">
            <button
              className="r-hero-cta"
              style={{
                background: OFF_WHITE,
                border: "none",
                borderRadius: 999,
                padding: "12px 22px",
                color: "#0A0A0A",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Get started ›
            </button>
          </Link>
        </div>

        <StageBlock refEl={t2} side="left">
          <SectionLabel>Applications</SectionLabel>
          <Heading>
            Exam systems
            <br />
            that actually work.
          </Heading>
          <Body>
            Most CBT rollouts in schools fail on exam day. We find the right
            assessment model, build the system, and own the outcome.
          </Body>
          <GreenButton>For Schools ›</GreenButton>
          <LogoStrip />
        </StageBlock>

        <div
          ref={t3}
          className="r-reliable-text"
          style={{
            position: "absolute",
            bottom: "8%",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 5,
            padding: "0 5%",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 3vw, 44px)",
              fontWeight: 500,
              color: OFF_WHITE,
              letterSpacing: "-1.4px",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 16,
            }}
          >
            Reliable testing has no shortcuts.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.65,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            Examly works across the assessment stack — from the question banks
            that benchmark your students, to the proctoring systems that keep
            every session airtight. Humans stay in the loop.
          </p>
        </div>

        <StageBlock refEl={t4} side="right">
          <SectionLabel>Data</SectionLabel>
          <Heading>
            The data powering
            <br />
            the country's best schools.
          </Heading>
          <Body>
            Schools at the frontier run on Examly results. We source insights
            with precision (25% of admins hold advanced degrees in education)
            and deliver at the bar exam day demands.
          </Body>
          <GreenButton>Explore Data Engine ›</GreenButton>
        </StageBlock>

        <div
          ref={greenBlock}
          className="r-green-block"
          style={{
            position: "absolute",
            top: "50%",
            right: "5%",
            transform: "translateY(-50%)",
            width: "60%",
            maxWidth: 1000,
            background: GREEN,
            borderRadius: 18,
            padding: "60px 70px",
            color: OFF_WHITE,
            zIndex: 5,
          }}
        >
          <div ref={t5}>
            <h2
              ref={greenH}
              style={{
                fontSize: "clamp(36px, 4.6vw, 64px)",
                fontWeight: 500,
                letterSpacing: "-2px",
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              {"90% of the country's leading schools deploy their CBT through Examly."
                .split(" ")
                .map((w, i) => (
                  <span
                    key={i}
                    className="gw"
                    style={{
                      marginRight: "0.25em",
                      fontWeight: w === "90%" ? 700 : 500,
                      display: "inline-block",
                    }}
                  >
                    {w}
                  </span>
                ))}
            </h2>
          </div>
        </div>

        <div
          ref={frame}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "min(94vw, calc((100vh - 110px) * 16 / 9), 2200px)",
            aspectRatio: "16/9",
            transformOrigin: "center center",
            transformStyle: "preserve-3d",
            willChange: "transform",
            zIndex: 4,
          }}
        >
          <div
            ref={panels}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              transformStyle: "preserve-3d",
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => {
              const zDepth = -(i + 1) * 60;
              const xOff = (i + 1) * 14;
              const yOff = (i + 1) * 6;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateZ(${zDepth}px) translateX(${xOff}px) translateY(${yOff}px)`,
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                />
              );
            })}
            {[
              [4, 6, "0111", -40],
              [88, 4, "001", -120],
              [96, 22, "0", -180],
              [94, 44, "0011", -80],
              [92, 64, "1", -160],
              [97, 80, "11", -40],
              [2, 92, "001", -100],
              [-4, 38, "1110", -200],
              [102, 56, "111", -220],
            ].map(([x, y, v, z], i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translateZ(${z}px)`,
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 11,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  letterSpacing: 1,
                }}
              >
                {v as string}
              </span>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#9CA3AF",
              borderRadius: 16,
              padding: 12,
              boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 8,
                overflow: "hidden",
                background: BLACK,
                position: "relative",
              }}
            >
              <video
                ref={videoEl}
                autoPlay
                muted
                playsInline
                onEnded={cycleVideo}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.92) saturate(1.05)",
                }}
              />
              <video
                ref={edge}
                muted
                playsInline
                autoPlay
                loop
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "url(#edge-detect)",
                  mixBlendMode: "screen",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          <div
            ref={brackets}
            style={{ position: "absolute", inset: -6, pointerEvents: "none" }}
          >
            {[
              { t: 0, l: 0 },
              { t: 0, r: 0 },
              { b: 0, l: 0 },
              { b: 0, r: 0 },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 90,
                  height: 90,
                  border: "2px solid rgba(255,255,255,0.95)",
                  borderRadius: 6,
                  ...p,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StageBlock({
  refEl,
  side,
  children,
}: {
  refEl: React.RefObject<HTMLDivElement | null>;
  side: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      ref={refEl}
      className="r-stage-block"
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [side]: "6%",
        maxWidth: 480,
        zIndex: 5,
        color: OFF_WHITE,
      }}
    >
      {children}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "clamp(36px, 4vw, 56px)",
        fontWeight: 500,
        color: OFF_WHITE,
        letterSpacing: "-1.8px",
        lineHeight: 1.06,
        margin: 0,
        marginBottom: 22,
      }}
    >
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 16,
        color: "rgba(255,255,255,0.55)",
        lineHeight: 1.6,
        margin: 0,
        marginBottom: 32,
      }}
    >
      {children}
    </p>
  );
}

function GreenButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        background: GREEN,
        border: "none",
        borderRadius: 8,
        padding: "13px 22px",
        color: OFF_WHITE,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        transition: "background 0.25s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = GREEN_BRIGHT)}
      onMouseLeave={(e) => (e.currentTarget.style.background = GREEN)}
    >
      {children}
    </button>
  );
}

function LogoStrip() {
  const logos: { src: string; alt: string; h: number; invert?: boolean }[] = [
    { src: "/images/waec.svg", alt: "WAEC", h: 36, invert: true },
    { src: "/images/neco.png", alt: "NECO", h: 36 },
    { src: "/images/jamb.png", alt: "JAMB", h: 36 },
  ];
  return (
    <div style={{ marginTop: 44 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 2,
          fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        Aligned with
      </div>
      <div
        style={{
          display: "flex",
          gap: 32,
          alignItems: "center",
          opacity: 0.75,
        }}
      >
        {logos.map((l) => (
          <img
            key={l.alt}
            src={l.src}
            alt={l.alt}
            style={{
              height: l.h,
              width: "auto",
              objectFit: "contain",
              filter: l.invert
                ? "brightness(0) invert(1) opacity(0.85)"
                : "none",
              transition: "opacity 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────

function TestimonialCard({ item }: { item: Testimonial }) {
  const fgDim =
    item.fg === "#0A0A0A" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)";

  return (
    <div
      style={{
        background: item.bg,
        color: item.fg,
        borderRadius: 22,
        padding: "32px 36px 28px",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 28,
        boxShadow:
          item.fg === "#0A0A0A"
            ? "0 28px 60px rgba(0,0,0,0.10), 0 12px 24px rgba(0,0,0,0.06)"
            : "0 32px 70px rgba(0,0,0,0.4), 0 12px 24px rgba(0,0,0,0.25)",
        border:
          item.fg === "#0A0A0A"
            ? "1px solid rgba(0,0,0,0.04)"
            : "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span
          aria-hidden
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 56,
            lineHeight: 0.6,
            color: item.fg,
            opacity: 0.32,
            fontWeight: 600,
          }}
        >
          “
        </span>
        <p
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(18px, 1.7vw, 24px)",
            fontWeight: 500,
            lineHeight: 1.32,
            letterSpacing: "-0.3px",
            margin: 0,
            color: item.fg,
          }}
        >
          {item.quote}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src={item.avatar}
          alt=""
          width={46}
          height={46}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border:
              item.fg === "#0A0A0A"
                ? "1px solid rgba(0,0,0,0.08)"
                : "1px solid rgba(255,255,255,0.15)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: item.fg,
              letterSpacing: "-0.1px",
            }}
          >
            {item.name}
          </span>
          <span
            style={{
              fontSize: 12.5,
              color: fgDim,
              letterSpacing: 0.1,
              lineHeight: 1.35,
            }}
          >
            {item.role}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── CAPABILITIES ──────────────────────────────────────────────────────────────

type CapKey = "study" | "practice" | "test" | "review" | "analyze" | "author";

const CAP_ICONS: Record<CapKey, React.ReactNode> = {
  study: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  practice: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  test: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  ),
  review: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  analyze: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="6" />
      <rect x="13" y="7" width="3" height="10" />
      <rect x="18" y="13" width="3" height="4" />
    </svg>
  ),
  author: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

function useIsMobile(max = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const update = () => setM(window.innerWidth <= max);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [max]);
  return m;
}

function Tip({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrap}
      style={{ position: "relative", display: "inline" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          borderBottom: "1px dotted currentColor",
          paddingBottom: 1,
          cursor: "help",
        }}
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(300px, 80vw)",
            padding: "18px 22px",
            background: "#16171C",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            boxShadow: "0 18px 38px rgba(0,0,0,0.5)",
            color: "#F2F2EF",
            zIndex: 50,
            fontFamily: "inherit",
            textAlign: "left",
            pointerEvents: "auto",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: 17,
              fontWeight: 600,
              marginBottom: 8,
              fontFamily: "'Source Serif 4', 'Iowan Old Style', Georgia, serif",
              letterSpacing: "-0.3px",
              lineHeight: 1.25,
              color: "#F2F2EF",
            }}
          >
            {title}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 14,
              lineHeight: 1.55,
              fontWeight: 400,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {body}
          </span>
        </span>
      )}
    </span>
  );
}

const CAPS: {
  key: CapKey;
  label: string;
  bg: string;
  heading: string;
  desc: React.ReactNode;
}[] = [
  {
    key: "study",
    label: "Study",
    bg: "#C5764C",
    heading: "Study",
    desc: (
      <>
        Custom study guides built from your{" "}
        <Tip
          title="Aligned to your curriculum"
          body="We detect topics, weighting, and exam-board alignment from your syllabus automatically."
        >
          syllabus
        </Tip>{" "}
        and{" "}
        <Tip
          title="A decade of WAEC / NECO"
          body="Indexed answer keys and marking schemes from 2015 onward, queryable by topic."
        >
          past papers
        </Tip>{" "}
        — summaries, formulas, and worked examples in one place.
      </>
    ),
  },
  {
    key: "practice",
    label: "Practice",
    bg: "#9FB29A",
    heading: "Practice",
    desc: (
      <>
        Drill any topic with{" "}
        <Tip
          title="Adapts to you"
          body="Questions get harder when you're nailing them and ease back when you stall — no boring grind, no over-reach."
        >
          adaptive difficulty
        </Tip>
        .{" "}
        <Tip
          title="Worked solutions"
          body="Every answer is followed by a one-screen explanation and a link to related drills on the same idea."
        >
          Instant feedback
        </Tip>{" "}
        on every answer, no waiting for marks.
      </>
    ),
  },
  {
    key: "test",
    label: "Test",
    bg: "#3A6F84",
    heading: "Test",
    desc: (
      <>
        Run real mock exams under WAEC/NECO/JAMB conditions — timed,{" "}
        <Tip
          title="Camera + tab-lock"
          body="Webcam monitoring, full-screen enforcement, and answer encryption end-to-end. Suitable for high-stakes mocks."
        >
          proctored
        </Tip>
        ,{" "}
        <Tip
          title="Instant results"
          body="MCQs are graded the second the student submits. Essays get queued for the teacher with a draft rubric attached."
        >
          scored automatically
        </Tip>
        .
      </>
    ),
  },
  {
    key: "review",
    label: "Review",
    bg: "#9A99B6",
    heading: "Review",
    desc: (
      <>
        Walk through every question you got wrong with a{" "}
        <Tip
          title="Step-by-step"
          body="Every solution is broken into reasoning steps with the relevant formula or rule pinned at the top."
        >
          worked solution
        </Tip>{" "}
        and a link to a{" "}
        <Tip
          title="Targeted drills"
          body="We pick the next 10 questions on the exact concept you missed — adaptive, not just topic-tagged."
        >
          related practice
        </Tip>{" "}
        set.
      </>
    ),
  },
  {
    key: "analyze",
    label: "Analyze",
    bg: "#B5708A",
    heading: "Analyze",
    desc: (
      <>
        Track your scores{" "}
        <Tip
          title="Trend analysis"
          body="Side-by-side breakdown of your last 8 mocks with delta per subject and per topic."
        >
          across mocks
        </Tip>{" "}
        and subjects. See exactly where you're improving and where you've{" "}
        <Tip
          title="Plateau detection"
          body="Flags subjects where 3+ consecutive mocks haven't moved more than 2 points so you know where to push."
        >
          plateaued
        </Tip>
        .
      </>
    ),
  },
  {
    key: "author",
    label: "Author",
    bg: "#C8D2B5",
    heading: "Author",
    desc: (
      <>
        For teachers — build question papers{" "}
        <Tip
          title="AI-assisted authoring"
          body="Type a brief like 'SS3 Biology, 30 questions, mixed difficulty' — full drafts arrive in 90 seconds."
        >
          from a prompt
        </Tip>
        , tag by topic and difficulty,{" "}
        <Tip
          title="Class-aware delivery"
          body="Pick your cohorts, set the window, and we handle scheduling, monitoring, and scoring end-to-end."
        >
          publish to your classes
        </Tip>{" "}
        in one click.
      </>
    ),
  },
];

function PromptCard({
  prompt,
  attachments,
  dark = true,
}: {
  prompt: string;
  attachments?: { name: string; meta: string; ext: string }[];
  dark?: boolean;
}) {
  const bg = dark ? "#0A0B0E" : "#FFFFFF";
  const fg = dark ? "#F2F2EF" : "#0A0A0A";
  const fgDim = dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        maxWidth: 380,
      }}
    >
      <div style={{ background: bg, borderRadius: 14, padding: "16px 18px" }}>
        <div
          style={{ fontSize: 12, fontWeight: 600, color: fg, marginBottom: 8 }}
        >
          Prompt
        </div>
        <div style={{ fontSize: 14, color: fgDim, lineHeight: 1.55 }}>
          {prompt}
        </div>
      </div>
      {attachments && attachments.length > 0 && (
        <div style={{ background: bg, borderRadius: 14, padding: "16px 18px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: fg,
              marginBottom: 12,
            }}
          >
            Attachments
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {attachments.map((a) => (
              <div
                key={a.name}
                style={{
                  background: dark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.04)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    color: fg,
                    fontWeight: 500,
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {a.name}
                </div>
                <div style={{ color: fgDim, marginBottom: 12 }}>{a.meta}</div>
                <div style={{ color: fgDim, fontSize: 11 }}>{a.ext}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudyMockup() {
  return (
    <div
      style={{
        background: "#FBFAF6",
        borderRadius: 16,
        padding: "36px 40px",
        color: "#0A0A0A",
        fontFamily:
          "'Source Serif 4', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
        maxWidth: 580,
      }}
    >
      <h3
        style={{
          fontSize: 30,
          fontWeight: 700,
          margin: 0,
          marginBottom: 4,
          lineHeight: 1.15,
        }}
      >
        Quadratic Equations
      </h3>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 600,
          margin: 0,
          marginBottom: 22,
          color: "rgba(0,0,0,0.7)",
        }}
      >
        SS3 Mathematics study guide
      </h3>
      <h4
        style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 12 }}
      >
        Table of contents
      </h4>
      <ul
        style={{
          margin: 0,
          paddingLeft: 22,
          fontSize: 15,
          color: "#1A1A1A",
          lineHeight: 1.7,
        }}
      >
        <li>Standard form and roots</li>
        <li>Completing the square</li>
        <li>The quadratic formula</li>
        <li>Discriminant & nature of roots</li>
        <li>Worked WAEC past questions</li>
      </ul>
      <h4
        style={{
          fontSize: 18,
          fontWeight: 700,
          margin: 0,
          marginTop: 24,
          marginBottom: 10,
        }}
      >
        Quadratic formula
      </h4>
      <p
        style={{ fontSize: 14.5, color: "#1A1A1A", lineHeight: 1.7, margin: 0 }}
      >
        <strong>For ax² + bx + c = 0:</strong> x = ( −b ± √(b² − 4ac) ) / 2a.
        Use the discriminant Δ = b² − 4ac to tell the nature of the roots.
      </p>
    </div>
  );
}

function PracticeMockup() {
  return (
    <div
      style={{
        background: "#0F1413",
        borderRadius: 16,
        padding: "26px 28px",
        color: "#F2F2EF",
        width: 460,
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 18,
          fontSize: 12,
          letterSpacing: 1.5,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.55)" }}>
          PRACTICE · MATHEMATICS
        </span>
        <span style={{ color: "rgba(255,255,255,0.55)" }}>7 / 20</span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 4,
          marginBottom: 22,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "35%",
            height: "100%",
            background: "#2E6F5A",
            borderRadius: 4,
          }}
        />
      </div>
      <div style={{ fontSize: 15.5, lineHeight: 1.55, marginBottom: 18 }}>
        Find the value of <em>x</em> in the equation{" "}
        <strong>2x² − 7x + 3 = 0</strong>.
      </div>
      {[
        { key: "A", text: "x = 1/2 or x = 3", correct: false },
        { key: "B", text: "x = −1/2 or x = −3", correct: false },
        { key: "C", text: "x = 1/2 or x = 3, selected", correct: true },
        { key: "D", text: "x = 2 or x = 3", correct: false },
      ].map((o, i) => {
        const selected = i === 2;
        return (
          <div
            key={o.key}
            style={{
              border: `1px solid ${selected ? "rgba(46,111,90,0.6)" : "rgba(255,255,255,0.08)"}`,
              background: selected
                ? "rgba(46,111,90,0.14)"
                : "rgba(255,255,255,0.02)",
              borderRadius: 10,
              padding: "11px 14px",
              marginBottom: 8,
              fontSize: 14,
              color: selected ? "#9FD9C0" : "rgba(255,255,255,0.78)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>
              {o.key}.
            </span>
            <span>{o.text.replace(", selected", "")}</span>
          </div>
        );
      })}
      <button
        style={{
          width: "100%",
          marginTop: 14,
          background: "linear-gradient(135deg,#2E6F5A,#1F4D3E)",
          border: "none",
          borderRadius: 10,
          padding: "12px",
          color: "#F2F2EF",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Submit answer
      </button>
    </div>
  );
}

function TestMockup() {
  return (
    <div
      style={{
        background: "#0B1118",
        borderRadius: 16,
        padding: "26px 30px",
        color: "#F2F2EF",
        width: 480,
        maxWidth: "100%",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 4,
            }}
          >
            WAEC MOCK · CHEMISTRY
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Question 14 / 50</div>
        </div>
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "8px 14px",
            color: "#FC8181",
            fontSize: 18,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          01:23:45
        </div>
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 14.5,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.55,
          marginBottom: 16,
        }}
      >
        Which of the following gases would be liberated when dilute sulphuric
        acid reacts with zinc metal?
      </div>
      {[
        "A.  Oxygen",
        "B.  Hydrogen",
        "C.  Sulphur dioxide",
        "D.  Carbon dioxide",
      ].map((opt) => (
        <div
          key={opt}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 8,
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {opt}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          style={{
            flex: 1,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "11px",
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
          }}
        >
          Previous
        </button>
        <button
          style={{
            flex: 1,
            background: "#F2F2EF",
            border: "none",
            borderRadius: 10,
            padding: "11px",
            color: "#0A0A0A",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function ReviewMockup() {
  return (
    <div
      style={{
        background: "#FBFAF6",
        borderRadius: 16,
        padding: "28px 32px",
        color: "#0A0A0A",
        width: 520,
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: 1.8,
          color: "rgba(0,0,0,0.5)",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        QUESTION 14 · CHEMISTRY MOCK
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.55,
          marginBottom: 18,
        }}
      >
        Which gas is liberated when dilute H₂SO₄ reacts with zinc metal?
      </div>
      <div
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 10,
          fontSize: 14,
          color: "#B91C1C",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "line-through",
        }}
      >
        <span style={{ fontWeight: 700 }}>Your answer ·</span> C. Sulphur
        dioxide
      </div>
      <div
        style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 18,
          fontSize: 14,
          color: "#15803D",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontWeight: 700 }}>Correct ·</span> B. Hydrogen
      </div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: 1.5,
          color: "rgba(0,0,0,0.5)",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        EXPLANATION
      </div>
      <p
        style={{
          fontSize: 14,
          color: "rgba(0,0,0,0.7)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Reactive metals above hydrogen in the activity series displace H from
        dilute non-oxidising acids. Zn + H₂SO₄ → ZnSO₄ + H₂↑. SO₂ would only
        appear with concentrated, hot H₂SO₄.
      </p>
      <div
        style={{
          marginTop: 18,
          fontSize: 13,
          color: "#2E6F5A",
          fontWeight: 600,
        }}
      >
        Related practice — Activity series of metals →
      </div>
    </div>
  );
}

function AnalyzeMockup() {
  const data = [
    { sub: "English", scores: [62, 68, 71, 74] },
    { sub: "Maths", scores: [55, 60, 68, 78] },
    { sub: "Physics", scores: [70, 72, 71, 73] },
    { sub: "Chemistry", scores: [66, 64, 60, 58] },
    { sub: "Biology", scores: [72, 75, 77, 80] },
  ];
  const max = 100;
  return (
    <div
      style={{
        background: "#FBFAF6",
        borderRadius: 16,
        padding: "28px 32px",
        color: "#0A0A0A",
        width: 560,
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 1.8,
              color: "rgba(0,0,0,0.5)",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            LAST 4 MOCKS · BY SUBJECT
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Performance trend</div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            fontSize: 11,
            color: "rgba(0,0,0,0.55)",
          }}
        >
          {["M1", "M2", "M3", "M4"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((row) => (
          <div
            key={row.sub}
            style={{ display: "flex", alignItems: "center", gap: 14 }}
          >
            <div style={{ width: 78, fontSize: 13, fontWeight: 500 }}>
              {row.sub}
            </div>
            <div style={{ flex: 1, display: "flex", gap: 4, height: 22 }}>
              {row.scores.map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: "#1F4D3E",
                    opacity: 0.35 + (i / 4) * 0.55,
                    borderRadius: 4,
                    height: `${(s / max) * 100}%`,
                    alignSelf: "flex-end",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                width: 36,
                fontSize: 13,
                fontVariantNumeric: "tabular-nums",
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              {row.scores[row.scores.length - 1]}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 22,
          padding: "12px 14px",
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 10,
          fontSize: 13,
          color: "#15803D",
          lineHeight: 1.5,
        }}
      >
        <strong>Pattern · </strong>Maths up 23 points across 4 mocks. Chemistry
        slipping — focus practice here.
      </div>
    </div>
  );
}

function AuthorMockup() {
  return (
    <div
      style={{
        background: "#0F1413",
        borderRadius: 16,
        padding: "20px 24px",
        color: "#E2E8E4",
        width: 580,
        maxWidth: "100%",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 13.5,
        lineHeight: 1.65,
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span
            key={c}
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: c,
              opacity: 0.55,
            }}
          />
        ))}
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)" }}>
        Reading syllabus<span style={{ opacity: 0.4 }}>...</span>
      </div>
      <div>* WAEC Biology · 2020-2025 coverage</div>
      <div>* 30 questions · mixed difficulty</div>
      <br />
      <div style={{ color: "rgba(255,255,255,0.55)" }}>Generating items...</div>
      <div style={{ color: "#9FD9C0" }}>
        ✓ Cell biology and organisation: 6 questions
      </div>
      <div style={{ color: "#9FD9C0" }}>
        ✓ Genetics &amp; heredity: 8 questions
      </div>
      <div style={{ color: "#9FD9C0" }}>✓ Ecology: 7 questions</div>
      <div style={{ color: "#9FD9C0" }}>✓ Evolution: 4 questions</div>
      <div style={{ color: "#9FD9C0" }}>
        ✓ Plant &amp; animal physiology: 5 questions
      </div>
      <br />
      <div style={{ color: "rgba(255,255,255,0.55)" }}>
        Tagging by topic and difficulty...
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)" }}>
        Building answer keys with explanations...
      </div>
      <br />
      <div>
        Paper ready ·{" "}
        <span style={{ color: "#9FD9C0" }}>biology-ss3-mock-04.pdf</span>
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)" }}>
        Publish to SS3 cohort? <span style={{ color: "#9FD9C0" }}>(y/N)</span>
      </div>
    </div>
  );
}

function CapContent({ k }: { k: CapKey }) {
  if (k === "study") {
    return (
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <PromptCard
          prompt="Build me a study guide for quadratic equations with worked examples and 5 WAEC-style practice problems."
          attachments={[
            { name: "WAEC Past Papers", meta: "12 mb", ext: "pdf" },
            { name: "Maths Syllabus", meta: "1.2 mb", ext: "pdf" },
          ]}
        />
        <StudyMockup />
      </div>
    );
  }
  if (k === "practice") {
    return (
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <PracticeMockup />
        <PromptCard prompt="Drill me on coordinate geometry. Mix easy and hard. 20 questions, no time limit." />
      </div>
    );
  }
  if (k === "test") {
    return (
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <TestMockup />
        <PromptCard prompt="Run a WAEC mock for Chemistry. 50 questions, 2 hours, proctored. No going back to previous questions." />
      </div>
    );
  }
  if (k === "review") {
    return (
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <PromptCard prompt="Walk me through every Chemistry question I got wrong last week, grouped by topic. Show worked solutions." />
        <ReviewMockup />
      </div>
    );
  }
  if (k === "analyze") {
    return (
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <AnalyzeMockup />
        <PromptCard
          prompt="Compare my last 4 mock results across subjects. Where am I improving fastest and where am I stalling?"
          attachments={[{ name: "Mock results", meta: "4 mocks", ext: "xlsx" }]}
        />
      </div>
    );
  }
  // author
  return (
    <div
      style={{
        display: "flex",
        gap: 40,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <AuthorMockup />
      <PromptCard prompt="> examly build me a 30-question Biology paper at WAEC standard, mixed difficulty, with answer key." />
    </div>
  );
}

function Capabilities() {
  const [active, setActive] = useState<CapKey>("study");
  const [overflowOpen, setOverflowOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const cap = CAPS.find((c) => c.key === active)!;
  const isMobile = useIsMobile();

  const activeIdx = CAPS.findIndex((c) => c.key === active);
  const visibleIdxs = isMobile
    ? activeIdx < 2
      ? [0, 1, 2]
      : [0, 1, activeIdx]
    : CAPS.map((_, i) => i);
  const hiddenIdxs = isMobile
    ? CAPS.map((_, i) => i).filter((i) => !visibleIdxs.includes(i))
    : [];

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0.0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
    );
  }, [active]);

  useEffect(() => {
    if (!overflowOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(e.target as Node)
      ) {
        setOverflowOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setOverflowOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [overflowOpen]);

  useEffect(() => {
    setOverflowOpen(false);
  }, [active]);

  return (
    <section
      style={{
        background: BLACK,
        padding: "72px 5% 100px",
        color: OFF_WHITE,
      }}
    >
      <div
        className="r-cap-pills"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 32,
          position: "relative",
        }}
      >
        <div
          ref={overflowRef}
          style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 999,
            padding: 5,
            gap: 2,
            position: "relative",
          }}
        >
          {visibleIdxs.map((i) => {
            const c = CAPS[i];
            const on = c.key === active;
            return (
              <button
                key={c.key}
                onClick={() => setActive(c.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px",
                  borderRadius: 999,
                  border: "none",
                  background: on ? "rgba(255,255,255,0.08)" : "transparent",
                  color: on ? OFF_WHITE : "rgba(255,255,255,0.5)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "color 0.2s, background 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!on) e.currentTarget.style.color = OFF_WHITE;
                }}
                onMouseLeave={(e) => {
                  if (!on)
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }}
              >
                <span style={{ display: "inline-flex" }}>
                  {CAP_ICONS[c.key]}
                </span>
                {c.label}
              </button>
            );
          })}

          {hiddenIdxs.length > 0 && (
            <button
              onClick={() => setOverflowOpen((v) => !v)}
              aria-label="More options"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "9px 14px",
                borderRadius: 999,
                border: "none",
                background: overflowOpen
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                color: overflowOpen ? OFF_WHITE : "rgba(255,255,255,0.5)",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 1,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.2s, background 0.2s",
              }}
            >
              <span style={{ lineHeight: 0.5, transform: "translateY(-3px)" }}>
                …
              </span>
            </button>
          )}

          {overflowOpen && hiddenIdxs.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "rgba(20,21,26,0.96)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: 6,
                boxShadow: "0 18px 38px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                zIndex: 30,
                minWidth: 180,
              }}
            >
              {hiddenIdxs.map((i) => {
                const c = CAPS[i];
                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      setActive(c.key);
                      setOverflowOpen(false);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 16px",
                      borderRadius: 12,
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.78)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{ display: "inline-flex" }}>
                      {CAP_ICONS[c.key]}
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        ref={cardRef}
        className="r-cap-card"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          background: cap.bg,
          borderRadius: 26,
          padding: "70px 60px",
          position: "relative",
          minHeight: 520,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: "background 0.5s ease",
        }}
      >
        <svg
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.18,
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M -50 ${80 + i * 110} Q 250 ${60 + i * 110 + (i % 2) * 40} 500 ${100 + i * 110} T 1050 ${90 + i * 110}`}
              fill="none"
              stroke="rgba(0,0,0,0.6)"
              strokeWidth="1.2"
            />
          ))}
        </svg>

        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          <CapContent k={active} />
        </div>
      </div>

      <div
        className="r-cap-meta"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          marginTop: 60,
          display: "grid",
          gridTemplateColumns: "minmax(220px, 280px) 1fr",
          gap: 80,
          alignItems: "start",
        }}
      >
        <h3
          style={{
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-1px",
            margin: 0,
            color: OFF_WHITE,
            fontFamily:
              "'Source Serif 4', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
          }}
        >
          {cap.heading}
        </h3>
        <p
          style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {cap.desc}
        </p>
      </div>
    </section>
  );
}

function TestimonialStack() {
  const [front, setFront] = useState(0);
  const N = TESTIMONIALS.length;

  const next = () => setFront((f) => (f + 1) % N);
  const prev = () => setFront((f) => (f - 1 + N) % N);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
      <div
        className="r-tstack"
        style={{
          position: "relative",
          width: "100%",
          height: 380,
        }}
      >
        {TESTIMONIALS.map((t, i) => {
          const rel = (i - front + N) % N;
          let translateX = 0;
          let translateY = 0;
          let rotate = 0;
          let scale = 1;
          let opacity = 1;
          let zIndex = 30;
          if (rel === 0) {
            translateX = 0;
            translateY = 0;
            rotate = -1.2;
            scale = 1;
            opacity = 1;
            zIndex = 40;
          } else if (rel === 1) {
            translateX = 32;
            translateY = -22;
            rotate = 3.2;
            scale = 0.97;
            opacity = 0.92;
            zIndex = 30;
          } else if (rel === 2) {
            translateX = 60;
            translateY = -42;
            rotate = 6.5;
            scale = 0.94;
            opacity = 0.78;
            zIndex = 20;
          } else {
            translateX = 84;
            translateY = -60;
            rotate = 9;
            scale = 0.9;
            opacity = 0;
            zIndex = 10;
          }
          const onClick = rel === 0 ? undefined : () => setFront(i);
          return (
            <div
              key={i}
              className="r-tcard"
              onClick={onClick}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "min(580px, calc(100% - 80px))",
                transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotate}deg) scale(${scale})`,
                opacity,
                zIndex,
                transition:
                  "transform 0.7s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.5s ease",
                cursor: rel === 0 ? "default" : "pointer",
                willChange: "transform, opacity",
              }}
            >
              <TestimonialCard item={t} />
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          marginTop: 56,
        }}
      >
        <ArrowBtn dir="prev" onClick={prev} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            color: "rgba(0,0,0,0.55)",
            letterSpacing: 1.5,
            minWidth: 80,
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#0A0A0A", fontWeight: 600 }}>
            {String(front + 1).padStart(2, "0")}
          </span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>{String(N).padStart(2, "0")}</span>
        </div>
        <ArrowBtn dir="next" onClick={next} />
      </div>
    </div>
  );
}

function ArrowBtn({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous testimonial" : "Next testimonial"}
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "1px solid rgba(0,0,0,0.16)",
        background: "transparent",
        color: "#0A0A0A",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.2s, border-color 0.2s, transform 0.2s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(0,0,0,0.05)";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.16)";
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: dir === "next" ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        <path d="M15 18 L9 12 L15 6" />
      </svg>
    </button>
  );
}

function Latest() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.querySelector(".lh"),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 88%" },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        background: LIGHT_BG,
        padding: "80px 5% 90px",
        color: "#0A0A0A",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div
          className="lh"
          style={{
            textAlign: "center",
            marginBottom: 56,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2.4,
              fontWeight: 700,
              color: "rgba(0,0,0,0.55)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            ◢ Testimonials
          </div>
          <h2
            style={{
              fontSize: "clamp(34px, 4vw, 56px)",
              fontWeight: 600,
              letterSpacing: "-2px",
              margin: 0,
              color: "#0A0A0A",
            }}
          >
            What schools say about Examly.
          </h2>
        </div>

        <TestimonialStack />
      </div>
    </section>
  );
}

// ── KEYCAP + GRADE BURST ──────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function ensureAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor =
        (
          window as {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
          }
        ).AudioContext ||
        (
          window as {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function playPop(pitch: number) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const dur = 0.055 + Math.random() * 0.025;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch, t);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + dur);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.16, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.005);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

const WAEC_GRADES: { label: string; color: string; pitch: number }[] = [
  { label: "A1", color: "#10B981", pitch: 1380 },
  { label: "B2", color: "#22C55E", pitch: 1240 },
  { label: "B3", color: "#65A30D", pitch: 1100 },
  { label: "C4", color: "#CA8A04", pitch: 960 },
  { label: "C5", color: "#D97706", pitch: 860 },
  { label: "C6", color: "#EA580C", pitch: 760 },
  { label: "D7", color: "#DC2626", pitch: 660 },
  { label: "E8", color: "#B91C1C", pitch: 580 },
  { label: "F9", color: "#7F1D1D", pitch: 500 },
];

function GradeParticle({
  grade,
  color,
  pitch,
  seed,
  delay,
}: {
  grade: string;
  color: string;
  pitch: number;
  seed: number;
  delay: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const r = (n: number) => {
      const x = Math.sin(seed * 9301 + n * 49297) * 233280;
      return x - Math.floor(x);
    };

    const angle = (r(1) - 0.5) * Math.PI;
    const speed = 280 + r(2) * 320;
    const vx = Math.sin(angle) * speed;
    const vy0 = -Math.cos(angle) * speed * (0.7 + r(3) * 0.6);
    const g = 1100;
    const duration = 1.6 + r(4) * 0.7;
    const spin = (r(5) - 0.5) * 720;

    gsap.set(el, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      scale: 0.2,
      opacity: 0,
      rotation: 0,
    });

    const popCall = gsap.delayedCall(delay, () => playPop(pitch));
    const appear = gsap.to(el, {
      scale: 1,
      opacity: 1,
      duration: 0.18,
      ease: "back.out(2.5)",
      delay,
    });

    const obj = { t: 0 };
    const motion = gsap.to(obj, {
      t: duration,
      duration,
      ease: "none",
      delay,
      onUpdate: () => {
        const t = obj.t;
        gsap.set(el, {
          x: vx * t,
          y: vy0 * t + 0.5 * g * t * t,
          rotation: spin * (t / duration),
        });
      },
    });
    const fade = gsap.to(el, {
      opacity: 0,
      duration: 0.5,
      delay: delay + duration - 0.5,
      ease: "power2.in",
    });

    return () => {
      popCall.kill();
      appear.kill();
      motion.kill();
      fade.kill();
    };
  }, [seed, delay, pitch]);

  return (
    <span
      ref={ref}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        fontWeight: 800,
        fontSize: 22,
        color,
        pointerEvents: "none",
        willChange: "transform, opacity",
        fontFamily: "inherit",
        letterSpacing: "-0.5px",
        textShadow: "0 2px 10px rgba(0,0,0,0.18)",
        zIndex: 10,
      }}
    >
      {grade}
    </span>
  );
}

function Keycap({
  symbol,
  rotate,
  pos,
  delay,
  burst = false,
  onActivate,
}: {
  symbol: React.ReactNode;
  rotate: string;
  pos: React.CSSProperties;
  delay: number;
  burst?: boolean;
  onActivate: () => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  const [particles, setParticles] = useState<
    {
      id: number;
      grade: string;
      color: string;
      pitch: number;
      seed: number;
      delay: number;
    }[]
  >([]);
  const nextId = useRef(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(btn.current, {
        y: "+=14",
        duration: 3 + delay,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay,
      });
    });
    return () => ctx.revert();
  }, [delay]);

  const press = () => {
    gsap.to(btn.current, {
      scale: 0.88,
      duration: 0.1,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(btn.current, {
          scale: 1,
          duration: 0.55,
          ease: "elastic.out(1, 0.45)",
        });
      },
    });

    if (burst) {
      gsap
        .timeline()
        .to(btn.current, { x: -5, duration: 0.035, ease: "none" })
        .to(btn.current, { x: 5, duration: 0.04, ease: "none" })
        .to(btn.current, { x: -4, duration: 0.04, ease: "none" })
        .to(btn.current, { x: 3, duration: 0.04, ease: "none" })
        .to(btn.current, { x: -2, duration: 0.04, ease: "none" })
        .to(btn.current, { x: 0, duration: 0.08, ease: "power2.out" });

      ensureAudioCtx();

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(22);
      }

      const COUNT = 14;
      const created = Array.from({ length: COUNT }, (_, i) => {
        const g = WAEC_GRADES[Math.floor(Math.random() * WAEC_GRADES.length)];
        return {
          id: nextId.current++,
          grade: g.label,
          color: g.color,
          pitch: g.pitch,
          seed: Math.floor(Math.random() * 1e6),
          delay: Math.pow(i / COUNT, 0.85) * 1.0 + Math.random() * 0.05,
        };
      });
      setParticles((prev) => [...prev, ...created]);
      window.setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !created.find((c) => c.id === p.id)),
        );
      }, 4500);
    }

    onActivate();
  };

  const baseShadow = [
    "0 28px 50px rgba(20,30,55,0.16)",
    "0 10px 22px rgba(20,30,55,0.12)",
    "inset 0 2px 0 rgba(255,255,255,1)",
    "inset 0 -3px 0 rgba(0,0,0,0.05)",
    "inset -2px 0 0 rgba(0,0,0,0.03)",
    "0 0 50px rgba(99,140,180,0.15)",
  ].join(", ");
  const hoverShadow = [
    "0 40px 70px rgba(20,30,55,0.22)",
    "0 14px 30px rgba(20,30,55,0.15)",
    "inset 0 2px 0 rgba(255,255,255,1)",
    "inset 0 -3px 0 rgba(0,0,0,0.05)",
    "inset -2px 0 0 rgba(0,0,0,0.03)",
    "0 0 90px rgba(46,111,90,0.25)",
  ].join(", ");

  return (
    <div
      style={{
        position: "absolute",
        width: 140,
        height: 140,
        perspective: 900,
        ...pos,
      }}
    >
      {particles.map((p) => (
        <GradeParticle
          key={p.id}
          grade={p.grade}
          color={p.color}
          pitch={p.pitch}
          seed={p.seed}
          delay={p.delay}
        />
      ))}
      <button
        ref={btn}
        onClick={press}
        aria-label={burst ? "Drop the grades" : "Back to top"}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 30,
          background:
            "linear-gradient(155deg, #FFFFFF 0%, #F2F2F4 55%, #E2E2E6 100%)",
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow: baseShadow,
          transform: `${rotate} translateZ(0)`,
          transformStyle: "preserve-3d",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
          color: "#1F2A3A",
          fontWeight: 300,
          fontFamily: "inherit",
          padding: 0,
          willChange: "transform",
          transition: "box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = hoverShadow)}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = baseShadow)}
      >
        {symbol}
      </button>
    </div>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────

function Footer() {
  const linkCols = [
    {
      h: "Resources",
      links: [
        { label: "Mobile", badge: "New" },
        { label: "Manifesto" },
        { label: "Press" },
        { label: "Bug Bounty" },
      ],
    },
    {
      h: "Support",
      links: [{ label: "Help Center" }, { label: "Contact Us" }],
    },
    {
      h: "Legal",
      links: [
        { label: "Privacy Policy" },
        { label: "Terms of Service" },
        { label: "Subprocessors" },
      ],
    },
  ];

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const BG = "#E7E8EE";
  const FG = "#0A0A0A";
  const FG_MUTED = "rgba(0,0,0,0.55)";
  const FG_DIM = "rgba(0,0,0,0.4)";
  const DIVIDER = "rgba(0,0,0,0.08)";

  return (
    <footer
      style={{
        background: BG,
        padding: "80px 5% 40px",
        color: FG,
        borderTop: `1px solid ${DIVIDER}`,
        overflow: "hidden",
      }}
    >
      <div
        className="r-footer-cta"
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 60,
          alignItems: "center",
          paddingBottom: 100,
          position: "relative",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "clamp(28px, 3vw, 44px)",
              fontWeight: 600,
              color: FG,
              letterSpacing: "-1.2px",
              lineHeight: 1.15,
              margin: 0,
              marginBottom: 14,
            }}
          >
            Exam software that runs when the bell rings, not after.
          </h2>
          <p
            style={{
              fontSize: "clamp(20px, 2vw, 32px)",
              color: FG_MUTED,
              margin: 0,
              marginBottom: 36,
              fontWeight: 600,
              letterSpacing: "-0.6px",
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: FG }}>Try Examly</span> on your next mock
            today.
          </p>
          <button
            onClick={scrollTop}
            style={{
              background: `linear-gradient(135deg, ${GREEN_BRIGHT}, ${GREEN})`,
              border: "none",
              borderRadius: 14,
              padding: "14px 30px",
              color: OFF_WHITE,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              boxShadow: `0 10px 30px ${GREEN}55`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 14px 40px ${GREEN}77`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 10px 30px ${GREEN}55`;
            }}
          >
            <span style={{ fontSize: 18 }}>✦</span> Book a Demo
          </button>
        </div>

        <div
          className="r-keycaps-wrap"
          style={{ position: "relative", height: 360 }}
        >
          <Keycap
            symbol="⌘"
            rotate="rotate(-14deg) rotateX(18deg) rotateY(-22deg)"
            pos={{ left: "18%", top: "42%" }}
            delay={0}
            onActivate={scrollTop}
          />
          <Keycap
            symbol={
              <span
                style={{
                  fontSize: 44,
                  lineHeight: 1,
                  transform: "translateY(-4px)",
                }}
              >
                ↵
              </span>
            }
            rotate="rotate(16deg) rotateX(-12deg) rotateY(18deg)"
            pos={{ right: "10%", top: "8%" }}
            delay={0.6}
            burst
            onActivate={() => {}}
          />
        </div>
      </div>

      <div
        className="r-footer-grid"
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          paddingTop: 60,
          borderTop: `1px solid ${DIVIDER}`,
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
          gap: 60,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 0,
                height: 0,
                borderTop: `13px solid ${FG}`,
                borderLeft: "13px solid transparent",
              }}
            />
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: FG,
                letterSpacing: "-0.5px",
              }}
            >
              examly
            </span>
          </div>
          <p
            style={{
              fontSize: 14,
              color: FG_MUTED,
              lineHeight: 1.7,
              maxWidth: 320,
              margin: 0,
              marginBottom: 28,
            }}
          >
            The CBT platform built for the way African schools actually examine
            — offline-first, district-scale, and exam-day-proof.
          </p>
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                color: FG,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#1F9F76",
                  boxShadow: "0 0 8px #1F9F76",
                }}
              />
              All systems operational
            </span>
          </div>

          <div style={{ marginTop: 44 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "1.2px",
                marginTop: "80px",
                color: FG_DIM,
              }}
            >
              BY SXAINT
            </div>
            <div
              style={{
                fontSize: 12,
                color: FG_DIM,
                marginTop: 6,
                letterSpacing: "0.5px",
              }}
            >
              © 2026 SXAINT TECHNOLOGIES
            </div>
          </div>
        </div>

        {linkCols.map((c) => (
          <div key={c.h}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: FG,
                marginBottom: 22,
              }}
            >
              {c.h}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {c.links.map((l) => (
                <li key={l.label} style={{ marginBottom: 14 }}>
                  <a
                    href="#"
                    style={{
                      fontSize: 15,
                      color: FG,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = FG_MUTED)
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.color = FG)}
                  >
                    {l.label}
                    {l.badge && (
                      <span
                        style={{
                          background: "#3B82F6",
                          color: OFF_WHITE,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          letterSpacing: 0.5,
                        }}
                      >
                        {l.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="r-footer-bottom"
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          marginTop: 30,
          paddingTop: 28,
          borderTop: `1px solid ${DIVIDER}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 22 }}>
          {[
            "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Z",
            "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
            "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
            "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
          ].map((path, i) => (
            <a
              key={i}
              href="#"
              style={{
                width: 22,
                height: 22,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: FG_DIM,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = FG)}
              onMouseLeave={(e) => (e.currentTarget.style.color = FG_DIM)}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d={path} />
              </svg>
            </a>
          ))}
        </div>

        <LanguageSwitcher />
      </div>
    </footer>
  );
}

// ── LANGUAGE SWITCHER ─────────────────────────────────────────────────────────

const LANGS: { code: "en" | "fr"; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

function LanguageSwitcher() {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "1px solid rgba(0,0,0,0.18)",
          borderRadius: 999,
          padding: "8px 14px",
          color: "#0A0A0A",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          transition: "background 0.2s, border-color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {current.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <path d="M2 4 L5 7 L8 4" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 12,
            padding: 6,
            minWidth: 160,
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            zIndex: 10,
          }}
        >
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 12px",
                  background: active ? "rgba(0,0,0,0.05)" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  color: "#0A0A0A",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = active
                    ? "rgba(0,0,0,0.05)"
                    : "transparent")
                }
              >
                {l.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MUSIC TOGGLE ──────────────────────────────────────────────────────────────

const MUSIC_TRACKS = [
  "/music/sound1.mp3",
  "/music/sound2.mp3",
  "/music/sound3.mp3",
  "/music/sound4.mp3",
];

function MusicToggle() {
  const audio = useRef<HTMLAudioElement>(null);
  const path = useRef<SVGPathElement>(null);
  const amp = useRef({ v: 0 });
  const phase = useRef({ v: 0 });
  const rafId = useRef<number | null>(null);
  const trackIdx = useRef(-1);
  const [playing, setPlaying] = useState(false);
  const [trackLabel, setTrackLabel] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const labelFor = (i: number) => {
    const file = MUSIC_TRACKS[i] || "";
    const base = file.split("/").pop() || file;
    return base.replace(/\.[^.]+$/, "");
  };

  useEffect(() => {
    if (!audio.current) return;
    trackIdx.current = Math.floor(Math.random() * MUSIC_TRACKS.length);
    audio.current.src = MUSIC_TRACKS[trackIdx.current];
    audio.current.volume = 0.18;
    setTrackLabel(labelFor(trackIdx.current));
  }, []);

  const switchTrack = (next: number) => {
    const el = audio.current;
    if (!el) return;
    trackIdx.current = next;
    setTrackLabel(labelFor(next));
    gsap.killTweensOf(el, "volume");
    const load = () => {
      el.src = MUSIC_TRACKS[next];
      if (playing) {
        el.volume = 0;
        el.play()
          .then(() =>
            gsap.to(el, { volume: 0.18, duration: 0.5, ease: "power2.out" }),
          )
          .catch(() => {});
      } else {
        el.volume = 0.18;
      }
    };
    if (playing && !el.paused) {
      gsap.to(el, {
        volume: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: load,
      });
    } else {
      load();
    }
  };

  const nextTrack = () => {
    if (MUSIC_TRACKS.length === 0) return;
    let n = trackIdx.current;
    if (MUSIC_TRACKS.length > 1) {
      n = (trackIdx.current + 1) % MUSIC_TRACKS.length;
    }
    switchTrack(n);
  };

  const prevTrack = () => {
    if (MUSIC_TRACKS.length === 0) return;
    let n = trackIdx.current;
    if (MUSIC_TRACKS.length > 1) {
      n = (trackIdx.current - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    }
    switchTrack(n);
  };

  const onEnded = () => {
    if (!audio.current || MUSIC_TRACKS.length === 0) return;
    const next = (trackIdx.current + 1) % MUSIC_TRACKS.length;
    trackIdx.current = next;
    setTrackLabel(labelFor(next));
    audio.current.src = MUSIC_TRACKS[next];
    audio.current.volume = 0.18;
    if (playing) audio.current.play().catch(() => {});
  };

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    const onScroll = () => setMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [menu]);

  useEffect(() => {
    const W = 22;
    const H = 14;
    const POINTS = 26;
    const render = () => {
      const a = amp.current.v;
      const p = phase.current.v;
      let d = `M 0 ${(H / 2).toFixed(2)}`;
      for (let i = 1; i <= POINTS; i++) {
        const t = i / POINTS;
        const x = t * W;
        const y = H / 2 + Math.sin(t * Math.PI * 2 + p) * a;
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      path.current?.setAttribute("d", d);
      rafId.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    const tween = gsap.to(phase.current, {
      v: "+=6.28318",
      duration: 1.4,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    gsap.to(amp.current, {
      v: playing ? 4.5 : 0,
      duration: 0.8,
      ease: "power2.out",
    });
  }, [playing]);

  const TARGET_VOL = 0.18;
  const FADE = 0.8;

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    gsap.killTweensOf(el, "volume");

    if (playing) {
      gsap.to(el, {
        volume: 0,
        duration: FADE,
        ease: "power2.in",
        onComplete: () => {
          el.pause();
        },
      });
      setPlaying(false);
    } else {
      el.volume = 0;
      el.play()
        .then(() => {
          gsap.to(el, {
            volume: TARGET_VOL,
            duration: FADE,
            ease: "power2.out",
          });
          setPlaying(true);
        })
        .catch(() => {});
    }
  };

  const openMenuAt = (clientX: number, clientY: number) => {
    const MENU_W = 200;
    const MENU_H = 188;
    const PAD = 8;
    const x = Math.min(clientX, window.innerWidth - MENU_W - PAD);
    const y = Math.min(clientY, window.innerHeight - MENU_H - PAD);
    setMenu({ x: Math.max(PAD, x), y: Math.max(PAD, y) });
  };

  return (
    <>
      <audio ref={audio} onEnded={onEnded} preload="auto" />
      <button
        className="r-music"
        onClick={toggle}
        onContextMenu={(e) => {
          e.preventDefault();
          openMenuAt(e.clientX, e.clientY);
        }}
        aria-label={playing ? "Pause music" : "Play music"}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(232,234,240,0.92)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: 0,
          backdropFilter: "blur(10px)",
          transition: "transform 0.2s ease, background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.06)";
          e.currentTarget.style.background = "rgba(244,245,250,0.98)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.background = "rgba(232,234,240,0.92)";
        }}
      >
        <svg width="26" height="14" viewBox="0 0 22 14" overflow="visible">
          <path
            ref={path}
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {menu && (
        <div
          ref={menuRef}
          role="menu"
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: "fixed",
            left: menu.x,
            top: menu.y,
            width: 200,
            background: "rgba(20,21,25,0.96)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            boxShadow:
              "0 20px 48px rgba(0,0,0,0.45), 0 6px 16px rgba(0,0,0,0.3)",
            backdropFilter: "blur(14px)",
            padding: 6,
            zIndex: 1200,
            color: "#F2F2EF",
            fontFamily: "inherit",
            fontSize: 13,
            userSelect: "none",
          }}
        >
          <div
            style={{
              padding: "8px 12px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Now playing
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#F2F2EF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {trackLabel || "—"}
            </div>
          </div>
          <MenuItem
            label={playing ? "Pause" : "Play"}
            icon={playing ? <PauseIcon /> : <PlayIcon />}
            onClick={() => {
              toggle();
              setMenu(null);
            }}
          />
          <MenuItem
            label="Next track"
            icon={<NextIcon />}
            onClick={() => {
              nextTrack();
              setMenu(null);
            }}
          />
          <MenuItem
            label="Previous track"
            icon={<PrevIcon />}
            onClick={() => {
              prevTrack();
              setMenu(null);
            }}
          />
        </div>
      )}
    </>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "9px 12px",
        background: hover ? "rgba(255,255,255,0.08)" : "transparent",
        border: "none",
        borderRadius: 8,
        color: "#F2F2EF",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.12s ease",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5l10 7-10 7V5z" />
      <rect x="17" y="5" width="2" height="14" rx="0.5" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 5L8 12l10 7V5z" />
      <rect x="5" y="5" width="2" height="14" rx="0.5" />
    </svg>
  );
}

// ── COOKIE BANNER ─────────────────────────────────────────────────────────────

type CookiePrefs = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_KEY = "examly.cookie.prefs.v1";

function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({
    essential: true,
    analytics: true,
    marketing: false,
  });
  const card = useRef<HTMLDivElement>(null);
  const modal = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem(COOKIE_KEY))
      return;
    const t = window.setTimeout(() => setVisible(true), 5200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible || !card.current) return;
    gsap.fromTo(
      card.current,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
    );
  }, [visible]);

  useEffect(() => {
    if (!settingsOpen) return;
    if (modal.current) {
      gsap.fromTo(
        modal.current,
        { y: 30, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" },
      );
    }
    if (scrim.current) {
      gsap.fromTo(
        scrim.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 },
      );
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  const persist = (p: CookiePrefs) => {
    try {
      localStorage.setItem(
        COOKIE_KEY,
        JSON.stringify({ ...p, at: Date.now() }),
      );
    } catch {
      // ignore
    }
  };

  const hideCard = () => {
    if (!card.current) {
      setVisible(false);
      return;
    }
    gsap.to(card.current, {
      y: 60,
      opacity: 0,
      duration: 0.45,
      ease: "power2.in",
      onComplete: () => setVisible(false),
    });
  };

  const acceptAll = () => {
    const p: CookiePrefs = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPrefs(p);
    persist(p);
    setSettingsOpen(false);
    hideCard();
  };
  const rejectAll = () => {
    const p: CookiePrefs = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPrefs(p);
    persist(p);
    setSettingsOpen(false);
    hideCard();
  };
  const savePrefs = () => {
    persist(prefs);
    setSettingsOpen(false);
    hideCard();
  };

  if (!visible) return null;

  return (
    <>
      <div
        ref={card}
        role="dialog"
        aria-label="Cookie preferences"
        className="r-cookie"
        style={{
          position: "fixed",
          left: 28,
          bottom: 28,
          width: "min(420px, calc(100vw - 56px))",
          background: "rgba(14,16,20,0.86)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          padding: 22,
          color: "#F2F2EF",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.35)",
          zIndex: 1200,
          fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <CookieIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#F2F2EF",
                marginBottom: 6,
                letterSpacing: "-0.2px",
              }}
            >
              Cookies, briefly
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: "rgba(255,255,255,0.62)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              We use cookies to keep Examly running, improve it, and remember
              your preferences. You're in control of what gets stored.
            </p>
          </div>
          <button
            onClick={rejectAll}
            aria-label="Reject all and dismiss"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              width: 24,
              height: 24,
              padding: 0,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F2F2EF")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
            }
          >
            ×
          </button>
        </div>

        <div
          className="r-cookie-actions"
          style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}
        >
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              flex: "0 0 auto",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 10,
              padding: "10px 16px",
              color: "rgba(255,255,255,0.85)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Customize
          </button>
          <button
            onClick={rejectAll}
            style={{
              flex: "1 1 auto",
              minWidth: 100,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 10,
              padding: "10px 16px",
              color: "rgba(255,255,255,0.85)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Reject non-essential
          </button>
          <button
            onClick={acceptAll}
            style={{
              flex: "1 1 auto",
              minWidth: 100,
              background: `linear-gradient(135deg, ${GREEN_BRIGHT}, ${GREEN})`,
              border: "none",
              borderRadius: 10,
              padding: "10px 16px",
              color: "#F2F2EF",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 6px 20px ${GREEN}55`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 10px 26px ${GREEN}77`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 6px 20px ${GREEN}55`;
            }}
          >
            Accept all
          </button>
        </div>
      </div>

      {settingsOpen && (
        <>
          <div
            ref={scrim}
            onClick={() => setSettingsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
              zIndex: 1300,
            }}
          />
          <div
            ref={modal}
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(520px, calc(100vw - 40px))",
              maxHeight: "calc(100vh - 60px)",
              overflowY: "auto",
              background: "#FBFBF9",
              borderRadius: 20,
              boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
              zIndex: 1301,
              color: "#0A0A0A",
              fontFamily: "inherit",
            }}
          >
            <div
              style={{
                padding: "28px 28px 8px",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: "-0.6px",
                    margin: 0,
                    marginBottom: 6,
                  }}
                >
                  Cookie preferences
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(0,0,0,0.55)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Decide what Examly is allowed to remember about you. You can
                  change this anytime from the footer.
                </p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  color: "rgba(0,0,0,0.45)",
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "16px 28px" }}>
              <PrefRow
                title="Essential"
                desc="Required for the site to function — login, security, basic preferences. Always on."
                on={true}
                disabled
                onChange={() => {}}
              />
              <PrefRow
                title="Analytics"
                desc="Helps us understand what's working so we can improve it. Aggregated, never sold."
                on={prefs.analytics}
                onChange={(v) => setPrefs({ ...prefs, analytics: v })}
              />
              <PrefRow
                title="Marketing"
                desc="Lets us show relevant content to schools that might find Examly useful."
                on={prefs.marketing}
                onChange={(v) => setPrefs({ ...prefs, marketing: v })}
              />
            </div>

            <div
              style={{
                padding: "16px 28px 24px",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={rejectAll}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "#0A0A0A",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Reject non-essential
              </button>
              <button
                onClick={savePrefs}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "#0A0A0A",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Save selection
              </button>
              <button
                onClick={acceptAll}
                style={{
                  background: `linear-gradient(135deg, ${GREEN_BRIGHT}, ${GREEN})`,
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "#F2F2EF",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: `0 6px 20px ${GREEN}55`,
                }}
              >
                Accept all
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function CookieIcon() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#E2C893">
        <path d="M21.5 10.7a4 4 0 0 1-4.2-4.2A4 4 0 0 1 13.5 2.5a10 10 0 1 0 8 8.2zM8 13.5a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm2.5-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4.7 8.7a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2z" />
      </svg>
    </div>
  );
}

function PrefRow({
  title,
  desc,
  on,
  onChange,
  disabled,
}: {
  title: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "14px 0",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {title}
          {disabled && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: "rgba(0,0,0,0.05)",
                color: "rgba(0,0,0,0.55)",
                padding: "2px 8px",
                borderRadius: 999,
                marginLeft: 8,
                letterSpacing: 0.5,
              }}
            >
              ALWAYS ON
            </span>
          )}
        </div>
        <div
          style={{ fontSize: 13.5, color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}
        >
          {desc}
        </div>
      </div>
      <ToggleSwitch on={on} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function ToggleSwitch({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      aria-pressed={on}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "none",
        background: on ? GREEN_BRIGHT : "rgba(0,0,0,0.18)",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.2s",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
          transition: "left 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </button>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function Home() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      body { margin: 0; background: ${BLACK}; }
      ::selection { background: ${GREEN_BRIGHT}; color: ${OFF_WHITE}; }

      h1, h2, h3, h4, h5, h6 {
        font-family: 'Source Serif 4', 'Iowan Old Style', Georgia, 'Times New Roman', serif;
        font-feature-settings: "ss01" on, "kern" on;
      }

      html { scrollbar-width: thin; scrollbar-color: #1A1A1A transparent; }
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: #141414;
        border-radius: 999px;
        border: 3px solid transparent;
        background-clip: padding-box;
      }
      ::-webkit-scrollbar-thumb:hover { background: #0A0A0A; background-clip: padding-box; }

      .mp-link .mp-arrow {
        display: inline-block;
        font-size: 16px;
        font-weight: 400;
        opacity: 0;
        transform: translateX(-6px);
        transition: opacity 0.22s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .mp-link:hover .mp-arrow {
        opacity: 1;
        transform: translateX(6px);
      }

      .r-show-mobile { display: none; }
      *, *::before, *::after { box-sizing: border-box; }

      @media (max-width: 1280px) {
        .r-nav { padding: 20px 32px !important; }
      }

      @media (max-width: 1024px) {
        .r-nav { padding: 18px 24px !important; }
        .r-nav-cluster { gap: 32px !important; }
        .r-stage-block { max-width: 340px !important; }
        .r-stage-block h2 { font-size: clamp(28px, 3.8vw, 44px) !important; margin-bottom: 16px !important; }
        .r-stage-block p { font-size: 15px !important; margin-bottom: 24px !important; }
        .r-green-block { padding: 44px 50px !important; width: 64% !important; }
        .r-green-block h2 { font-size: clamp(30px, 4.4vw, 52px) !important; }
        .r-cap-card { padding: 50px 40px !important; min-height: 460px !important; }
        .r-cap-meta { grid-template-columns: 220px 1fr !important; gap: 50px !important; margin-top: 44px !important; }
        .r-cap-meta h3 { font-size: 30px !important; }
        .r-cap-meta p { font-size: 16px !important; }
        .r-footer-grid { grid-template-columns: 1.4fr 1fr 1fr !important; gap: 40px !important; }
      }

      @media (max-width: 900px) {
        .r-hero-text {
          left: 6% !important;
          right: 6% !important;
          bottom: auto !important;
          top: 46% !important;
          max-width: 100% !important;
          color: #0A0A0A !important;
        }
        .r-hero-text h1 { color: #0A0A0A !important; font-size: clamp(30px, 5.4vw, 48px) !important; }
        .r-hero-text .r-hero-eyebrow { color: rgba(0,0,0,0.55) !important; }
        .r-hero-text .r-hero-eyebrow-tri { border-top-color: ${GREEN} !important; }
        .r-hero-text .r-hero-cta {
          background: #0A0A0A !important;
          color: ${OFF_WHITE} !important;
        }
        .r-stage-block {
          top: 58% !important;
          bottom: auto !important;
          left: 6% !important;
          right: 6% !important;
          max-width: 100% !important;
          transform: none !important;
        }
        .r-stage-block h2 { font-size: clamp(26px, 5vw, 40px) !important; line-height: 1.1 !important; margin-bottom: 14px !important; }
        .r-stage-block p { font-size: 15px !important; line-height: 1.55 !important; margin-bottom: 22px !important; }
        .r-cap-meta { grid-template-columns: 1fr !important; gap: 28px !important; }
        .r-cap-meta h3 { font-size: 28px !important; }
        .r-latest-grid { grid-template-columns: 1fr 1fr !important; gap: 18px !important; }
        .r-latest-grid > div { grid-column: span 1 !important; }
      }

      @media (max-width: 768px) {
        .r-hide-mobile { display: none !important; }
        .r-show-mobile { display: inline-flex !important; }
        .r-nav { padding: 14px 18px !important; }
        .r-nav-cluster { gap: 0 !important; }
        .r-stage-block h2 { font-size: clamp(22px, 6.2vw, 32px) !important; }
        .r-stage-block p { font-size: 14px !important; }
        .r-hero-text {
          left: 6% !important;
          right: 6% !important;
          bottom: auto !important;
          top: 44% !important;
          max-width: 100% !important;
          color: #0A0A0A !important;
        }
        .r-hero-text h1 { font-size: clamp(26px, 7vw, 40px) !important; color: #0A0A0A !important; }
        .r-hero-text .r-hero-eyebrow { color: rgba(0,0,0,0.55) !important; }
        .r-hero-text .r-hero-eyebrow-tri { border-top-color: ${GREEN} !important; }
        .r-hero-text .r-hero-cta {
          background: #0A0A0A !important;
          color: ${OFF_WHITE} !important;
        }
        .r-green-block { right: 4% !important; left: 4% !important; width: auto !important; padding: 30px 22px !important; }
        .r-green-block h2 { font-size: clamp(24px, 6.5vw, 36px) !important; }
        .r-reliable-text { left: 16px !important; right: 16px !important; bottom: 6% !important; }
        .r-reliable-text h2 { font-size: clamp(22px, 6vw, 32px) !important; }
        .r-cap-pills { padding: 0 5% !important; }
        .r-cap-card { padding: 30px 18px !important; min-height: 0 !important; border-radius: 18px !important; margin: 0 12px !important; }
        .r-cap-content { gap: 24px !important; }
        .r-cap-content > * { max-width: 100% !important; }
        .r-cap-meta { grid-template-columns: 1fr !important; gap: 24px !important; }
        .r-cap-meta h3 { font-size: 28px !important; }
        .r-latest-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        .r-latest-grid > div { grid-column: span 1 !important; }
        .r-footer-cta { grid-template-columns: 1fr !important; gap: 40px !important; padding-bottom: 60px !important; }
        .r-footer-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        .r-footer-bottom { flex-direction: column-reverse !important; align-items: flex-start !important; gap: 22px !important; }
        .r-keycaps-wrap { height: 240px !important; }
        .r-keycaps-wrap > div { width: 96px !important; height: 96px !important; }
        .r-keycaps-wrap button { font-size: 38px !important; border-radius: 22px !important; }
        .r-cookie { left: 12px !important; right: 12px !important; bottom: 12px !important; width: auto !important; max-width: none !important; padding: 18px !important; }
        .r-cookie-actions { flex-direction: column !important; }
        .r-cookie-actions button { width: 100% !important; flex: 1 1 auto !important; }
        .r-music { right: 14px !important; bottom: 14px !important; width: 44px !important; height: 44px !important; }
      }

      @media (max-width: 480px) {
        .r-nav { padding: 12px 14px !important; }
        .r-hero-text h1 { font-size: clamp(22px, 7.5vw, 30px) !important; }
        .r-hero-text .r-hero-cta { padding: 10px 18px !important; font-size: 13px !important; }
        .r-reliable-text h2 { font-size: clamp(20px, 6vw, 28px) !important; }
        .r-green-block { padding: 22px 16px !important; border-radius: 14px !important; }
        .r-green-block h2 { font-size: clamp(20px, 6vw, 28px) !important; }
        .r-cap-card { padding: 22px 10px !important; }
        .r-cap-meta h3 { font-size: 24px !important; }
        .r-cap-meta p { font-size: 15px !important; }
        .r-cookie { padding: 14px !important; }
        .r-music { width: 42px !important; height: 42px !important; right: 12px !important; bottom: 12px !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      link.remove();
      style.remove();
    };
  }, []);

  return (
    <div
      style={{
        background: BLACK,
        minHeight: "100vh",
        color: OFF_WHITE,
        overflowX: "hidden",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <EdgeFilterDefs />
      <Navbar />
      <Choreography />
      <Capabilities />
      <Latest />
      <Footer />
      <MusicToggle />
      <CookieBanner />
    </div>
  );
}
