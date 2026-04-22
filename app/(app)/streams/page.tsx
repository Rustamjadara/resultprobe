// app/(app)/streams/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import AppShell from "@/components/AppShell";
import { InContentAd, SidebarAd } from "@/components/AdSense";
import { computeEligibility } from "@/lib/eligibility";
import {
  STREAM_ORDER, STREAM_DISPLAY, STREAM_COLORS, type StreamKey,
} from "@/types";

function BonusCheck({ checked, label, color, onChange }: {
  checked: boolean; label: string; color: string; onChange: ()=>void;
}) {
  return (
    <label className={`flex items-center gap-1 cursor-pointer text-[10px] font-semibold
      px-1.5 py-0.5 rounded border ${checked
        ? `${color} border-transparent`
        : "text-gray-500 border-gray-700 bg-transparent"}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only"/>
      {label}
    </label>
  );
}

export default function StreamsPage() {
  const router = useRouter();
  const { students, updateStudent, school_name } = useAppStore();
  const [search, setSearch]     = useState("");
  const [filterStream, setFS]   = useState<StreamKey | "">("");
  const [onlyRelax, setRelax]   = useState(false);
  const [exporting, setExp]     = useState(false);

  const filtered = useMemo(() => students
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.rollno.includes(search)) return false;
      if (filterStream && s.selected_stream !== filterStream) return false;
      if (onlyRelax && !s.relaxation_used) return false;
      return true;
    }), [students, search, filterStream, onlyRelax]);

  const streamCounts = useMemo(() => {
    const m: Record<string,number> = {};
    students.forEach(s => { m[s.selected_stream]=(m[s.selected_stream]??0)+1; });
    return m;
  }, [students]);

  function setBonus(idx: number, val: "national"|"state"|"none") {
    const updated = computeEligibility({ ...students[idx], cocurricular: val });
    updateStudent(idx, updated);
  }

  function setStream(idx: number, stream: StreamKey) {
    updateStudent(idx, { selected_stream: stream, reason: "Manually selected" });
  }

  function autoAssignAll() {
    students.forEach((s, i) => {
      const el = s.eligible_streams;
      updateStudent(i, {
        selected_stream: el[0] ?? "Humanities",
        reason: "Auto-assigned",
      });
    });
    toast.success("All students auto-assigned");
  }

  async function handleExport() {
    setExp(true);
    toast.loading("Generating Excel…", { id:"exp" });
    try {
      const res = await fetch("/api/export", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body:    JSON.stringify({ students, school_name, type:"allocation" }),
      });
      toast.dismiss("exp");
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "stream_allocation.xlsx"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } finally { setExp(false); }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Stream Allocation</h1>
            <p className="text-sm text-gray-400 mt-1">{school_name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={autoAssignAll}
              className="px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-semibold">
              ⚡ Auto Assign All
            </button>
            <button onClick={handleExport} disabled={exporting}
              className="px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold">
              📥 Export Excel
            </button>
            <button onClick={() => router.push("/subjects")}
              className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold">
              ➡ Subject Selection
            </button>
          </div>
        </div>

        {/* Stream stat pills */}
        <div className="flex flex-wrap gap-2">
          {STREAM_ORDER.map(st => {
            const cnt   = streamCounts[st] ?? 0;
            const col   = STREAM_COLORS[st];
            return (
              <button key={st}
                onClick={() => setFS(filterStream===st ? "" : st)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold
                  border transition-all ${filterStream===st
                    ? `${col.bg} ${col.text} border-transparent`
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"}`}>
                <span className={`inline-block w-5 h-5 rounded-full text-center leading-5
                  text-[10px] font-black ${col.badge}`}>
                  {cnt}
                </span>
                {st.replace("_", " ")}
              </button>
            );
          })}
        </div>

        {/* In-content ad */}
        <InContentAd />

        {/* Filter bar */}
        <div className="flex gap-3 items-center flex-wrap">
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search name / roll…"
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm
              text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 w-52"/>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input type="checkbox" checked={onlyRelax} onChange={e=>setRelax(e.target.checked)}
              className="accent-indigo-500"/>
            Relaxation only
          </label>
          <span className="text-xs text-gray-600 ml-auto">
            Showing {filtered.length} / {students.length}
          </span>
        </div>

        {/* Table + sidebar */}
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <div className="overflow-auto rounded-xl border border-gray-700 max-h-[560px]">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-gray-800 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 text-left">Roll</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-2 py-2">Sci</th>
                    <th className="px-2 py-2">Math</th>
                    <th className="px-2 py-2">Best-5%</th>
                    <th className="px-3 py-2">Bonus</th>
                    <th className="px-2 py-2">Final%</th>
                    <th className="px-2 py-2">Relax</th>
                    <th className="px-3 py-2 min-w-[200px]">Assigned Stream</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map(({ s, i }) => {
                    const col = STREAM_COLORS[s.selected_stream];
                    return (
                      <tr key={s.rollno} className="data-row bg-gray-900 hover:bg-gray-800/60">
                        <td className="px-3 py-2 font-mono text-gray-500 text-[10px]">{s.rollno}</td>
                        <td className="px-3 py-2 text-gray-200 whitespace-nowrap">{s.name}</td>
                        <td className={`px-2 py-2 text-center font-semibold ${
                          s.sci_marks==null ? "text-gray-600" :
                          s.sci_marks>=60 ? "text-green-400" : s.sci_marks>=50 ? "text-yellow-400" : "text-red-400"}`}>
                          {s.sci_marks ?? "—"}
                        </td>
                        <td className={`px-2 py-2 text-center font-semibold ${
                          s.math_marks==null ? "text-gray-600" :
                          s.math_marks>=60 ? "text-green-400" : s.math_marks>=45 ? "text-yellow-400" : "text-red-400"}`}>
                          {s.math_marks ?? "—"}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-300">{s.best5_pct.toFixed(1)}%</td>
                        {/* Bonus checkboxes */}
                        <td className="px-2 py-2">
                          <div className="flex gap-1">
                            <BonusCheck
                              checked={s.cocurricular==="national"}
                              label="🏅 Nat"
                              color="bg-yellow-800 text-yellow-200"
                              onChange={() => setBonus(i, s.cocurricular==="national"?"none":"national")}
                            />
                            <BonusCheck
                              checked={s.cocurricular==="state"}
                              label="🥈 St"
                              color="bg-slate-700 text-slate-200"
                              onChange={() => setBonus(i, s.cocurricular==="state"?"none":"state")}
                            />
                          </div>
                        </td>
                        <td className={`px-2 py-2 text-center font-semibold ${
                          s.overall_pct>=60?"text-green-400":s.overall_pct>=50?"text-yellow-400":"text-red-400"}`}>
                          {s.overall_pct.toFixed(1)}%
                        </td>
                        <td className="px-2 py-2 text-center text-emerald-400 font-bold">
                          {s.relaxation_used ? `+${s.relaxation_used}` : "—"}
                        </td>
                        {/* Stream dropdown */}
                        <td className="px-2 py-2">
                          <select
                            value={s.selected_stream}
                            onChange={e => setStream(i, e.target.value as StreamKey)}
                            className={`w-full text-[11px] rounded-md px-2 py-1 font-semibold
                              border-0 focus:outline-none focus:ring-1 focus:ring-indigo-400
                              ${col.bg} ${col.text}`}
                          >
                            {s.eligible_streams.map(st => (
                              <option key={st} value={st}>{STREAM_DISPLAY[st]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-gray-500 max-w-[180px] truncate"
                          title={s.reason}>{s.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar ad */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <SidebarAd />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
