// components/AppShell.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { BannerAd } from "./AdSense";

const NAV = [
  { href: "/upload",   label: "Upload & Analyse", icon: "📄" },
  { href: "/streams",  label: "Stream Allocation", icon: "📊" },
  { href: "/subjects", label: "Subject Selection", icon: "📋" },
  { href: "/export",   label: "Export",            icon: "📥" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth", { method: "DELETE" });
    toast.success("Logged out");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">

      {/* ── Top banner ad ──────────────────────────────────────────────────── */}
      <BannerAd className="px-4 pt-2" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#0a1628] via-[#0d1f3c] to-[#0a1628]
        border-b border-indigo-900 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <span className="text-2xl">🎓</span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-gray-100 tracking-wide">
              JNV Stream Allocation System
            </span>
            <span className="text-[10px] text-cyan-400 font-medium">
              Developed by Rustam Ali&nbsp;|&nbsp;PGT-Computer Science
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium 
                  transition-colors ${
                  pathname === n.href
                    ? "bg-indigo-700 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="text-base">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
            >
              {loggingOut ? "…" : "Logout"}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 px-3 pb-2 overflow-x-auto">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap
                ${pathname === n.href
                  ? "bg-indigo-700 text-white"
                  : "text-gray-400 bg-gray-800/60"
                }`}
            >
              {n.icon} {n.label}
            </Link>
          ))}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* ── Footer ad + footer bar ─────────────────────────────────────────── */}
      <footer className="max-w-7xl w-full mx-auto px-4 pb-4 space-y-3">
        <BannerAd />
        <p className="text-center text-xs text-gray-600">
          JNV Stream Allocation System &copy; {new Date().getFullYear()} &nbsp;·&nbsp;
          Developed by Rustam Ali, PGT-Computer Science
        </p>
      </footer>

    </div>
  );
}
