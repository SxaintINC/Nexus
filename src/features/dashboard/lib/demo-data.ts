// ── DASHBOARD DEMO DATA ───────────────────────────────────────────────────────
// Placeholder analytics until the real backend exists. Everything is generated
// from a fixed seed so numbers are stable across reloads (no jumping charts),
// and it is derived from the school's actual onboarding data — their class
// names, subjects, grading bands and fees — so the dashboard always mirrors
// the school that set it up.

import { loadOnboarding, type GradeBand } from "../../../shared/lib/onboarding-store";

// Small deterministic PRNG — same seed, same numbers, every load.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Seg = "daily" | "weekly" | "monthly";

export type TrendPoint = { label: string; score: number; submissions: number };

export type StudentRow = {
  id: string;
  name: string;
  klass: string;
  avg: number;
  attendance: number;
  status: "active" | "idle" | "new";
};

export type SubmissionRow = {
  student: string;
  klass: string;
  subject: string;
  score: number;
  grade: string;
  when: string;
  status: "Graded" | "Pending" | "Late";
};

export type ExamItem = {
  title: string;
  klass: string;
  day: string;
  mon: string;
  time: string;
  duration: string;
  students: number;
};

export type ActivityItem = {
  kind: "exam" | "grade" | "payment" | "student" | "question";
  text: string;
  when: string;
};

export type DashboardData = ReturnType<typeof buildDashboardData>;

const FIRST = [
  "Adaeze", "Chinedu", "Ifeoma", "Tunde", "Ngozi", "Emeka", "Aisha", "Yusuf",
  "Chiamaka", "Oluwaseun", "Fatima", "Kelechi", "Blessing", "Ibrahim", "Zainab",
  "Obinna", "Funmilayo", "Damilola", "Chidera", "Musa", "Amaka", "Segun",
  "Halima", "Tochukwu", "Precious", "Abdul", "Nneka", "Femi", "Amina", "Uche",
];
const LAST = [
  "Okafor", "Balogun", "Eze", "Adeyemi", "Okafor", "Bello", "Nwosu", "Ibrahim",
  "Ade", "Ogundipe", "Chukwu", "Lawal", "Onyeka", "Sule", "Mohammed", "Obi",
  "Afolabi", "Igwe", "Danjuma", "Ogun",
];

