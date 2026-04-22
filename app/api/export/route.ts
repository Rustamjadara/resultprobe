// app/api/export/route.ts
// NOTE: .ts file — no JSX allowed. PDF component lives in PdfDocument.tsx
import { NextRequest, NextResponse } from "next/server";
import type { Student, SchoolStats } from "@/types";

export const dynamic     = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const { type } = body;
    if (type === "pdf") return await handlePdf(body);
    return await handleExcel(body);
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────
function hdr(cell: any, val: string, bg = "1a237e", fg = "FFFFFF", sz = 10) {
  cell.value     = val;
  cell.font      = { bold: true, color: { argb: fg }, size: sz };
  cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.border    = {
    top:    { style: "thin", color: { argb: "CCCCCC" } },
    bottom: { style: "thin", color: { argb: "CCCCCC" } },
    left:   { style: "thin", color: { argb: "CCCCCC" } },
    right:  { style: "thin", color: { argb: "CCCCCC" } },
  };
}

function thin(cell: any) {
  cell.border = {
    top:    { style: "thin", color: { argb: "CCCCCC" } },
    bottom: { style: "thin", color: { argb: "CCCCCC" } },
    left:   { style: "thin", color: { argb: "CCCCCC" } },
    right:  { style: "thin", color: { argb: "CCCCCC" } },
  };
}

function bandArgb(m: number): string {
  if (m >= 95) return "DBEAFE";
  if (m >= 90) return "BFDBFE";
  if (m >= 75) return "DCFCE7";
  if (m >= 60) return "FEF9C3";
  if (m >= 33) return "FFEDD5";
  return "FEE2E2";
}

const BAND_COL_COLORS = ["1565C0","2196F3","43a047","f9a825","fb8c00","e53935"];

function colLetter(n: number): string {
  return String.fromCharCode(64 + n);
}

