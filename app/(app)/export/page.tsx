// app/(app)/export/page.tsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import AppShell from "@/components/AppShell";
import { InContentAd, SidebarAd } from "@/components/AdSense";
import { STREAM_ORDER, STREAM_DISPLAY, STREAM_COLORS, type StreamKey } from "@/types";

type ExportType = "analysis" | "allocation" | "pdf";

interface ExportCard {
  type:     ExportType;
  icon:     string;
  title:    string;
  desc:     string;
  filename: string;
  color:    string;
  btnColor: string;
}

const EXPORTS: ExportCard[] = [
  {
    type:     "analysis",
    icon:     "📊",
    title:    "Result Analysis Excel",
    desc:     "4-sheet workbook: Student Marks (colour-coded), Subject Statistics, Mark Range Analysis (band breakdown), School Summary",
    filename: "result_analysis.xlsx",
    color:    "border-green-800 bg-green-950/30",
    btnColor: "bg-green-700 hover:bg-green-600",
  },
  {
    type:     "allocation",
    icon:     "🎯",
    title:    "Stream Allocation Excel",
    desc:     "Final allocation with eligible streams, assigned stream, bonus applied, relaxation used, and per-student reasoning",
    filename: "stream_allocation.xlsx",
    color:    "border-indigo-800 bg-indigo-950/30",
    btnColor: "bg-indigo-700 hover:bg-indigo-600",
  },
  {
    type:     "pdf",
    icon:     "📄",
    title:    "Student Subject Choice Forms (PDF)",
    desc:     "One A4 page per student: school header, Class X marks, assigned stream, selected XI subjects, declaration + signature area",
    filename: "student_subject_forms.pdf",
    color:    "border-cyan-800 bg-cyan-950/30",
    btnColor: "bg-cyan-700 hover:bg-cyan-600",
  },
];

export default function ExportPage() {
  const { students, school_name, stats } = useAppStore();
  const [loading, setLoading] = useState<ExportType | null>(null);

  const streamSummary = STREAM_ORDER.map(st => ({
    stream:  st,
    count:   students.filter(s => s.selected_stream === st).length,
  })).filter(x => x.count > 0);

  async function handleExport(card: ExportCard) {
    if (!students.length) { toast.error("No students loaded. Please upload a gazette file first."); return; }
    setLoading(card.type);
    toast.loading(`Generating ${card.title}…`, { id: card.type });

    try {
      const res = await fetch("/api/export", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: card.type, students, school_name, stats }),
      });
      toast.dismiss(card.type);
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = card.filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${card.filename} downloaded!`);
    } catch {
      toast.dismiss(card.type);
      toast.error("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Export Hub</h1>
          <p className="text-sm text-gray-400 mt-1">
            Download results in Excel or PDF format · {school_name}
          </p>
        </div>

        {/* Summary cards */}
        {students.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{students.length}</div>
              <div className="text-xs text-gray-500 mt-1">Total Students</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {students.filter(s => s.result === "PASS").length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Pass</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {stats?.overall_avg ?? 0}%
              </div>
              <div className="text-xs text-gray-500 mt-1">School Average</div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400">
                {streamSummary.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Streams Used</div>
            </div>
          </div>
        )}

        <InContentAd />

        {/* Main content + sidebar */}
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">

            {/* Export cards */}
            {EXPORTS.map(card => (
              <div key={card.type}
                className={`border rounded-2xl p-6 ${card.color} transition-all`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <span className="text-4xl">{card.icon}</span>
                    <div>
                      <h2 className="text-base font-bold text-gray-100">{card.title}</h2>
                      <p className="text-sm text-gray-400 mt-1 max-w-lg">{card.desc}</p>
                      <p className="text-xs text-gray-600 mt-2 font-mono">{card.filename}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExport(card)}
                    disabled={loading === card.type || !students.length}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-white font-semibold
                      text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      ${card.btnColor}`}
                  >
                    {loading === card.type ? "⏳ Generating…" : "⬇ Download"}
                  </button>
                </div>
              </div>
            ))}

            {/* Stream distribution */}
            {streamSummary.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-300 mb-4">
                  Stream Distribution — {students.length} students
                </h3>
                <div className="space-y-2.5">
                  {streamSummary.map(({ stream, count }) => {
                    const col = STREAM_COLORS[stream as StreamKey];
                    const pct = Math.round(count / students.length * 100);
                    return (
                      <div key={stream} className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded w-40
                          flex-shrink-0 ${col.bg} ${col.text}`}>
                          {STREAM_DISPLAY[stream as StreamKey]}
                        </span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${col.bg}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!students.length && (
              <div className="rounded-2xl border border-dashed border-gray-700
                bg-gray-900/50 p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-400 font-medium">No data loaded</p>
                <p className="text-gray-600 text-sm mt-1">
                  Upload a gazette file first to enable exports.
                </p>
                <a href="/upload"
                  className="inline-block mt-4 px-4 py-2 rounded-lg bg-indigo-700
                    hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">
                  Go to Upload
                </a>
              </div>
            )}
          </div>

          {/* Sidebar ad */}
          <div className="hidden xl:block w-72 flex-shrink-0 space-y-4">
            <SidebarAd />

            {/* AdSense setup guide */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                AdSense Setup
              </h3>
              <ol className="text-xs text-gray-500 space-y-2 list-decimal list-inside">
                <li>Sign up at google.com/adsense</li>
                <li>Add your Vercel domain</li>
                <li>Get Publisher ID (ca-pub-…)</li>
                <li>Create 3 ad units</li>
                <li>Add env vars in Vercel dashboard</li>
                <li>Wait 1–2 weeks for approval</li>
              </ol>
              <div className="bg-gray-800 rounded-lg p-2 font-mono text-[10px] text-gray-400 space-y-1">
                <div>NEXT_PUBLIC_ADSENSE_CLIENT</div>
                <div>NEXT_PUBLIC_AD_SLOT_BANNER</div>
                <div>NEXT_PUBLIC_AD_SLOT_SIDEBAR</div>
                <div>NEXT_PUBLIC_AD_SLOT_RESULT</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
