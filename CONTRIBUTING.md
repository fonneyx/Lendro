# Lendro — team guide

This file is the single source of truth for the MVP build. Read it fully before writing code. If something here is unclear, ask in the team chat instead of guessing — do not change the scope.

## 1. What we are building

Lendro is a web app for working adults aged 25–45 in the United States, the eurozone and the United Kingdom. A user answers a 4-step quiz (location, loan goal, amount, credit tier, optional bank offer) and we show how much they overpay by taking the first offer from their own bank (the "Single-Lender Trap"). We compare their bank against simulated lender profiles and show savings, then walk them through a free-trial paywall into a dashboard.

Hard rule: **no hardcoded output numbers.** Every rate (APR in the US, APRC in Europe), monthly payment, fee and savings figure on screen is calculated from the user's inputs by the functions in `src/lib/finance.ts`.

Lender profiles are simulated on purpose. Use fictional but realistic names per region (for example "Northpine Federal Credit Union", "Lindenau Cooperative Bank", "Northwold Building Society"). Do not attach made-up rates to real lender brands.

Lendro is presented only as a product. Internal planning notes never go into the repo or the site (code, comments, UI text, README, commits, PRs, file names). They stay on each person's machine (see section 9).

## 2. Scope (frozen)

In scope — the five views and one API route below. Nothing else gets built. New ideas go into `docs/later.md`, not into code.

| View | `view` value | Owner |
|---|---|---|
| Landing page | `landing` | B |
| 4-step quiz + scanning animation | `quiz` | B |
| Blurred preview / paywall | `preview` | B |
| 3-day trial activation | `trial` | C |
| Dashboard (comparator, PDF scanner, email previews) | `dashboard` | C (PDF scanner panel: A) |
| My Loan Plan + Rate Watch (dashboard tab 3, return visits) | `dashboard` | B |

Out of scope for the MVP: real payments (Stripe), real emails (Resend), database (Supabase), accounts/login, live rate feeds (FRED). Checkout buttons and emails are simulated, as the spec allows.

## 3. Stack

- Vite + React + TypeScript
- Tailwind CSS
- lucide-react for icons
- Vitest for tests
- One Vercel serverless function: `api/scan.ts` (calls the Claude API or Gemini)
- Hosting: Vercel (works in the US and Europe)

Only A adds or removes npm packages. Ask A if you need one.

## 4. Folder ownership

Edit only the files you own. If you need a change in someone else's file, message them.

```
src/lib/finance.ts          A   all loan math
src/lib/finance.test.ts     A
src/data/markets.ts         A   regions (us, eu, uk) and markets: currency, rate term, rates, labels, documents
src/data/lenders.ts         A   simulated lender profiles and fee templates per region
src/lib/market.ts           A   market helpers (regionOf, rateTerm, goalLabel, documentName, placeName, detectMarket)
src/lib/types.ts            A   shared types (QuizInput, Audit, ScanResult, Market)
src/lib/format.ts           A   formatMoney, formatMoneyCents, currencySymbol, formatPct
src/lib/validate.ts         A   input and model-output validation
src/lib/scan.ts             A   scanDocument(input, file?) client + simulatedScan fallback
api/scan.ts                 A   Vercel function, Claude API or Gemini
src/components/dashboard/PdfDropzone.tsx  A
src/state/AppContext.tsx    B   shared quiz state, current view, dashboard pane
src/views/Landing.tsx       B
src/views/Quiz.tsx          B
src/views/Preview.tsx       B
src/components/layout/Navbar.tsx  B
src/components/dashboard/Sidebar.tsx  B   plan checklist and progress
src/lib/plan.ts             B   plan steps per region and goal + localStorage save/load
src/views/Trial.tsx         C
src/views/Dashboard.tsx     C
src/components/dashboard/Thread.tsx, RateRail.tsx  C
src/components/layout/Footer.tsx, Shell.tsx  C
src/components/ui/*         C
src/App.tsx                 A   (view switch only)
DESIGN.md                   C
package.json, lockfile, configs   A
```

## 5. Shared contracts (frozen)

### App state (`src/state/AppContext.tsx`)

