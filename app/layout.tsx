// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JNV Stream Allocation System",
  description:
    "CBSE Class X result analysis and Class XI stream allocation system. Developed by Rustam Ali, PGT-Computer Science.",
  keywords: ["JNV","stream allocation","CBSE","Class XI","eligibility"],
  authors: [{ name: "Rustam Ali", url: "https://jnv-streams.vercel.app" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const hasAdsense    = adsenseClient && adsenseClient !== "ca-pub-XXXXXXXXXXXXXXXX";

  return (
    <html lang="en" className="dark">
      <head>
        {/* ── Google AdSense script ──────────────────────────────────────────
            This loads the AdSense library globally.
            Replace ca-pub-XXXXXXXXXXXXXXXX with your real Publisher ID.
            The script is only injected when NEXT_PUBLIC_ADSENSE_CLIENT is set.
        ─────────────────────────────────────────────────────────────────── */}
        {hasAdsense && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
            },
          }}
        />
      </body>
    </html>
  );
}