// ── Excel dispatcher ───────────────────────────────────────────────────────
async function handleExcel(body: {
  type:        "analysis" | "allocation";
  students:    Student[];
  school_name: string;
  stats?:      SchoolStats;
}) {
  const ExcelJS = (await import("exceljs")).default;
  const { type, students, school_name, stats } = body;
  const wb   = new ExcelJS.Workbook();
  wb.creator = "Rustam Ali – JNV Stream Allocation System";
  wb.created = new Date();

  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  if (type === "analysis" && stats) {
    buildAnalysisWorkbook(wb, students, stats, school_name, date);
  } else {
    buildAllocationWorkbook(wb, students, school_name, date);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const fname  = type === "analysis" ? "result_analysis" : "stream_allocation";
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="${fname}_${Date.now()}.xlsx"`,
    },
  });
}

// ── Stream Allocation workbook ──────────────────────────────────────────────
function buildAllocationWorkbook(
  wb: any, students: Student[], school: string, date: string,
) {
  const ws = wb.addWorksheet("Stream Allocation");
  const streamBg: Record<string, string> = {
    PCM: "1565C0", PCB: "006064", "PCB+Applied": "2E7D32",
    Commerce_Math: "E65100", Commerce_Applied: "BF360C",
    Commerce_NoMath: "4E342E", Humanities: "4A148C",
  };

  ws.mergeCells("A1:N1");
  const t = ws.getCell("A1");
  t.value     = `Stream Allocation – ${school} | ${date}`;
  t.font      = { bold: true, size: 13, color: { argb: "FFFFFF" } };
  t.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "1a237e" } };
  t.alignment = { horizontal: "center" };
  ws.getRow(1).height = 22;

  const headers = [
    "Roll No","Name","Sex","Result","Science","Math","Math Type",
    "Best-5%","Bonus","Final%","Relax","Eligible Streams","Assigned Stream","Reason",
  ];
  const r2 = ws.addRow([]);
  headers.forEach((h, i) => hdr(r2.getCell(i + 1), h, "3949ab"));
  ws.getRow(2).height = 28;

  students.forEach((s, ri) => {
    const row = ws.addRow([
      s.rollno, s.name, s.sex === "F" ? "Female" : "Male", s.result,
      s.sci_marks ?? "N/A", s.math_marks ?? "N/A", s.math_type,
      `${s.best5_pct.toFixed(1)}%`, s.cocurricular,
      `${s.overall_pct.toFixed(1)}%`,
      s.relaxation_used ? `+${s.relaxation_used}` : "—",
      s.eligible_streams.join(" | "),
      s.selected_stream.replace(/_/g, " "), s.reason,
    ]);
    const fill = ri % 2 === 0 ? "FFFFFF" : "F8F9FA";
    row.eachCell((cell: any) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font      = { size: 9 };
    });
    const sc = row.getCell(13);
    const bg = streamBg[s.selected_stream] ?? "455A64";
    sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    sc.font = { bold: true, color: { argb: "FFFFFF" }, size: 9 };
  });

  [12,22,7,8,8,8,12,9,9,9,8,40,24,30].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  ws.views = [{ state: "frozen", ySplit: 2 }];
}

// ── Result Analysis workbook (4 sheets) ────────────────────────────────────
function buildAnalysisWorkbook(
  wb: any, students: Student[], stats: SchoolStats, school: string, date: string,
) {
  const allCodes = Object.keys(stats.subjects);
  const subj     = stats.subjects as Record<string, any>;

  // ── Sheet 1: Student Marks ────────────────────────────────────────────
  const ws1     = wb.addWorksheet("Student Marks");
  const lastCol = 4 + allCodes.length + 2;

  ws1.mergeCells(`A1:${colLetter(lastCol)}1`);
  const t1 = ws1.getCell("A1");
  t1.value     = `Result Analysis – ${school}  (${date})`;
  t1.font      = { bold: true, size: 13, color: { argb: "FFFFFF" } };
  t1.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "1a237e" } };
  t1.alignment = { horizontal: "center", vertical: "middle" };
  ws1.getRow(1).height = 24;

  const hdrs = [
    "Roll No","Name","Sex","Result",
    ...allCodes.map(c => `${subj[c]?.name ?? c}\n(${c})`),
    "Best-5 %","All Subjects %",
  ];
  const r2 = ws1.addRow([]);
  hdrs.forEach((h, i) => hdr(r2.getCell(i + 1), h, "3949ab"));
  ws1.getRow(2).height = 32;

  const altFill = ["FFFFFF","F8F9FA"];
  students.forEach((s, ri) => {
    const row = ws1.addRow([
      s.rollno, s.name, s.sex, s.result,
      ...allCodes.map(c => s.subjects[c] ?? "—"),
      s.best5_pct, s.all_pct,
    ]);
    const fill = altFill[ri % 2];
    row.eachCell((cell: any, ci: number) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font      = { size: 9 };
      // Band colour for mark cells
      if (ci >= 5 && ci <= 4 + allCodes.length) {
        const val = typeof cell.value === "number" ? cell.value : null;
        if (val !== null) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bandArgb(val) } };
          cell.font = { size: 9, bold: val >= 90 };
          thin(cell); return;
        }
      }
      // Best-5% column
      if (ci === 5 + allCodes.length) {
        const val = typeof cell.value === "number" ? cell.value : null;
        if (val !== null) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bandArgb(val) } };
          cell.font = { size: 9, bold: true };
          thin(cell); return;
        }
      }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      thin(cell);
    });
  });

  // Subject Average row at bottom
  const avgRow = ws1.addRow([
    "—","SUBJECT AVERAGE","—","—",
    ...allCodes.map(c => subj[c]?.avg ?? "—"),
    stats.overall_avg,"—",
  ]);
  avgRow.eachCell((cell: any, ci: number) => {
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "e8eaf6" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font      = { size: 9 };
    thin(cell);
    if (ci >= 5 && ci <= 4 + allCodes.length) {
      const val = typeof cell.value === "number" ? cell.value : null;
      if (val !== null) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bandArgb(val) } };
        cell.font = { size: 9, bold: true, color: { argb: "1a237e" } };
      }
    }
    if (ci === 2) {
      cell.font      = { size: 10, bold: true, color: { argb: "1a237e" } };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
    if (ci === 5 + allCodes.length) {
      const val = typeof cell.value === "number" ? cell.value : null;
      if (val !== null) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bandArgb(val) } };
        cell.font = { size: 9, bold: true, color: { argb: "1a237e" } };
      }
    }
  });

  ws1.getColumn(1).width = 12;
  ws1.getColumn(2).width = 22;
  ws1.getColumn(3).width = 5;
  ws1.getColumn(4).width = 8;
  allCodes.forEach((_, i) => { ws1.getColumn(5 + i).width = 13; });
  ws1.getColumn(5 + allCodes.length).width     = 10;
  ws1.getColumn(5 + allCodes.length + 1).width = 12;
  ws1.views = [{ state: "frozen", ySplit: 2 }];

  // ── Sheet 2: Subject Statistics ─────────────────────────────────────────
  const ws2 = wb.addWorksheet("Subject Statistics");
  ws2.mergeCells("A1:I1");
  const t2 = ws2.getCell("A1");
  t2.value     = `Subject Statistics – ${school}`;
  t2.font      = { bold: true, size: 12, color: { argb: "FFFFFF" } };
  t2.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "1a237e" } };
  t2.alignment = { horizontal: "center" };
  ws2.getRow(1).height = 22;

  const sh2 = ws2.addRow([]);
  ["Code","Subject Name","Students","Average","Min","Max","Pass (≥33)","High (≥75)","Distinction (≥90)"]
    .forEach((h, i) => hdr(sh2.getCell(i + 1), h, "3949ab"));
  ws2.getRow(2).height = 28;

  Object.entries(stats.subjects).forEach(([code, sd]: [string, any], ri) => {
    const marks  = sd.marks as number[];
    const n      = sd.count;
    const passed = marks.filter((m: number) => m >= 33).length;
    const high   = marks.filter((m: number) => m >= 75).length;
    const dist   = marks.filter((m: number) => m >= 90).length;
    const fill   = ri % 2 === 0 ? "FFFFFF" : "F8F9FA";
    const row    = ws2.addRow([
      code, sd.name, n, sd.avg, sd.min, sd.max,
      `${passed}/${n} (${n ? Math.round(passed/n*100) : 0}%)`,
      `${high}/${n} (${n ? Math.round(high/n*100) : 0}%)`,
      `${dist}/${n} (${n ? Math.round(dist/n*100) : 0}%)`,
    ]);
    row.eachCell((cell: any, ci: number) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font      = { size: 9 };
      cell.fill      = ci === 4
        ? { type: "pattern", pattern: "solid", fgColor: { argb: bandArgb(sd.avg) } }
        : { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      thin(cell);
      if (ci === 1) cell.font = { size: 9, bold: true, color: { argb: "1a237e" } };
      if (ci === 2) cell.alignment = { horizontal: "left", vertical: "middle" };
    });
  });
  [7,22,9,9,7,7,18,18,20].forEach((w, i) => { ws2.getColumn(i + 1).width = w; });
  ws2.views = [{ state: "frozen", ySplit: 2 }];

  // ── Sheet 3: Mark Range Analysis ────────────────────────────────────────
  const ws3 = wb.addWorksheet("Mark Range Analysis");
  const BANDS = [
    ["95-100",95,100],["90-94",90,94],["75-89",75,89],
    ["60-74",60,74],  ["33-59",33,59],["0-32", 0,32],
  ] as const;
  const totalBandCols = 2 + BANDS.length * 2;

  ws3.mergeCells(`A1:${colLetter(totalBandCols)}1`);
  const t3 = ws3.getCell("A1");
  t3.value     = `Mark Range Analysis – ${school}`;
  t3.font      = { bold: true, size: 12, color: { argb: "FFFFFF" } };
  t3.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "1a237e" } };
  t3.alignment = { horizontal: "center" };
  ws3.getRow(1).height = 22;

  const bandHdrRow = ws3.addRow([]);
  hdr(bandHdrRow.getCell(1), "Code",         "3949ab");
  hdr(bandHdrRow.getCell(2), "Subject Name", "3949ab");
  BANDS.forEach(([lbl], bi) => {
    hdr(bandHdrRow.getCell(3 + bi*2),     `${lbl}\n(Count)`, BAND_COL_COLORS[bi]);
    hdr(bandHdrRow.getCell(3 + bi*2 + 1), `${lbl}\n(%)`,     BAND_COL_COLORS[bi]);
  });
  ws3.getRow(2).height = 28;

  // Overall row
  const ovTotal = stats.total || 1;
  const overallRow = ws3.addRow([
    "ALL","Overall Best-5%",
    ...BANDS.flatMap(([lbl]) => {
      const cnt = (stats.overall_bands as Record<string,number>)[lbl] ?? 0;
      return [cnt, `${(cnt/ovTotal*100).toFixed(1)}%`];
    }),
  ]);
  overallRow.eachCell((cell: any, ci: number) => {
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font      = { size: 9, bold: true, color: { argb: "FFFFFF" } };
    thin(cell);
    if (ci <= 2) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0a1628" } };
    } else {
      cell.fill = { type: "pattern", pattern: "solid",
        fgColor: { argb: BAND_COL_COLORS[Math.floor((ci-3)/2)] } };
    }
    if (ci === 2) cell.alignment = { horizontal: "left", vertical: "middle" };
  });

  // Per-subject rows
  const altFill3 = ["FFFFFF","F8F9FA"];
  Object.entries(stats.subjects).forEach(([code, sd]: [string, any], ri) => {
    const n    = sd.count;
    const fill = altFill3[ri % 2];
    const row  = ws3.addRow([
      code, sd.name,
      ...BANDS.flatMap(([lbl]) => {
        const cnt = (sd.bands as Record<string,number>)[lbl] ?? 0;
        return [cnt, `${n ? (cnt/n*100).toFixed(1) : "0.0"}%`];
      }),
    ]);
    row.eachCell((cell: any, ci: number) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font      = { size: 9 };
      thin(cell);
      if (ci <= 2) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
        if (ci === 1) cell.font = { size: 9, bold: true, color: { argb: "1a237e" } };
        if (ci === 2) cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        const bi       = Math.floor((ci-3)/2);
        const isCount  = (ci-3) % 2 === 0;
        const cnt      = typeof cell.value === "number" ? cell.value : 0;
        if (cnt > 0 && isCount) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND_COL_COLORS[bi] } };
          cell.font = { size: 9, bold: true, color: { argb: "FFFFFF" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
          cell.font = { size: 9, color: { argb: cnt === 0 ? "9CA3AF" : "111827" } };
        }
      }
    });
  });

  ws3.getColumn(1).width = 7;
  ws3.getColumn(2).width = 22;
  for (let i = 3; i <= totalBandCols; i++) ws3.getColumn(i).width = 9;
  ws3.views = [{ state: "frozen", ySplit: 2 }];

  // ── Sheet 4: School Summary ──────────────────────────────────────────────
  const ws4 = wb.addWorksheet("School Summary");
  ws4.mergeCells("A1:D1");
  const t4 = ws4.getCell("A1");
  t4.value     = `School Summary – ${school}`;
  t4.font      = { bold: true, size: 13, color: { argb: "FFFFFF" } };
  t4.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "1a237e" } };
  t4.alignment = { horizontal: "center" };
  ws4.getRow(1).height = 24;

  ws4.mergeCells("A2:D2");
  const tgen = ws4.getCell("A2");
  tgen.value     = `Generated: ${date}`;
  tgen.font      = { size: 9, color: { argb: "888888" } };
  tgen.alignment = { horizontal: "center" };

  ws4.addRow([]);

  const summaryRows: [string, string|number][] = [
    ["Total Students",          stats.total],
    ["Total Pass",              stats.total_pass],
    ["Total Compartment",       stats.total_comp],
    ["Total Fail",              stats.total_fail],
    ["School Average (Best-5)", `${stats.overall_avg}%`],
    ["Highest Best-5 %",        `${stats.overall_max}%`],
    ["Lowest Best-5 %",         `${stats.overall_min}%`],
    ["Pass %",                  `${(stats.total_pass/Math.max(stats.total,1)*100).toFixed(1)}%`],
  ];
  summaryRows.forEach(([label, val]) => {
    const row = ws4.addRow([label, val]);
    row.height = 20;
    const lc = row.getCell(1);
    const vc = row.getCell(2);
    lc.font      = { bold: true, size: 10 };
    lc.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "e8eaf6" } };
    lc.alignment = { horizontal: "left", vertical: "middle" };
    thin(lc);
    vc.font      = { bold: true, size: 12, color: { argb: "1a237e" } };
    vc.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } };
    vc.alignment = { horizontal: "center", vertical: "middle" };
    thin(vc);
    [3,4].forEach(ci => {
      const ec = row.getCell(ci);
      ec.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" } };
    });
  });
  ws4.getColumn(1).width = 30;
  ws4.getColumn(2).width = 16;
}

// ── PDF export ───────────────────────────────────────────────────────────────
async function handlePdf(body: {
  students:    Student[];
  selections:  Array<{
    core: string[]; language: string; language2: string;
    optional1: string; optional2: string;
  }>;
  school_name: string;
}) {
  const { students, selections, school_name } = body;
  const { pdf }         = await import("@react-pdf/renderer");
  const { PdfDocument } = await import("./PdfDocument");
  // Cast to `any` to satisfy @react-pdf/renderer's internal DocumentProps type.
  // React.createElement produces a valid ReactElement — the type mismatch is
  // only between react-pdf's narrow DocumentProps and React's generic element type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element         = PdfDocument({ students, selections, school_name }) as any;
const stream     = await pdf(element as any).toBuffer();
const uint8Array = stream instanceof Buffer
  ? stream
  : new Uint8Array(await new Response(stream as any).arrayBuffer());

return new NextResponse(uint8Array, {
  headers: {
    "Content-Type":        "application/pdf",
    "Content-Disposition": `attachment; filename="student_forms_${Date.now()}.pdf"`,
  },
});
}