```ts
type View = 'landing' | 'quiz' | 'preview' | 'trial' | 'dashboard';
type Goal = 'mortgage' | 'auto' | 'bnpl';
type Region = 'us' | 'eu' | 'uk';
type Market = 'us-tx' | 'us-ca' | 'us-ny' | 'us-fl' | 'us-il' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'ie' | 'uk';
type CreditTier = 'excellent' | 'good' | 'fair' | 'building';

interface QuizInput {
  market: Market;
  goal: Goal;
  amount: number;          // in the market's currency
  tier: CreditTier;
  bankApr: number | null;  // percent (APR or APRC), e.g. 6.85; null = "No, just exploring"
}
```

The context exposes `view`, `setView`, `input`, `setInput` (partial update), and `pane`, `setPane` for the dashboard section shown first on phones (`analyst`, `plan`, `rates`). The first market is guessed from the browser language, or taken from the saved plan on return visits. Changing the goal or region resets the amount to that region's default. The dashboard edits `amount` and `bankApr` through the same `setInput`, so every screen recalculates from one source.

### Finance API (`src/lib/finance.ts`)

```ts
export const AMOUNT_RANGE: Record<Goal, { min: number; max: number; step: number }>;
  // mortgage 50,000–1,500,000 step 5,000; auto 5,000–150,000 step 500; bnpl 200–20,000 step 100

export function monthlyPayment(principal: number, aprPct: number, months: number): number;
export function totalInterest(principal: number, aprPct: number, months: number): number;
export function baselineApr(goal: Goal, market: Market, tier: CreditTier): number;
  // market baseline used when bankApr is null
export function matchLenders(input: QuizInput, options?: { rateShift?: number }): LenderQuote[];   // regional lenders, best rate first
export function computeAudit(input: QuizInput, options?: { rateShift?: number }): Audit;
  // rateShift moves the lender market only; the bank side stays fixed (used by Rate Watch)
export function buildNegotiationEmail(input: QuizInput, audit: Audit, fees: ScannedFee[]): string;
  // local currency, rate term, fee term and document name

interface LenderQuote {
  id: string; name: string; kind: 'mutual' | 'online';   // mutual = credit union / cooperative bank / building society
  apr: number; originationFee: number; monthly: number;
  totalInterest: number; lifetimeSavings: number;   // vs the user's bank, never below 0
}

interface Audit {
  bankLabel: string;        // "Your Bank" or "<Market> Baseline"
  bankApr: number; bankFee: number; bankMonthly: number; bankTotalInterest: number;
  best: LenderQuote;
  monthlyDiff: number;
  lifetimeSavings: number;  // (bank interest + bank fee) - (best interest + best fee), floor 0
  alreadyCompetitive: boolean;
  tableLenders: LenderQuote[];     // top 5
  bankFeesFlaggedEstimate: number; // used by the PDF scanner fallback
}
```

### Markets (`src/data/markets.ts`, `src/data/lenders.ts`)

Each region sets its currency, rate term, loan terms, default amounts, base rates, credit tier add-ons, bank fee rate, labels and offer documents. Each market adds a rate adjustment.

| Region | Markets | Currency | Rate term | Mortgage term | Offer document | Mutual lenders | Price |
|---|---|---|---|---|---|---|---|
| us | Texas, California, New York, Florida, Illinois | USD | APR | 30 years | Loan Estimate | Credit unions | $29/mo |
| eu | Germany, France, Spain, Italy, Netherlands, Ireland | EUR | APRC | 25 years | ESIS, SECCI form | Cooperative banks | €29/mo |
| uk | United Kingdom | GBP | APRC | 25 years | Mortgage illustration (ESIS) | Building societies | £24/mo |

- Each region has 7 sample lenders. The top 4 charge no fee.
- Lifetime savings that would be negative show as 0 and the UI says "You already have a competitive rate".
- Sample PDFs: `public/sample-loan-estimate.pdf` (US), `public/sample-esis-eu.pdf`, `public/sample-esis-uk.pdf`.

### Loan Plan and Rate Watch (`src/lib/plan.ts`)

This is the reason a user comes back after the first visit. It must work in the product, not only be described.

```ts
interface SavedAudit {
  version: 1;
  input: QuizInput;
  createdAt: string;            // ISO date of the first audit
  baselineAtSave: number;       // baselineApr(...) when saved
  completedSteps: string[];     // ids of checked plan steps
  rateShift: number;            // percent points, 0 normally; demo control sets e.g. -0.25
}

export function planSteps(goal: Goal, market: Market): { id: string; title: string; detail: string }[];
export function loadSaved(): SavedAudit | null;      // localStorage key "lendro:v1", try/catch, null on any error
export function saveAudit(s: SavedAudit): void;
```

