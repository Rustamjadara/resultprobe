// app/(app)/subjects/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import AppShell from "@/components/AppShell";
import { InContentAd } from "@/components/AdSense";
import { XI_STREAM_CORE, XI_CATALOG, LANG_OPTIONS, ALL_SUBJECT_OPTIONS } from "@/lib/constants";
import { STREAM_DISPLAY, STREAM_COLORS, type StreamKey } from "@/types";

interface Selection {
  core:      string[];
  language:  string;
  language2: string;
  optional1: string;
  optional2: string;
}

function defaultSelection(stream: StreamKey): Selection {
  return {
    core:      XI_STREAM_CORE[stream] ?? [],
    language:  "ENG",
    language2: "HIN",
    optional1: "",
    optional2: "",
  };
}

export default function SubjectsPage() {
  const router   = useRouter();
  const { students, school_name } = useAppStore();

  const [selections, setSelections] = useState<Selection[]>(() =>
    students.map(s => defaultSelection(s.selected_stream as StreamKey))
  );
  const [search,     setSearch]   = useState("");
  const [genPdf,     setGenPdf]   = useState(false);

  // Re-initialise selections if students change
  const syncedSelections = useMemo(() => {
    if (selections.length === students.length) return selections;
    return students.map((s, i) =>
      selections[i] ?? defaultSelection(s.selected_stream as StreamKey)
    );
  }, [students, selections]);

  function updateSel(idx: number, patch: Partial<Selection>) {
    setSelections(prev => {
      const next = [...prev];
      next[idx]  = { ...syncedSelections[idx], ...patch };
      return next;
    });
  }

  function autoFillAll() {
    setSelections(students.map(s => defaultSelection(s.selected_stream as StreamKey)));
    toast.success("All selections reset to defaults");
  }

  const filtered = useMemo(() =>
    students.map((s, i) => ({ s, i })).filter(({ s }) => {
      if (!search) return true;
      return s.name.toLowerCase().includes(search.toLowerCase()) ||
             s.rollno.includes(search);
    }), [students, search]);

  async function handleGeneratePdf() {
    if (!students.length) { toast.error("No students loaded"); return; }
    setGenPdf(true);
    toast.loading("Generating PDF forms…", { id: "pdf" });
    try {
      const res = await fetch("/api/export", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type: "pdf",
          students,
          selections: syncedSelections,
          school_name,
        }),
      });
      toast.dismiss("pdf");
      if (!res.ok) { toast.error("PDF generation failed"); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "student_subject_forms.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF with ${students.length} forms downloaded!`);
    } catch {
      toast.dismiss("pdf");
      toast.error("PDF generation failed");
    } finally {
      setGenPdf(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Subject Selection</h1>
            <p className="text-sm text-gray-400 mt-1">
              Core subjects auto-filled from stream. Choose language and optional electives.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={autoFillAll}
              className="px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600
                text-white text-sm font-semibold">
              ⚡ Auto-fill All Defaults
            </button>
            <button onClick={handleGeneratePdf} disabled={genPdf || !students.length}
              className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600
                disabled:opacity-50 text-white text-sm font-semibold">
              {genPdf ? "⏳ Generating…" : "📄 Generate PDF Forms"}
            </button>
            <button onClick={() => router.push("/export")}
              className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600
                text-white text-sm font-semibold">
              ➡ Export Hub
            </button>
          </div>
        </div>

        <InContentAd />

        {/* Filter */}
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name / roll…"
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700
              text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none
              focus:border-indigo-500 w-52"
          />
          <span className="text-xs text-gray-600 ml-auto">
            Showing {filtered.length} / {students.length}
          </span>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-800 inline-block"/>
            Core (fixed by stream)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-800 inline-block"/>
            Language (compulsory)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-800 inline-block"/>
            Optional elective
          </span>
        </div>

        {/* Table */}
        <div className="overflow-auto rounded-xl border border-gray-700 max-h-[580px]">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-gray-800 text-gray-400 uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2.5 text-left w-24">Roll No</th>
                <th className="px-3 py-2.5 text-left w-40">Name</th>
                <th className="px-3 py-2.5 text-left w-44">Stream</th>
                <th className="px-3 py-2.5 text-left min-w-[220px]">Core Subjects (Fixed)</th>
                <th className="px-2 py-2.5 w-40">Language 1</th>
                <th className="px-2 py-2.5 w-44">Language 2 / Subject</th>
                <th className="px-2 py-2.5 w-40">Optional 1</th>
                <th className="px-2 py-2.5 w-40">Optional 2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(({ s, i }) => {
                const sel    = syncedSelections[i] ?? defaultSelection(s.selected_stream as StreamKey);
                const stream = s.selected_stream as StreamKey;
                const col    = STREAM_COLORS[stream];

                return (
                  <tr key={s.rollno} className="data-row bg-gray-900 hover:bg-gray-800/60">
                    <td className="px-3 py-2 font-mono text-gray-500 text-[10px]">{s.rollno}</td>
                    <td className="px-3 py-2 text-gray-200 whitespace-nowrap font-medium">
                      {s.name}
                    </td>

                    {/* Stream badge */}
                    <td className="px-2 py-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold
                        ${col.bg} ${col.text}`}>
                        {stream.replace("_"," ")}
                      </span>
                    </td>

                    {/* Core subjects — read-only chips */}
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {sel.core.map(code => (
                          <span key={code}
                            className="px-2 py-0.5 rounded-full bg-indigo-900/60
                              border border-indigo-700 text-indigo-300 text-[10px] font-medium">
                            {XI_CATALOG[code] ?? code}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Language 1 */}
                    <td className="px-2 py-2">
                      <select
                        value={sel.language}
                        onChange={e => updateSel(i, { language: e.target.value })}
                        className="w-full text-[11px] rounded-md px-2 py-1.5
                          bg-purple-900/50 border border-purple-700 text-purple-200
                          focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {LANG_OPTIONS.map(o => (
                          <option key={o.code} value={o.code}>{o.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Language 2 — full CBSE subject list */}
                    <td className="px-2 py-2">
                      <select
                        value={sel.language2}
                        onChange={e => updateSel(i, { language2: e.target.value })}
                        className="w-full text-[11px] rounded-md px-2 py-1.5
                          bg-purple-900/50 border border-purple-700 text-purple-200
                          focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {ALL_SUBJECT_OPTIONS.map(o => (
                          <option key={o.code} value={o.code}>{o.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Optional 1 */}
                    <td className="px-2 py-2">
                      <select
                        value={sel.optional1}
                        onChange={e => updateSel(i, { optional1: e.target.value })}
                        className="w-full text-[11px] rounded-md px-2 py-1.5
                          bg-teal-900/50 border border-teal-800 text-teal-200
                          focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="">— None —</option>
                        {ALL_SUBJECT_OPTIONS.map(o => (
                          <option key={o.code} value={o.code}>{o.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Optional 2 */}
                    <td className="px-2 py-2">
                      <select
                        value={sel.optional2}
                        onChange={e => updateSel(i, { optional2: e.target.value })}
                        className="w-full text-[11px] rounded-md px-2 py-1.5
                          bg-teal-900/50 border border-teal-800 text-teal-200
                          focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="">— None —</option>
                        {ALL_SUBJECT_OPTIONS.map(o => (
                          <option key={o.code} value={o.code}>{o.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom tip */}
        <p className="text-xs text-gray-600">
          💡 Core subjects are fixed per stream · Language 1 defaults to English ·
          Language 2 & Optionals can be any CBSE XI subject ·
          Double-click any row header for subject details
        </p>
      </div>
    </AppShell>
  );
}
