// app/api/analyse/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { computeSchoolStats } from "@/lib/parser";
import type { Student } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { students }: { students: Student[] } = await req.json();
    if (!Array.isArray(students) || !students.length) {
      return NextResponse.json({ error: "No students provided" }, { status: 400 });
    }
    const stats = computeSchoolStats(students);
    return NextResponse.json({ stats });
  } catch (e) {
    console.error("Analyse error:", e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