export function buildDashboardData(accountKey?: string) {
  const ob = accountKey ? loadOnboarding(accountKey) : null;
  const rnd = mulberry32(20260915);

  const classes = ob?.classes.length ? ob.classes.map((c) => c.name) : ["JSS 1", "JSS 2", "SS 1"];
  const subjects = ob?.subjects.length
    ? ob.subjects.map((s) => s.name)
    : ["Mathematics", "English Language", "Basic Science"];
  const grading: GradeBand[] =
    ob?.grading.length ? ob.grading : [
      { id: "a", grade: "A", min: 70, max: 100, remark: "Excellent" },
      { id: "b", grade: "B", min: 60, max: 69, remark: "Very good" },
      { id: "c", grade: "C", min: 50, max: 59, remark: "Good" },
      { id: "d", grade: "D", min: 45, max: 49, remark: "Fair" },
      { id: "e", grade: "E", min: 40, max: 44, remark: "Pass" },
      { id: "f", grade: "F", min: 0, max: 39, remark: "Fail" },
    ];
  const session = ob?.session ?? "2026/2027";
  const currentTerm = ob?.terms.find((t) => t.current)?.name ?? "First term";

  // Grade lookup — highest band whose min <= score.
  const bands = [...grading].sort((x, y) => y.min - x.min);
  const gradeFor = (score: number) => bands.find((b) => score >= b.min)?.grade ?? bands[bands.length - 1]?.grade ?? "F";

  // ── Students ──────────────────────────────────────────────────────────────
  const students: StudentRow[] = Array.from({ length: 96 }, (_, i) => {
    const name = `${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]}`;
    const klass = classes[Math.floor(rnd() * classes.length)];
    const avg = Math.round(42 + rnd() * 52); // 42–94
    const statusRoll = rnd();
    return {
      id: `NXS-${String(1001 + i)}`,
      name,
      klass,
      avg,
      attendance: Math.round(78 + rnd() * 21),
      status: statusRoll > 0.82 ? "new" : statusRoll > 0.66 ? "idle" : "active",
    };
  });

  const avgScore = Math.round(students.reduce((s, x) => s + x.avg, 0) / students.length);

  // ── Grade distribution ────────────────────────────────────────────────────
  const gradeOrder = [...grading].sort((x, y) => y.min - x.min);
  const gradeDist = gradeOrder.map((b) => ({
    grade: b.grade,
    remark: b.remark,
    count: students.filter((s) => gradeFor(s.avg) === b.grade).length,
  }));

  // ── Subject averages (per subject across students) ────────────────────────
  const subjectAvg = subjects.map((name, si) => ({
    name,
    avg: Math.min(96, Math.round(avgScore + (rnd() * 22 - 11) + si * 2)),
    trend: Math.round(rnd() * 9 - 3), // ±3 pts vs last term
  })).sort((a, b) => b.avg - a.avg);

  // ── Class averages ────────────────────────────────────────────────────────
  const classAvgs = classes.map((name) => ({
    name,
    avg: Math.round(students.filter((s) => s.klass === name).reduce((s, x) => s + x.avg, 0) / Math.max(1, students.filter((s) => s.klass === name).length)),
  }));

  // ── Performance trend, per segment ────────────────────────────────────────
  const monthlyLabels = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const buildTrend = (seg: Seg): TrendPoint[] => {
    const n = seg === "daily" ? 14 : seg === "weekly" ? 10 : 12;
    const base = avgScore - 6;
    return Array.from({ length: n }, (_, i) => {
      const wave = Math.sin((i / n) * Math.PI * 1.6) * 6;
      const drift = (i / n) * 9; // gentle improvement over time
      const score = Math.round(base + wave + drift + rnd() * 5 - 2.5);
      const submissions = Math.round((seg === "daily" ? 14 : 90) + rnd() * (seg === "daily" ? 22 : 70) + i * (seg === "monthly" ? 4 : 1.5));
      const label =
        seg === "daily"
          ? `${Math.max(1, i + 4)} Sep` // "4 Sep" … "17 Sep"
          : seg === "weekly"
            ? `W${i + 1}`
            : monthlyLabels[i];
      return { label, score: Math.max(35, Math.min(97, score)), submissions };
    });
  };

  // ── Attendance (this week, school-wide) ───────────────────────────────────
  // Present / late / absent per weekday, derived from the same seeded roll.
  const attendanceWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => {
    const present = Math.round(students.length * (0.88 + rnd() * 0.09));
    const late = Math.round((students.length - present) * (0.4 + rnd() * 0.3));
    const absent = students.length - present - late;
    return { day, present, late, absent };
  });
  const attendanceRate = Math.round(
    (attendanceWeek.reduce((s, a) => s + a.present + a.late * 0.5, 0) /
      (attendanceWeek.length * students.length)) *
      100,
  );

  // ── Population (headcount per class + staff) ──────────────────────────────
  const population = classes.map((name) => ({
    name,
    students: students.filter((s) => s.klass === name).length,
    staff: Math.max(2, Math.round(students.filter((s) => s.klass === name).length / 14)),
  }));
  const staffCount = population.reduce((s, p) => s + p.staff, 0);

  // ── Fees ──────────────────────────────────────────────────────────────────
  const perStudent = (ob?.fees ?? []).reduce((s, f) => s + (f.amount || 0), 0) || 85000;
  const expected = perStudent * students.length;
  const collected = Math.round(expected * (0.62 + rnd() * 0.14));
  const feeMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, i) => ({
    label: m,
    value: Math.round((collected / 6) * (0.7 + rnd() * 0.6) + i * 90000),
  }));

  // ── Upcoming exams ────────────────────────────────────────────────────────
  const testType = ob?.testTypes[0]?.name ?? "1st CA";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const upcoming: ExamItem[] = Array.from({ length: 5 }, (_, i) => {
    const subject = subjects[(i + 1) % subjects.length];
    const klass = classes[i % classes.length];
    return {
      title: `${subject} · ${ob?.testTypes[i % Math.max(1, ob.testTypes.length)]?.name ?? testType}`,
      klass,
      day: days[i % days.length],
      mon: "Sep",
      time: `${8 + i}:00 AM`,
      duration: `${[45, 60, 60, 90, 45][i]} min`,
      students: Math.round(students.length / classes.length) - (i % 3) * 2,
    };
  });

  // ── Recent submissions ────────────────────────────────────────────────────
  const statuses: SubmissionRow["status"][] = ["Graded", "Graded", "Graded", "Pending", "Late", "Graded", "Pending"];
  const submissions: SubmissionRow[] = Array.from({ length: 7 }, (_, i) => {
    const st = students[Math.floor(rnd() * students.length)];
    const score = Math.round(38 + rnd() * 58);
    return {
      student: st.name,
      klass: st.klass,
      subject: subjects[Math.floor(rnd() * subjects.length)],
      score,
      grade: gradeFor(score),
      when: ["Today · 9:41 AM", "Today · 9:12 AM", "Today · 8:56 AM", "Today · 8:30 AM", "Yesterday · 4:18 PM", "Yesterday · 2:03 PM", "Yesterday · 11:47 AM"][i],
      status: statuses[i],
    };
  });

  // ── Activity ──────────────────────────────────────────────────────────────
  const activity: ActivityItem[] = [
    { kind: "exam", text: `${subjects[0]} ${testType} published to ${classes[0]}`, when: "12 min ago" },
    { kind: "grade", text: `${submissions[0].score} scripts graded for ${submissions[0].subject}`, when: "1 hr ago" },
    { kind: "payment", text: "Fee payment recorded — ₦85,000 (SS 1)", when: "3 hrs ago" },
    { kind: "question", text: "24 questions added to the question bank", when: "Yesterday" },
    { kind: "student", text: "6 new students imported via CSV", when: "Yesterday" },
  ];

  // ── Header stats ──────────────────────────────────────────────────────────
  const stats = {
    students: { value: students.length, delta: 12 },
    avgScore: { value: avgScore, delta: 4 },
    submissions: { value: 1284, delta: 23 },
    feeRate: { value: Math.round((collected / expected) * 100), delta: 6 },
  };

  const insight = (() => {
    const top = subjectAvg[0];
    const weak = subjectAvg[subjectAvg.length - 1];
    const bestClass = [...classAvgs].sort((a, b) => b.avg - a.avg)[0];
    return `Top subject this term is ${top.name} at ${top.avg}%, while ${weak.name} trails at ${weak.avg}% — ${bestClass?.name ?? "one class"} leads the classes with a ${bestClass?.avg ?? avgScore}% average.`;
  })();

  return {
    session,
    currentTerm,
    classes,
    subjects,
    grading,
    students,
    avgScore,
    gradeDist,
    subjectAvg,
    classAvgs,
    buildTrend,
    expected,
    collected,
    feeMonths,
    upcoming,
    submissions,
    activity,
    stats,
    insight,
    staffCount,
    attendanceWeek,
    attendanceRate,
    population,
  };
}