- Saved automatically when the user reaches the dashboard. No account needed.
- Plan steps per region and goal, 6 each. They follow local rules: Loan Estimate and Closing Disclosure in the US, ESIS and the reflection period in the EU, Decisions in Principle and early repayment charges in the UK.
- Progress bar shows completed / total. Checking a step saves immediately.
- Rate Watch re-runs `computeAudit` with the saved input and `{ rateShift }`, and shows the change in APR, monthly payment and lifetime savings since `createdAt`.
- Demo control, clearly labeled "Demo: simulate a market rate change", sets `rateShift` to −0.25 and the numbers recalculate through the same functions. - On the landing page, if `loadSaved()` returns data, show "Welcome back" with plan progress and "Continue your plan", which opens the dashboard on the plan.

### PDF scan API (`api/scan.ts`)

```
POST /api/scan
body: { pdfBase64: string, input: QuizInput }
200:  { fees: { name: string; amount: number; flag: 'junk' | 'negotiable' | 'standard'; note: string }[],
        totalFlagged: number,
        summary: string,
        emailScript: string,     // personalized with the user's numbers
        source: 'ai' | 'simulated' }
```

- Uses the Claude API with the PDF as a document block and structured JSON output. The key lives in Vercel env var `ANTHROPIC_API_KEY`, never in the client or the repo. If only `GEMINI_API_KEY` is set, the same prompt and schema go to Gemini (`GEMINI_MODEL`, default `gemini-3.5-flash-lite`).
- When implementing, run the `claude-api` skill so the model id and SDK calls are current.
- UI code calls `scanDocument(input, file)` from `src/lib/scan.ts`. With no file it loads the sample PDF for the user's region ("Test with Sample Bank PDF") and sends it through the same live pipeline.
- The prompt covers US, EU and UK offer documents in English, German, French, Spanish, Italian or Dutch. Fee names come back in English with the original term in parentheses.
- Claude only extracts and flags fees. Totals and the email script are computed in code.
- If the call fails or times out (30 s), or no key is set, `src/lib/scan.ts` returns a simulated result from `computeAudit` with `source: 'simulated'`. The demo must never show an error screen.
- Uploaded files are analyzed and not stored. Say so in the scanner UI.

## 6. Screen copy (use these strings exactly)

Navbar: logo "Lendro", trust badge "No SSN Required • Zero Credit Impact" in the US and "No ID Number Required • Zero Credit Impact" in Europe (phones show only "Zero Credit Impact"). The landing page adds one "Check my offer" button.

Landing (one primary action, short sentences, sources for every statistic)
- Hero: "Your bank's first offer is rarely its best one." / "Compare it with [credit unions | cooperative banks | building societies] and online lenders in 60 seconds. See what you keep before you sign." / button "Check my loan offer" / "Free. No sign-up, no credit check." / a sample audit card for the visitor's market, labeled "Sample data"
- Proof: 77% of US mortgage borrowers apply with only one lender (CFPB, 2015); $1,500 saved on average with one extra mortgage quote (Freddie Mac, 2018); £550 a year overpaid by 3 in 10 UK borrowers who missed a cheaper deal (FCA, 2018). Each links to its source.
- "Same loan. Very different cost.": taking the first offer vs checking with Lendro
- "Three steps. About a minute."
- Calculator: loan type, location, amount and bank rate sliders, live savings from `computeAudit`; "See my full audit" carries the numbers into the quiz
- Final: "Before you sign, spend 60 seconds." with the credit-score objection answered, and the same button

Quiz (progress bar "Step N of 4", Back button)
1. Location dropdown grouped into United States (5 states) and Europe (6 eurozone countries and the United Kingdom), and goal cards with regional labels
2. Range slider and an amount box in the local currency, both bound to `amount`; defaults change with the goal and region
3. Credit pills: US score ranges ("740+ Excellent" ...); Europe uses history descriptions ("Excellent: No missed payments" ...)
4. "Do you already have an offer from a single bank?" — card "Yes, I have an offer" reveals an APR or APRC input; card "No, just exploring" uses the market baseline
- Submit shows a 1.5 s animation: "Comparing lender profiles in [Market] for your [Amount] [Goal]" then goes to preview

