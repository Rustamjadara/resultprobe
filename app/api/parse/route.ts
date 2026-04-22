// app/api/parse/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseGazette } from "@/lib/parser";

// Route Segment Config (App Router — replaces the deprecated page-level "export const config")
export const dynamic     = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.match(/\.txt$/i)) {
      return NextResponse.json(
        { error: "Only .TXT gazette files are accepted" },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10 MB)" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const { students, school_name, warnings } = parseGazette(text);

    return NextResponse.json({ students, school_name, warnings });
  } catch (e) {
    console.error("Parse error:", e);
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}
