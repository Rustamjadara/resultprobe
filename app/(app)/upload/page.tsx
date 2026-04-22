// app/(app)/upload/page.tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import AppShell from "@/components/AppShell";
import { InContentAd, SidebarAd } from "@/components/AdSense";
import type { SchoolStats } from "@/types";
import { BAND_LABELS } from "@/types";
import { SUBJECT_NAMES } from "@/lib/constants";

function bandColor(label: string) {
  const map: Record<string,string> = {
    "95-100":"bg-blue-700 text-blue-100",
    "90-94": "bg-blue-500 text-blue-100",
    "75-89": "bg-green-600 text-green-100",
    "60-74": "bg-yellow-600 text-yellow-900",
    "33-59": "bg-orange-600 text-orange-100",
    "0-32":  "bg-red-700 text-red-100",
  };
  return map[label] ?? "bg-gray-700 text-gray-200";
}

function markClass(m: number) {
  if (m >= 90) return "text-blue-400 font-bold";
  if (m >= 75) return "text-green-400 font-semibold";
  if (m >= 60) return "text-yellow-400";
  if (m >= 33) return "text-orange-400";
  return "text-red-400 font-bold";
}

export default function UploadPage() {
  const router = useRouter();
  const { setParseResult, setLoading, students, school_name, stats } = useAppStore();
  const [dragging, setDragging]   = useState(false);
  const [fileName, setFileName]   = useState("");
  const [processing, setProc]     = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.txt$/i)) {
      toast.error("Please upload a .TXT gazette file");
      return;
    }
    setFileName(file.name);
    setProc(true);
    setLoading(true, "Parsing gazette file…");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const parseRes = await fetch("/api/parse", { method:"POST", body:formData });
      if (!parseRes.ok) throw new Error("Parse failed");
      const { students: parsed, school_name: sn, warnings } = await parseRes.json();

      setLoading(true, "Computing eligibility…");
      const elRes = await fetch("/api/eligibility", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body:    JSON.stringify({ students: parsed }),
      });
      const { students: processed } = await elRes.json();

      const anlRes = await fetch("/api/analyse", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body:    JSON.stringify({ students: processed }),
      });
      const { stats: schoolStats } = await anlRes.json();

      setParseResult(processed, sn, schoolStats, warnings);
      if (warnings.length) toast(`⚠ ${warnings.length} warning(s)`, { icon:"⚠️" });
      toast.success(`${processed.length} students loaded`);
    } catch (e) {
      toast.error("Failed to process file");
    } finally {
      setProc(false);
      setLoading(false);
    }
  }, [setParseResult, setLoading]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const allCodes = stats ? Object.keys(stats.subjects) : [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Upload & Analyse</h1>
          <p className="text-sm text-gray-400 mt-1">
            Upload your CBSE School/Roll-No Gazette (.TXT) to extract and analyse marks.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={onDrop}
          onClick={()=>document.getElementById("file-input")?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all ${dragging
              ? "border-indigo-400 bg-indigo-950/40"
              : "border-gray-600 hover:border-indigo-500 hover:bg-gray-800/40"}`}
        >
          <input
            id="file-input" type="file" accept=".txt,.TXT" className="hidden"
            onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f); }}
          />
          <div className="text-4xl mb-3">📄</div>
          {processing ? (
            <p className="text-indigo-300 font-medium animate-pulse">Processing…</p>
          ) : fileName ? (
            <p className="text-green-400 font-medium">✅ {fileName}</p>
          ) : (
            <>
              <p className="text-gray-300 font-medium">Drop CBSE gazette .TXT here</p>
              <p className="text-gray-500 text-sm mt-1">or click to browse</p>
            </>
          )}
        </div>

        {/* ── Stats bar ─────────────────────────────────────────────────────── */}
        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Students",  val: stats.total,      color:"text-cyan-400" },
                { label:"Pass",      val: stats.total_pass, color:"text-green-400" },
                { label:"Compartmt", val: stats.total_comp, color:"text-yellow-400" },
                { label:"Fail",      val: stats.total_fail, color:"text-red-400" },
                { label:"School Avg",val: `${stats.overall_avg}%`, color:"text-purple-400" },
              ].map(s => (
                <div key={s.label}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* In-content ad between stats and table */}
            <InContentAd />

            {/* ── Marks table ──────────────────────────────────────────────── */}
            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-200 mb-3">
                  Student Marks — {school_name}
                </h2>
                <div className="overflow-auto rounded-xl border border-gray-700 max-h-[520px]">
                  <table className="min-w-full text-xs">
                    <thead className="sticky top-0 bg-gray-800 text-gray-400 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2 text-left">Roll No</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-2 py-2">Sex</th>
                        <th className="px-2 py-2">Result</th>
                        {allCodes.map(c => (
                          <th key={c} className="px-2 py-2 whitespace-nowrap">
                            {SUBJECT_NAMES[c] ?? c}<br/>
                            <span className="text-gray-500 font-mono">({c})</span>
                          </th>
                        ))}
                        <th className="px-2 py-2">Best-5%</th>
                        <th className="px-2 py-2">All%</th>
                      </tr>
                      {/* Average row */}
                      <tr className="bg-indigo-950/60 text-indigo-300 font-bold">
                        <td className="px-3 py-1.5"></td>
                        <td className="px-3 py-1.5 text-left text-[10px]">SUBJECT AVG</td>
                        <td></td><td></td>
                        {allCodes.map(c => (
                          <td key={c} className="px-2 py-1.5 text-center">
                            {stats.subjects[c]?.avg ?? "—"}
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center">{stats.overall_avg}%</td>
                        <td></td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {students.map((s, ri) => (
                        <tr key={s.rollno} className={`data-row ${ri%2===0?"bg-gray-900":"bg-gray-900/60"}`}>
                          <td className="px-3 py-1.5 font-mono text-gray-400">{s.rollno}</td>
                          <td className="px-3 py-1.5 text-gray-200 whitespace-nowrap">{s.name}</td>
                          <td className="px-2 py-1.5 text-center text-gray-400">
                            {s.sex==="F"?"♀":"♂"}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.result==="PASS" ? "bg-green-900 text-green-300" :
                              s.result==="COMP" ? "bg-yellow-900 text-yellow-300" :
                              "bg-red-900 text-red-300"}`}>
                              {s.result}
                            </span>
                          </td>
                          {allCodes.map(c => {
                            const mk = s.subjects[c];
                            return (
                              <td key={c} className={`px-2 py-1.5 text-center ${mk!=null ? markClass(mk) : "text-gray-600"}`}>
                                {mk ?? "—"}
                              </td>
                            );
                          })}
                          <td className={`px-2 py-1.5 text-center font-semibold ${markClass(s.best5_pct)}`}>
                            {s.best5_pct.toFixed(1)}%
                          </td>
                          <td className="px-2 py-1.5 text-center text-gray-400">
                            {s.all_pct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Sidebar ad + subject stats ───────────────────────────── */}
              <div className="hidden xl:block w-72 flex-shrink-0 space-y-4">
                <SidebarAd />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">Subject Analytics</h3>
                  {/* Overall bands */}
                  <div className="bg-gray-900 border border-indigo-900 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-indigo-300">Overall Best-5 Distribution</div>
                    <div className="flex h-3 rounded overflow-hidden gap-px">
                      {BAND_LABELS.map(lbl => {
                        const cnt = stats.overall_bands[lbl] ?? 0;
                        const pct = stats.total ? cnt/stats.total*100 : 0;
                        return pct > 0 ? (
                          <div key={lbl} className={`${bandColor(lbl).split(" ")[0]}`}
                            style={{width:`${pct}%`}} title={`${lbl}: ${cnt}`}/>
                        ) : null;
                      })}
                    </div>
                    {BAND_LABELS.map(lbl => {
                      const cnt = stats.overall_bands[lbl] ?? 0;
                      return cnt > 0 ? (
                        <div key={lbl} className={`flex justify-between items-center px-2 py-0.5 rounded text-[10px] ${bandColor(lbl)}`}>
                          <span>{lbl}%</span><span>{cnt} students</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  {/* Per subject */}
                  {allCodes.map(code => {
                    const sd = stats.subjects[code];
                    return (
                      <div key={code} className="bg-gray-900 border border-gray-700 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-200">{sd.name}</span>
                          <span className="text-xs text-purple-400 font-bold">Avg {sd.avg}</span>
                        </div>
                        <div className="flex h-2 rounded overflow-hidden gap-px">
                          {BAND_LABELS.map(lbl => {
                            const c = sd.bands[lbl]??0;
                            const p = sd.count ? c/sd.count*100 : 0;
                            return p>0 ? <div key={lbl} className={bandColor(lbl).split(" ")[0]}
                              style={{width:`${p}%`}} title={`${lbl}: ${c}`}/> : null;
                          })}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Min {sd.min} · Max {sd.max} · N={sd.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Proceed button */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={async () => {
                  toast.loading("Generating Excel…", { id:"xl" });
                  const res = await fetch("/api/export", {
                    method:"POST",
                    headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ students, school_name, stats, type:"analysis" }),
                  });
                  toast.dismiss("xl");
                  if (!res.ok) { toast.error("Export failed"); return; }
                  const blob = await res.blob();
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  a.href     = url;
                  a.download = "result_analysis.xlsx";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Downloaded!");
                }}
                className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 
                  text-white font-semibold text-sm transition-colors"
              >
                📥 Download Result Analysis Excel
              </button>
              <button
                onClick={() => router.push("/streams")}
                className="px-6 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-600 
                  text-white font-semibold text-sm transition-colors"
              >
                ➡ Proceed to Stream Allocation
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
