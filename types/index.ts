// types/index.ts

export interface Student {
  rollno: string;
  name: string;
  sex: "M" | "F" | string;
  result: "PASS" | "COMP" | "FAIL" | "ABSENT" | string;
  comp_sub: string;
  subjects: Record<string, number>;   // { "086": 72, "041": 65, ... }
  best5_pct: number;
  all_pct: number;
  math_marks: number | null;
  math_type: "Standard" | "Basic" | "None";
  sci_marks: number | null;
  // Eligibility (filled after processing)
  overall_pct: number;
  cocurricular: "national" | "state" | "none";
  is_jnv: boolean;
  relaxation_used: number;
  eligible_streams: StreamKey[];
  selected_stream: StreamKey;
  reason: string;
  stream_reasons: Record<StreamKey, string>;
  // Subject selection (Tab 4)
  subject_selection?: SubjectSelection;
}

export type StreamKey =
  | "PCM"
  | "PCB"
  | "PCB+Applied"
  | "Commerce_Math"
  | "Commerce_Applied"
  | "Commerce_NoMath"
  | "Humanities";

export interface SubjectSelection {
  core: string[];
  language: string;
  language2: string;
  optional1: string;
  optional2: string;
}

export interface SubjectStats {
  code: string;
  name: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  bands: Record<string, number>;
  marks: number[];
}

export interface SchoolStats {
  subjects: Record<string, SubjectStats>;
  overall_avg: number;
  overall_min: number;
  overall_max: number;
  overall_bands: Record<string, number>;
  total: number;
  total_pass: number;
  total_comp: number;
  total_fail: number;
}

export interface ParseResult {
  students: Student[];
  school_name: string;
  warnings: string[];
}

export interface EligibilityResult {
  students: Student[];
}

export const STREAM_DISPLAY: Record<StreamKey, string> = {
  PCM:             "PCM (Physics · Chemistry · Math)",
  PCB:             "PCB (Physics · Chemistry · Biology)",
  "PCB+Applied":   "PCB + Applied Math",
  Commerce_Math:   "Commerce with Math",
  Commerce_Applied:"Commerce Applied Math",
  Commerce_NoMath: "Commerce without Math",
  Humanities:      "Humanities",
};

export const STREAM_COLORS: Record<StreamKey, { bg: string; text: string; badge: string }> = {
  PCM:             { bg: "bg-blue-700",   text: "text-blue-100",   badge: "bg-blue-800 text-blue-200" },
  PCB:             { bg: "bg-teal-700",   text: "text-teal-100",   badge: "bg-teal-800 text-teal-200" },
  "PCB+Applied":   { bg: "bg-green-700",  text: "text-green-100",  badge: "bg-green-800 text-green-200" },
  Commerce_Math:   { bg: "bg-orange-700", text: "text-orange-100", badge: "bg-orange-800 text-orange-200" },
  Commerce_Applied:{ bg: "bg-red-800",    text: "text-red-100",    badge: "bg-red-900 text-red-200" },
  Commerce_NoMath: { bg: "bg-stone-700",  text: "text-stone-100",  badge: "bg-stone-800 text-stone-200" },
  Humanities:      { bg: "bg-purple-700", text: "text-purple-100", badge: "bg-purple-800 text-purple-200" },
};

export const STREAM_ORDER: StreamKey[] = [
  "PCM","PCB","PCB+Applied",
  "Commerce_Math","Commerce_Applied","Commerce_NoMath",
  "Humanities",
];

export const BAND_LABELS = ["95-100","90-94","75-89","60-74","33-59","0-32"];
export const BAND_COLORS = [
  "bg-blue-600","bg-blue-400","bg-green-500",
  "bg-yellow-500","bg-orange-500","bg-red-600",
];
export const BAND_TEXT_COLORS = [
  "text-blue-200","text-blue-100","text-green-100",
  "text-yellow-100","text-orange-100","text-red-100",
];
