// app/(auth)/login/page.tsx
"use client";
import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [pin,       setPin]       = useState("");
  const [loading,   setLoading]   = useState(false);
  const [attempts,  setAttempts]  = useState(0);
  const [error,     setError]     = useState("");
  const router      = useRouter();
  const params      = useSearchParams();
  const inputRef    = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim() || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        toast.success("Login successful");
        const from = params.get("from") ?? "/upload";
        router.push(from);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        const remaining   = Math.max(0, 5 - newAttempts);
        setError(
          remaining > 0
            ? `Incorrect PIN — ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining`
            : "Too many failed attempts. Please refresh the page."
        );
        setPin("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🎓</div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          JNV Stream Allocation System
        </h1>
        <p className="mt-1 text-sm text-cyan-400 font-medium">
          Developed by Rustam Ali &nbsp;|&nbsp; PGT-Computer Science
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-100 mb-6 text-center">
          Enter PIN to continue
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="PIN"
            autoFocus
            disabled={attempts >= 5 || loading}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 
              text-gray-100 text-center text-lg tracking-widest placeholder:tracking-normal
              placeholder:text-gray-500 focus:outline-none focus:border-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {error && (
            <div className="rounded-lg bg-red-950 border border-red-700 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!pin.trim() || loading || attempts >= 5}
            className="w-full py-3 rounded-lg bg-indigo-700 hover:bg-indigo-600 
              disabled:bg-gray-700 disabled:cursor-not-allowed 
              text-white font-semibold text-base transition-colors"
          >
            {loading ? "Verifying…" : "🔓  Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          CBSE Gazette → Result Analysis → Stream Allocation → PDF Forms
        </p>
      </div>
    </div>
  );
}
