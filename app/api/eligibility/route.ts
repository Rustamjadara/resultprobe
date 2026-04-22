// app/api/eligibility/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { processAll } from "@/lib/eligibility";
import type { Student, StreamKey } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      students,
      allowRelaxation = false,
      vacantStreams   = [],
    }: {
      students:         Student[];
      allowRelaxation?: boolean;
      vacantStreams?:   StreamKey[];
    } = body;

    if (!Array.isArray(students) || !students.length) {
      return NextResponse.json({ error: "No students provided" }, { status: 400 });
    }

    const processed = processAll(students, allowRelaxation, vacantStreams);
    return NextResponse.json({ students: processed });
  } catch (e) {
    console.error("Eligibility error:", e);
    return NextResponse.json({ error: "Eligibility computation failed" }, { status: 500 });
  }
}
