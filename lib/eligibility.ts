// lib/eligibility.ts
import type { Student, StreamKey } from "@/types";
import { STREAM_CRITERIA, STREAM_ORDER, MAX_RELAXATION, BONUS_NATIONAL, BONUS_STATE } from "./constants";

function applyBonus(pct: number, coc: string): number {
  if (coc === "national") return Math.min(100, pct + BONUS_NATIONAL);
  if (coc === "state")    return Math.min(100, pct + BONUS_STATE);
  return pct;
}

function checkStream(
  stream: StreamKey,
  sci: number | null,
  math: number | null,
  mathType: string,
  overall: number,
  relax = 0,
): [boolean, string] {
  if (stream === "Humanities") return [true, "Open for all"];
  const c = STREAM_CRITERIA[stream];
  if (!c) return [false, "Unknown stream"];

  const fails: string[] = [];
  if (c.sci_min !== null) {
    if (sci === null) return [false, "Science marks not found"];
    if ((sci + relax) < c.sci_min) fails.push(`Sci ${sci}${relax?`(+${relax})`:""}  < ${c.sci_min}`);
  }
  if (c.math_min !== null) {
    if (math === null) { fails.push("Math marks not found"); }
    else if ((math + relax) < c.math_min) fails.push(`Math ${math}${relax?`(+${relax})`:""}  < ${c.math_min}`);
  }
  if (c.math_type === "standard" && !mathType.includes("Standard"))
    fails.push("Requires Math Standard (041)");
  if (c.overall_min !== null && overall < c.overall_min)
    fails.push(`Overall ${overall.toFixed(1)}% < ${c.overall_min}%`);

  return fails.length ? [false, fails.join("; ")] : [true, "Eligible"];
}

export function computeEligibility(
  student: Student,
  allowRelaxation = false,
  vacantStreams: StreamKey[] = [],
): Student {
  const s = { ...student };
  const overall = applyBonus(s.best5_pct, s.cocurricular);
  s.overall_pct = +overall.toFixed(2);

  const eligible: StreamKey[]          = [];
  const reasons: Record<string,string> = {};
  let usedRelax = 0;

  for (const stream of STREAM_ORDER) {
    const [ok, reason] = checkStream(stream, s.sci_marks, s.math_marks, s.math_type, overall);
    if (ok) {
      eligible.push(stream); reasons[stream] = reason;
    } else if (allowRelaxation && s.is_jnv && vacantStreams.includes(stream)) {
      const [ok2, r2] = checkStream(stream, s.sci_marks, s.math_marks, s.math_type, overall, MAX_RELAXATION);
      if (ok2) {
        eligible.push(stream);
        reasons[stream] = `${r2} [+${MAX_RELAXATION} relaxation]`;
        usedRelax = MAX_RELAXATION;
      } else reasons[stream] = reason;
    } else {
      reasons[stream] = reason;
    }
  }

  s.eligible_streams = eligible;
  s.stream_reasons   = reasons as Record<StreamKey,string>;
  s.relaxation_used  = usedRelax;
  s.selected_stream  = eligible[0] ?? "Humanities";
  s.reason           = reasons[s.selected_stream] ?? "Default";
  if (!eligible.length) s.eligible_streams = ["Humanities"];

  return s;
}

export function processAll(
  students: Student[],
  allowRelaxation = false,
  vacantStreams: StreamKey[] = [],
): Student[] {
  return students.map(s => computeEligibility(s, allowRelaxation, vacantStreams));
}
