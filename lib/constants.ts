// lib/constants.ts

export const SUBJECT_NAMES: Record<string, string> = {
  "001": "Hindi Course A",    "002": "Hindi Course B",
  "003": "Urdu Course A",     "004": "Urdu Course B",
  "041": "Mathematics Std",   "241": "Mathematics Basic",
  "086": "Science",           "087": "Social Science",
  "184": "English",           "085": "Painting",
  "049": "Physical Education","064": "Home Science",
  "043": "Computer Science",  "083": "Computer Applications",
  "165": "IT / Computer",     "402": "Sanskrit-A",
  "418": "Sanskrit-B",        "101": "English Lang & Lit",
  "122": "Environmental Sci", "254": "AI",
  "076": "NCC",
};

export const XI_CATALOG: Record<string, string> = {
  PHY:"Physics", CHE:"Chemistry", BIO:"Biology", MAT:"Mathematics",
  AMAT:"Applied Mathematics", CS:"Computer Science", IP:"Informatics Practices",
  ACC:"Accountancy", BST:"Business Studies", ECO:"Economics",
  HIS:"History", GEO:"Geography", POL:"Political Science", SOC:"Sociology",
  PSY:"Psychology", PHI:"Philosophy", ENG:"English (Core)", HIN:"Hindi (Core)",
  URD:"Urdu", SAN:"Sanskrit", PE:"Physical Education", FA:"Fine Arts",
  MUS:"Music", NCC_XI:"NCC",
};

export const XI_STREAM_CORE: Record<string, string[]> = {
  PCM:              ["PHY","CHE","MAT"],
  PCB:              ["PHY","CHE","BIO"],
  "PCB+Applied":    ["PHY","CHE","BIO","AMAT"],
  Commerce_Math:    ["ACC","BST","ECO","MAT"],
  Commerce_Applied: ["ACC","BST","ECO","AMAT"],
  Commerce_NoMath:  ["ACC","BST","ECO"],
  Humanities:       ["HIS","GEO","ECO"],
};

export const STREAM_CRITERIA: Record<string, {
  sci_min: number | null;
  math_min: number | null;
  math_type: "standard" | null;
  overall_min: number | null;
  desc: string;
}> = {
  PCM:              { sci_min:60, math_min:60, math_type:"standard", overall_min:60, desc:"Science≥60, Math(Std)≥60, Overall≥60%" },
  PCB:              { sci_min:60, math_min:50, math_type:null,       overall_min:60, desc:"Science≥60, Math≥50, Overall≥60%" },
  "PCB+Applied":    { sci_min:60, math_min:55, math_type:null,       overall_min:60, desc:"Science≥60, Math≥55, Overall≥60%" },
  Commerce_Math:    { sci_min:null, math_min:60, math_type:null,     overall_min:50, desc:"Math≥60, Overall≥50%" },
  Commerce_Applied: { sci_min:null, math_min:55, math_type:null,     overall_min:50, desc:"Math≥55, Overall≥50%" },
  Commerce_NoMath:  { sci_min:null, math_min:45, math_type:null,     overall_min:50, desc:"Math≥45, Overall≥50%" },
  Humanities:       { sci_min:null, math_min:null, math_type:null,   overall_min:null, desc:"Open for all" },
};

export const STREAM_ORDER = [
  "PCM","PCB","PCB+Applied",
  "Commerce_Math","Commerce_Applied","Commerce_NoMath","Humanities",
] as const;

export const MAX_RELAXATION = 5;
export const BONUS_NATIONAL  = 3;
export const BONUS_STATE     = 2;

export const BAND_DEFS: Array<[string, number, number]> = [
  ["95-100", 95, 100],
  ["90-94",  90,  94],
  ["75-89",  75,  89],
  ["60-74",  60,  74],
  ["33-59",  33,  59],
  ["0-32",    0,  32],
];

export const LANG_OPTIONS = [
  { code:"ENG", name:"English (Core)" },
  { code:"HIN", name:"Hindi (Core)" },
  { code:"URD", name:"Urdu" },
  { code:"SAN", name:"Sanskrit" },
];

export const ALL_SUBJECT_OPTIONS = [
  { code:"HIN",    name:"Hindi (Core)" },
  { code:"ENG",    name:"English (Core)" },
  { code:"URD",    name:"Urdu" },
  { code:"SAN",    name:"Sanskrit" },
  { code:"PHY",    name:"Physics" },
  { code:"CHE",    name:"Chemistry" },
  { code:"BIO",    name:"Biology" },
  { code:"MAT",    name:"Mathematics" },
  { code:"AMAT",   name:"Applied Mathematics" },
  { code:"ACC",    name:"Accountancy" },
  { code:"BST",    name:"Business Studies" },
  { code:"ECO",    name:"Economics" },
  { code:"HIS",    name:"History" },
  { code:"GEO",    name:"Geography" },
  { code:"POL",    name:"Political Science" },
  { code:"SOC",    name:"Sociology" },
  { code:"PSY",    name:"Psychology" },
  { code:"PHI",    name:"Philosophy" },
  { code:"CS",     name:"Computer Science" },
  { code:"IP",     name:"Informatics Practices" },
  { code:"PE",     name:"Physical Education" },
  { code:"FA",     name:"Fine Arts" },
  { code:"MUS",    name:"Music" },
  { code:"NCC_XI", name:"NCC" },
];
