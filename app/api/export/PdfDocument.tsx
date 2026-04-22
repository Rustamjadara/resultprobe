// app/api/export/PdfDocument.tsx
// This file MUST be .tsx so JSX compiles. It is imported by route.ts.
import React from "react";
import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import { STREAM_DISPLAY } from "@/types";
import { XI_CATALOG, SUBJECT_NAMES } from "@/lib/constants";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Selection {
  core:      string[];
  language:  string;
  language2: string;
  optional1: string;
  optional2: string;
}

interface StudentLike {
  rollno:        string;
  name:          string;
  sex:           string;
  result:        string;
  subjects:      Record<string, number>;
  best5_pct:     number;
  overall_pct:   number;
  cocurricular:  string;
  selected_stream: string;
}

interface Props {
  students:    StudentLike[];
  selections:  Selection[];
  school_name: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:         { padding: 32, fontFamily: "Helvetica", fontSize: 9, backgroundColor: "#ffffff" },
  headerBar:    { backgroundColor: "#1a237e", padding: "10 16", marginBottom: 12, borderRadius: 4 },
  headerTitle:  { color: "#ffffff", fontSize: 14, fontFamily: "Helvetica-Bold" },
  headerSub:    { color: "#90caf9", fontSize: 8, marginTop: 2 },
  section:      { marginBottom: 10 },
  sectionTitle: {
    fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1a237e",
    marginBottom: 5, borderBottomWidth: 1, borderBottomColor: "#e8eaf6", paddingBottom: 3,
  },
  detailRow:    { flexDirection: "row", marginBottom: 4 },
  detailLabel:  { fontFamily: "Helvetica-Bold", color: "#374151", width: 115 },
  detailVal:    { color: "#111827", flex: 1 },
  streamBanner: { padding: "8 14", borderRadius: 4, marginBottom: 12 },
  streamText:   { color: "#ffffff", fontSize: 11, fontFamily: "Helvetica-Bold" },
  table:        { borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  tableHeader:  { flexDirection: "row", backgroundColor: "#1a237e" },
  tableRow:     { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  tableRowAlt:  { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f3f4f6", backgroundColor: "#f9fafb" },
  cellSn:       { width: 28, padding: "5 4", color: "#ffffff", textAlign: "center" },
  cellSubj:     { flex: 2, padding: "5 6", color: "#ffffff" },
  cellType:     { flex: 1.2, padding: "5 6", color: "#ffffff" },
  cellStatus:   { flex: 1, padding: "5 6", color: "#ffffff", textAlign: "center" },
  dataCell:     { padding: "4 6", color: "#111827" },
  sigArea:      { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  sigBox:       { width: "45%" },
  sigLine:      { borderBottomWidth: 1, borderBottomColor: "#9ca3af", marginBottom: 3, height: 18 },
  sigLabel:     { fontSize: 7, color: "#6b7280", fontFamily: "Helvetica-Bold" },
  footer:       {
    position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "center",
    fontSize: 7, color: "#9ca3af", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 4,
  },
});

const STREAM_BG: Record<string, string> = {
  PCM:              "#1565C0",
  PCB:              "#006064",
  "PCB+Applied":    "#2E7D32",
  Commerce_Math:    "#E65100",
  Commerce_Applied: "#BF360C",
  Commerce_NoMath:  "#4E342E",
  Humanities:       "#4A148C",
};

// ── Component ─────────────────────────────────────────────────────────────────
export function PdfDocument({ students, selections, school_name }: Props) {
  const today = new Date().toLocaleDateString("en-IN");

  return (
    <Document
      title={`Subject Choice Forms – ${school_name}`}
      author="Rustam Ali – JNV Stream Allocation System"
    >
      {students.map((student, idx) => {
        const sel    = selections[idx] ?? { core: [], language: "ENG", language2: "HIN", optional1: "", optional2: "" };
        const stream = student.selected_stream;
        const bg     = STREAM_BG[stream] ?? "#37474F";
        const xMarks = Object.entries(student.subjects);

        const subjectRows = [
          ...sel.core.map((c) => ({ name: XI_CATALOG[c] ?? c, type: "Core (Fixed)", status: "Compulsory" })),
          { name: XI_CATALOG[sel.language]  ?? sel.language,  type: "Language 1",  status: "Compulsory" },
          { name: XI_CATALOG[sel.language2] ?? sel.language2, type: "Language 2",  status: "Compulsory" },
          ...(sel.optional1 ? [{ name: XI_CATALOG[sel.optional1] ?? sel.optional1, type: "Optional 1", status: "Selected" }] : []),
          ...(sel.optional2 ? [{ name: XI_CATALOG[sel.optional2] ?? sel.optional2, type: "Optional 2", status: "Selected" }] : []),
        ];

        const streamLabel = (STREAM_DISPLAY as Record<string, string>)[stream] ?? stream;

        return (
          <Page key={idx} size="A4" style={S.page}>

            {/* ── School header ─────────────────────────────────────────── */}
            <View style={S.headerBar}>
              <Text style={S.headerTitle}>JAWAHAR NAVODAYA VIDYALAYA</Text>
              <Text style={S.headerSub}>{school_name}</Text>
              <Text style={S.headerSub}>Subject Selection Form – Class XI Admission 2026-27</Text>
            </View>

            {/* ── Student details ───────────────────────────────────────── */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>Student Details</Text>

              <View style={S.detailRow}>
                <Text style={S.detailLabel}>Roll No (Class X):</Text>
                <Text style={S.detailVal}>{student.rollno}</Text>
                <Text style={S.detailLabel}>Name:</Text>
                <Text style={S.detailVal}>{student.name}</Text>
              </View>

              <View style={S.detailRow}>
                <Text style={S.detailLabel}>Sex:</Text>
                <Text style={S.detailVal}>{student.sex === "F" ? "Female" : "Male"}</Text>
                <Text style={S.detailLabel}>Class X Result:</Text>
                <Text style={S.detailVal}>{student.result}</Text>
              </View>

              <View style={S.detailRow}>
                <Text style={S.detailLabel}>Best-5 Percentage:</Text>
                <Text style={S.detailVal}>{student.best5_pct.toFixed(1)}%</Text>
                <Text style={S.detailLabel}>Final % (with bonus):</Text>
                <Text style={S.detailVal}>{student.overall_pct.toFixed(1)}%</Text>
              </View>

              {student.cocurricular !== "none" && (
                <View style={S.detailRow}>
                  <Text style={S.detailLabel}>Co-Curricular Bonus:</Text>
                  <Text style={S.detailVal}>
                    {student.cocurricular === "national" ? "National (+3%)" : "State (+2%)"}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Stream banner ─────────────────────────────────────────── */}
            <View style={[S.streamBanner, { backgroundColor: bg }]}>
              <Text style={S.streamText}>Assigned Stream:  {streamLabel}</Text>
            </View>

            {/* ── Subject selection table ───────────────────────────────── */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>Class XI Subject Selection</Text>
              <View style={S.table}>
                {/* Header row */}
                <View style={S.tableHeader}>
                  <Text style={[S.cellSn,   { fontFamily: "Helvetica-Bold" }]}>#</Text>
                  <Text style={[S.cellSubj, { fontFamily: "Helvetica-Bold" }]}>Subject</Text>
                  <Text style={[S.cellType, { fontFamily: "Helvetica-Bold" }]}>Type</Text>
                  <Text style={[S.cellStatus,{ fontFamily: "Helvetica-Bold" }]}>Status</Text>
                </View>
                {/* Data rows */}
                {subjectRows.map((row, ri) => (
                  <View key={ri} style={ri % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.cellSn,    S.dataCell]}>{ri + 1}</Text>
                    <Text style={[S.cellSubj,  S.dataCell]}>{row.name}</Text>
                    <Text style={[S.cellType,  S.dataCell]}>{row.type}</Text>
                    <Text style={[S.cellStatus,S.dataCell]}>{row.status}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Class X marks reference ───────────────────────────────── */}
            {xMarks.length > 0 && (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Class X Marks (Reference)</Text>
                <View style={S.table}>
                  <View style={S.tableHeader}>
                    <Text style={{ width: 55, padding: "4 6", color: "#ffffff", fontFamily: "Helvetica-Bold" }}>Code</Text>
                    <Text style={{ flex: 2,  padding: "4 6", color: "#ffffff", fontFamily: "Helvetica-Bold" }}>Subject</Text>
                    <Text style={{ width: 55, padding: "4 6", color: "#ffffff", fontFamily: "Helvetica-Bold", textAlign: "center" }}>Marks</Text>
                  </View>
                  {xMarks.map(([code, mk], ri) => (
                    <View key={code} style={ri % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                      <Text style={[{ width: 55 }, S.dataCell]}>{code}</Text>
                      <Text style={[{ flex: 2  }, S.dataCell]}>{(SUBJECT_NAMES as Record<string, string>)[code] ?? code}</Text>
                      <Text style={[{ width: 55, textAlign: "center" }, S.dataCell]}>{mk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Declaration + signatures ──────────────────────────────── */}
            <View style={S.section}>
              <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 8, lineHeight: 1.5 }}>
                I hereby confirm that the above subject selection is as per my choice. I have understood
                the eligibility criteria and stream allocation. I agree to abide by the school&apos;s decision.
              </Text>
              <View style={S.sigArea}>
                <View style={S.sigBox}>
                  <View style={S.sigLine} />
                  <Text style={S.sigLabel}>Student&apos;s Signature</Text>
                </View>
                <View style={S.sigBox}>
                  <View style={S.sigLine} />
                  <Text style={S.sigLabel}>Parent / Guardian Signature</Text>
                </View>
              </View>
              <View style={[S.sigArea, { marginTop: 14 }]}>
                <View style={S.sigBox}>
                  <View style={S.sigLine} />
                  <Text style={S.sigLabel}>Date</Text>
                </View>
                <View style={S.sigBox}>
                  <View style={S.sigLine} />
                  <Text style={S.sigLabel}>Class Teacher / Principal</Text>
                </View>
              </View>
            </View>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <Text style={S.footer}>
              Generated by JNV Stream Allocation System · Developed by Rustam Ali, PGT-Computer Science ·
              Roll No: {student.rollno} · {today}
            </Text>

          </Page>
        );
      })}
    </Document>
  );
}
