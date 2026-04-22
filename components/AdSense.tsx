"use client";
// components/AdSense.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Google AdSense integration.
// Set NEXT_PUBLIC_ADSENSE_CLIENT in .env.local / Vercel environment variables.
// Create ad units at https://www.google.com/adsense → Ads → By ad unit
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";

interface AdSenseProps {
  slot:   string;           // Ad Unit Slot ID from AdSense dashboard
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSense({
  slot,
  format       = "auto",
  responsive   = true,
  style        = {},
  className    = "",
}: AdSenseProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pushed = useRef(false);

  useEffect(() => {
    // Only push once per mount, and only if client ID is configured
    if (!client || client === "ca-pub-XXXXXXXXXXXXXXXX") return;
    if (pushed.current) return;
    pushed.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not yet loaded – silently ignore
    }
  }, [client]);

  // Don't render anything if AdSense is not configured
  if (!client || client === "ca-pub-XXXXXXXXXXXXXXXX") {
    return (
      <div
        className={`flex items-center justify-center rounded border border-dashed 
          border-gray-600 bg-gray-800/30 text-gray-500 text-xs ${className}`}
        style={{ minHeight: 90, ...style }}
      >
        Ad space — configure NEXT_PUBLIC_ADSENSE_CLIENT
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

// ── Preset ad placements ────────────────────────────────────────────────────

/** Horizontal leaderboard banner — top of pages */
export function BannerAd({ className = "" }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_AD_SLOT_BANNER ?? ""}
      format="horizontal"
      className={`w-full ${className}`}
      style={{ minHeight: 90 }}
    />
  );
}

/** Sidebar rectangle — right column */
export function SidebarAd({ className = "" }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR ?? ""}
      format="rectangle"
      className={className}
      style={{ minHeight: 250, minWidth: 300 }}
    />
  );
}

/** In-content ad — between results sections */
export function InContentAd({ className = "" }: { className?: string }) {
  return (
    <AdSense
      slot={process.env.NEXT_PUBLIC_AD_SLOT_RESULT ?? ""}
      format="auto"
      responsive
      className={`w-full ${className}`}
      style={{ minHeight: 100 }}
    />
  );
}
