# JNV Stream Allocation System — Web Edition

**Developed by Rustam Ali | PGT-Computer Science**

Next.js 14 + Node.js API · Hosted on Vercel · Google AdSense integrated

---

## Live Features

| Feature | Details |
|---------|---------|
| PIN login | Password `@rustam` · JWT httpOnly cookie · 8h session |
| TXT parser | CBSE gazette fixed-width format → JSON |
| Marks analysis | Band distribution, subject averages, school stats |
| Stream allocation | 7 streams, bonus checkboxes, relaxation, auto-assign |
| Subject selection | Core auto-fill, Language 1/2, optional electives |
| Excel export | Result analysis (4 sheets) + stream allocation |
| PDF export | A4 form per student with subjects + signatures |
| Google AdSense | Banner top/bottom + sidebar + in-content ad slots |

---

## Quick Start (Local)

```bash
# 1. Clone / unzip the project
cd jnv-streams

# 2. Install
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local — set LOGIN_PIN, JWT_SECRET, AdSense IDs

# 4. Run
npm run dev
# Open http://localhost:3000
# Login with PIN: @rustam
```

---

## Deploy to Vercel (Free)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit – JNV Stream Allocation System"
git remote add origin https://github.com/YOUR_USERNAME/jnv-streams.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import from GitHub → select `jnv-streams`
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy**

### Step 3 — Set Environment Variables on Vercel
Go to your project → **Settings → Environment Variables** → add:

| Variable | Value |
|----------|-------|
| `LOGIN_PIN` | `@rustam` |
| `JWT_SECRET` | (any long random string) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-XXXXXXXXXXXXXXXX` |
| `NEXT_PUBLIC_AD_SLOT_BANNER` | your banner slot ID |
| `NEXT_PUBLIC_AD_SLOT_SIDEBAR` | your sidebar slot ID |
| `NEXT_PUBLIC_AD_SLOT_RESULT` | your in-content slot ID |

Redeploy after adding variables.

---

## Google AdSense Setup

1. Go to [google.com/adsense](https://www.google.com/adsense)
2. Sign in with your Google account
3. Click **Get Started** → enter your Vercel URL (e.g. `jnv-streams.vercel.app`)
4. Copy your **Publisher ID** → `ca-pub-XXXXXXXXXXXXXXXX`
5. Go to **Ads → By ad unit → Display ads**
6. Create 3 units: **Banner**, **Sidebar**, **In-Content**
7. Copy each **Slot ID** (10-digit number)
8. Add all to Vercel environment variables (Step 3 above)
9. Paste the AdSense verification snippet if asked (already handled in `layout.tsx`)
10. Wait **1–2 weeks** for Google to review and approve your site

> AdSense requires your site to have real content and traffic before approval.
> The app renders placeholder boxes until your IDs are configured.

---

## Project Structure

```
jnv-streams/
├── app/
│   ├── layout.tsx                  ← Root layout + AdSense <script>
│   ├── globals.css
│   ├── page.tsx                    ← Redirects to /upload
│   ├── (auth)/login/page.tsx       ← PIN login page
│   ├── (app)/
│   │   ├── upload/page.tsx         ← Gazette upload + marks analysis
│   │   ├── streams/page.tsx        ← Stream allocation table
│   │   ├── subjects/page.tsx       ← Subject selection
│   │   └── export/page.tsx         ← Download hub
│   └── api/
│       ├── auth/route.ts           ← POST login / DELETE logout
│       ├── parse/route.ts          ← POST: parse TXT → JSON
│       ├── analyse/route.ts        ← POST: compute school stats
│       ├── eligibility/route.ts    ← POST: stream eligibility engine
│       └── export/route.ts         ← POST: Excel + PDF generation
├── components/
│   ├── AdSense.tsx                 ← BannerAd, SidebarAd, InContentAd
│   └── AppShell.tsx                ← Nav + header + footer ads
├── lib/
│   ├── auth.ts                     ← JWT helpers
│   ├── constants.ts                ← Subject codes, stream rules
│   ├── eligibility.ts              ← Stream eligibility engine
│   └── parser.ts                   ← CBSE gazette TXT parser
├── middleware.ts                   ← Route protection (JWT check)
├── store/useAppStore.ts            ← Zustand global state
├── types/index.ts                  ← TypeScript types
├── .env.example                    ← Environment variable template
├── vercel.json                     ← Vercel deployment config
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Auth | JWT (jose) + httpOnly cookies |
| Excel | exceljs |
| PDF | @react-pdf/renderer |
| Ads | Google AdSense |
| Hosting | Vercel (free tier) |
| Notifications | react-hot-toast |

---

## Changing the PIN

Edit `LOGIN_PIN` in Vercel environment variables.
Locally, edit `.env.local`.

Format: any string — default is `@rustam`

---

## Developer

**Rustam Ali** | PGT-Computer Science  
JNV Stream Allocation System © 2026
