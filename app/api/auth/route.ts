// app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { checkPin, signToken, COOKIE, MAX_AGE } from "@/lib/auth";

// POST /api/auth  — verify PIN, set JWT cookie
export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ ok: false, error: "PIN required" }, { status: 400 });
    }

    if (!checkPin(pin.trim())) {
      return NextResponse.json({ ok: false, error: "Incorrect PIN" }, { status: 401 });
    }

    const token = await signToken();
    const res   = NextResponse.json({ ok: true });

    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   MAX_AGE,
      path:     "/",
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/auth  — logout, clear cookie
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