Preview
- Title: "Your loan audit is ready" with "You could save up to $[lifetimeSavings]"
- Bar chart: "Your Bank / [State] Baseline APR" vs "Best Matched Lender APR", plus monthly payment difference
- Green badge: "4 sample lender profiles with no origination fee"
- Locked section with `blur-sm select-none`: 4 lender name rows, assistance amount, negotiation script preview
- Floating CTA: "Unlock Full Report ($0 today)" (goes to trial)

Trial
- Headline: "Don't sign a loan contract blindfolded. Start Pro for $0."
- Timeline: "Today: $0.00 due — Instant access to all 4+ matched lenders, grant finder, and PDF contract scanner" / "Day 2: Email reminder — Automated email 24 hours before your trial ends" / "Day 3: $29/month — Cancel anytime in 1 click."
- Buttons: Apple Pay, Google Pay, Stripe Link (all simulated, go to dashboard)
- Text link: "Skip payment (MVP Preview Mode)"

Dashboard
- Tab 1 "AI Comparator & PDF Scanner" (default): editable amount and bank APR at the top; table "Your Primary Bank vs. Top 5 Alternatives" (APR, origination fee, monthly payment, lifetime interest saved); PDF drop zone plus "Test with Sample Bank PDF" button; flagged fees; copy button for the negotiation email
- Tab 2 "Automated Day-2 Retention Emails Preview":
  - Value alert, subject "Rate Drop Alert: One of your matched credit unions in [State] just cut APR by 0.25%"
  - Transparency email, subject "Heads up: Your Lendro 3-day free trial ends tomorrow", states the $29/mo renewal date and a 1-click cancel link
- Tab 3 "My Loan Plan": personal checklist with progress, Rate Watch card, labeled demo control (see section 5)

Every lender list is labeled "Sample lender profiles". Every sample input is labeled "Sample data". Hide any button that does not work.

Footer (every view): "Lendro is an AI-powered educational and analytical tool, not a licensed mortgage broker, lender, or registered financial advisor. All rates, fees, and savings figures shown are dynamic MVP estimates calculated from user inputs for educational and informational purposes only."

Look: white and slate surfaces, deep navy text, emerald for savings, amber or red for overpayment warnings. Details in `DESIGN.md`.

## 7. Git rules (no merge conflicts)

1. Branch per task: `a/finance`, `b/quiz`, `c/dashboard`, etc.
2. Merge into `main` every 1–2 hours through a small PR. Never sit on a branch longer than that.
3. `git pull --rebase origin main` before every push.
4. Touch only files you own (section 4).
5. Only A changes `package.json`, the lockfile and config files.
6. Line endings are normalized by `.gitattributes`; do not change it.
7. Commit messages: short, lowercase, what changed. Example: `quiz: add amount slider and input`.

## 8. Setup per person

```bash
git clone https://github.com/fonneyx/Lendro.git
cd Lendro
npm install
npm run dev
```

The dev server also serves `/api/scan`. To test the live scanner locally, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`. Without it the scanner returns the simulated result.

Before a PR: `npm test` and `npm run build` must pass.

Accounts and connectors:
- GitHub: access to this repo, `gh auth login`
- Vercel: A connects the repo once; everyone gets preview URLs on PRs
- AI key: A only, stored in Vercel project env vars as `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`
- Optional in Claude Code: the Vercel connector (read deploy logs)

## 9. Working with Claude Code

- Create a local `CLAUDE.md` (it is gitignored) that imports `@CONTRIBUTING.md`, so your Claude loads this guide every session. Personal notes go in `.local/`, which is also gitignored and never committed.
- Turn off co-author lines: in `~/.claude/settings.json` add `"attribution": { "commit": "", "pr": "", "sessionUrl": false }`.
- Useful skills: `karpathy-guidelines` (keeps changes small), `claude-api` (for `api/scan.ts`), `website-design:web-design-system` (DESIGN.md), `impeccable` (final polish), `code-review` and `simplify` before each PR.
- Use `/clear` between tasks to save usage.
- Tell your Claude which person you are (A, B or C) at the start of a session.

## 10. Code style

- No emoji in code, comments, commits or docs.
- Comments only where the reason is not obvious.
- No placeholder text, no commented-out code, no unused files.
- Keep the README short: what it is, how to run it, the live link.
