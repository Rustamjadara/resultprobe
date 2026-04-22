// lib/parser.ts  –  CBSE School/Roll-No Gazette TXT parser
import type { Student, SchoolStats } from "@/types";
import { SUBJECT_NAMES, BAND_DEFS } from "./constants";

const MATH_STD  = new Set(["041"]);
const MATH_BAS  = new Set(["241"]);
const SCI_CODE  = "086";

export function parseGazette(text: string): {
  students: Student[];
  school_name: string;
  warnings: string[];
} {
  const lines  = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const warnings: string[] = [];
  const students: Student[] = [];
  let school_name = "";

  // Find school name: "SCHOOL : - 44513   J N V ..."
  for (const line of lines) {
    const m = line.match(/SCHOOL\s*:[\s\-]+(\d+)\s+(.+)/i);
    if (m) { school_name = `${m[1].trim()} – ${m[2].trim()}`; break; }
  }

  const SUBJ_START = 52;
  const ROLL_RE    = /^\d{8}/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) { i++; continue; }

    // Skip headers / separators
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("DATE") ||
      trimmed.startsWith("----") ||
      trimmed.startsWith("ROLL") ||
      trimmed.startsWith("NO ") ||
      trimmed.startsWith("MKS") ||
      trimmed.startsWith("SUB") ||
      trimmed.startsWith("SCHOOL") ||
      trimmed.startsWith("TOTAL") ||
      trimmed.startsWith("*")
    ) { i++; continue; }

    const rollPart = line.substring(0, 9).trim();
    if (!ROLL_RE.test(rollPart)) { i++; continue; }

    // ── Line 1: roll, sex, name, codes, result ─────────────────────────────
    const rollno = rollPart;
    const sex    = line.length > 10 ? line.substring(10, 11).trim() : "";
    const name   = line.length > 12 ? line.substring(12, 52).trim() : "";

    const subjArea = line.length > SUBJ_START ? line.substring(SUBJ_START) : "";

    let result = "PASS";
    if (/COMP/i.test(subjArea))   result = "COMP";
    if (/FAIL/i.test(subjArea))   result = "FAIL";
    if (/ABSENT/i.test(subjArea)) result = "ABSENT";

    const compMatch = subjArea.match(/COMP\s+(\d{3})/);
    const comp_sub  = compMatch ? compMatch[1] : "";

    // Extract codes before PASS/FAIL/COMP keyword
    let resultPos = subjArea.length;
    for (const kw of ["PASS","FAIL","COMP","ABSENT"]) {
      const idx = subjArea.toUpperCase().indexOf(kw);
      if (idx !== -1 && idx < resultPos) resultPos = idx;
    }
    const codesStr   = subjArea.substring(0, resultPos);
    const codeTokens = (codesStr.match(/\b\d{3}\b/g) ?? []);

    // ── Line 2: marks ──────────────────────────────────────────────────────
    const marksTokens: number[] = [];
    if (i + 1 < lines.length) {
      const line2   = lines[i + 1];
      const roll2   = line2.substring(0, 9).trim();
      if (!ROLL_RE.test(roll2)) {
        const mkStr = line2.length > SUBJ_START ? line2.substring(SUBJ_START) : line2;
        for (const t of mkStr.split(/\s+/)) {
          if (/^\d{1,3}$/.test(t)) marksTokens.push(parseInt(t, 10));
        }
        i++;
      }
    }

    const subjects: Record<string, number> = {};
    codeTokens.forEach((code, idx) => {
      if (idx < marksTokens.length) subjects[code] = marksTokens[idx];
    });

    if (!Object.keys(subjects).length) { i++; continue; }

    // ── Derived fields ────────────────────────────────────────────────────
    const allMarks  = Object.values(subjects);
    const best5     = [...allMarks].sort((a,b)=>b-a).slice(0,5);
    const best5_pct = best5.length ? +(best5.reduce((s,v)=>s+v,0)/best5.length).toFixed(2) : 0;
    const all_pct   = allMarks.length ? +(allMarks.reduce((s,v)=>s+v,0)/allMarks.length).toFixed(2) : 0;

    let math_marks: number | null = null;
    let math_type: "Standard"|"Basic"|"None" = "None";
    for (const c of MATH_STD) { if (c in subjects) { math_marks = subjects[c]; math_type="Standard"; break; }}
    if (math_marks === null) {
      for (const c of MATH_BAS) { if (c in subjects) { math_marks = subjects[c]; math_type="Basic"; break; }}
    }

    const sci_marks: number | null = SCI_CODE in subjects ? subjects[SCI_CODE] : null;

    students.push({
      rollno, name, sex, result, comp_sub, subjects,
      best5_pct, all_pct, math_marks, math_type, sci_marks,
      overall_pct:      best5_pct,
      cocurricular:     "none",
      is_jnv:           true,
      relaxation_used:  0,
      eligible_streams: [],
      selected_stream:  "Humanities",
      reason:           "",
      stream_reasons:   {} as Record<string, string>,
    } as Student);

    i++;
  }

  if (!students.length) warnings.push("No student records found. Check file format.");
  return { students, school_name, warnings };
}

export function computeSchoolStats(students: Student[]): SchoolStats {
  const allCodes = new Set<string>();
  for (const s of students) Object.keys(s.subjects).forEach(c => allCodes.add(c));

  const subjects: Record<string, any> = {};
  for (const code of allCodes) {
    const marks = students.filter(s => code in s.subjects).map(s => s.subjects[code]);
    if (!marks.length) continue;
    const avg = marks.reduce((a,b)=>a+b,0)/marks.length;
    const bands: Record<string,number> = {};
    for (const [lbl,lo,hi] of BAND_DEFS) {
      bands[lbl] = marks.filter(m => m>=lo && m<=hi).length;
    }
    subjects[code] = {
      code, name: SUBJECT_NAMES[code] ?? `Sub-${code}`,
      count: marks.length, avg: +avg.toFixed(1),
      min: Math.min(...marks), max: Math.max(...marks),
      bands, marks,
    };
  }

  const overall = students.map(s => s.best5_pct);
  const overall_bands: Record<string,number> = {};
  for (const [lbl,lo,hi] of BAND_DEFS) {
    overall_bands[lbl] = overall.filter(m => m>=lo && m<=hi).length;
  }

  return {
    subjects,
    overall_avg: overall.length ? +(overall.reduce((a,b)=>a+b,0)/overall.length).toFixed(1) : 0,
    overall_min: overall.length ? Math.min(...overall) : 0,
    overall_max: overall.length ? Math.max(...overall) : 0,
    overall_bands,
    total:       students.length,
    total_pass:  students.filter(s=>s.result==="PASS").length,
    total_comp:  students.filter(s=>s.result==="COMP").length,
    total_fail:  students.filter(s=>s.result==="FAIL").length,
  };
}
