# Lendro — team guide

This file is the single source of truth for the MVP build. Read it fully before writing code. If something here is unclear, ask in the team chat instead of guessing — do not change the scope.

## 1. What we are building

Lendro is a US-focused web app for working adults aged 25–45. A user answers a 4-step quiz (state, loan goal, amount, credit tier, optional bank offer) and we show how much they overpay by taking the first offer from their own bank (the "Single-Lender Trap"). We compare their bank against simulated lender profiles and show savings, then walk them through a free-trial paywall into a dashboard.

Hard rule: **no hardcoded output numbers.** Every APR, monthly payment, fee and savings figure on screen is calculated from the user's inputs by the functions in `src/lib/finance.ts`.

Lender profiles are simulated on purpose. Use fictional but realistic names (for example "Lone Star Federal Credit Union", "Harbor Online Lending"). Do not attach made-up rates to real lender brands.

Lendro is presented only as a product. Internal planning notes never go into the repo or the site (code, comments, UI text, README, commits, PRs, file names). They stay on each person's machine (see section 10).

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
- One Vercel serverless function: `api/scan.ts` (calls the Claude API)
- Hosting: Vercel (works in the US and Europe)

Only A adds or removes npm packages. Ask A if you need one.

## 4. Folder ownership

Edit only the files you own. If you need a change in someone else's file, message them.

```
src/lib/finance.ts          A   all loan math
src/lib/finance.test.ts     A
src/data/lenders.ts         A   simulated lender profiles + rate tables
src/lib/types.ts            A   shared types and label maps (QuizInput, Audit, ScanResult)
src/lib/format.ts           A   formatUSD, formatUSDCents, formatPct
src/lib/validate.ts         A   input and model-output validation
src/lib/scan.ts             A   scanDocument(input, file?) client + simulatedScan fallback
api/scan.ts                 A   Vercel function, Claude API
src/components/PdfScanner.tsx  A
src/state/AppContext.tsx    B   shared quiz state + current view
src/views/Landing.tsx       B
src/views/Quiz.tsx          B
src/views/Preview.tsx       B
src/components/Navbar.tsx   B
src/components/LoanPlan.tsx B   plan checklist, progress, rate watch
src/lib/plan.ts             B   plan steps per goal + localStorage save/load
src/views/Trial.tsx         C
src/views/Dashboard.tsx     C
src/components/EmailCard.tsx   C
src/components/Footer.tsx   C
src/App.tsx                 A   (view switch only, set up in hour 0, then frozen)
DESIGN.md                   C
package.json, lockfile, configs   A
```

## 5. Shared contracts (agreed in hour 0, frozen after)

### App state (`src/state/AppContext.tsx`)

```ts
type View = 'landing' | 'quiz' | 'preview' | 'trial' | 'dashboard';
type Goal = 'mortgage' | 'auto' | 'bnpl';
type UsState = 'TX' | 'CA' | 'NY' | 'FL' | 'IL';
type CreditTier = 'excellent' | 'good' | 'fair' | 'building';

interface QuizInput {
  state: UsState;
  goal: Goal;
  amount: number;          // dollars
  tier: CreditTier;
  bankApr: number | null;  // percent, e.g. 6.85; null = "No, just exploring"
}
```

The context exposes `view`, `setView`, `input`, `setInput` (partial update). The dashboard edits `amount` and `bankApr` through the same `setInput`, so every screen recalculates from one source.

### Finance API (`src/lib/finance.ts`)

```ts
export const TERM_MONTHS: Record<Goal, number>;            // mortgage 360, auto 60, bnpl 12
export const AMOUNT_RANGE: Record<Goal, { min: number; max: number; step: number; default: number }>;
  // mortgage 50,000–1,500,000 step 5,000 default 350,000
  // auto     5,000–150,000   step 500   default 32,000
  // bnpl     200–20,000      step 100   default 3,000

export function monthlyPayment(principal: number, aprPct: number, months: number): number;
  // standard amortization; aprPct 0 => principal / months
export function totalInterest(principal: number, aprPct: number, months: number): number;
export function baselineApr(goal: Goal, state: UsState, tier: CreditTier): number;
  // "state market baseline" used when bankApr is null
export function matchLenders(input: QuizInput, options?: { rateShift?: number }): LenderQuote[];   // sorted, best APR first
export function computeAudit(input: QuizInput, options?: { rateShift?: number }): Audit;
  // rateShift moves the lender market only; the bank side stays fixed (used by Rate Watch)
export function buildNegotiationEmail(input: QuizInput, audit: Audit, fees: ScannedFee[]): string;

interface LenderQuote {
  id: string; name: string; kind: 'credit_union' | 'online_lender';
  apr: number; originationFee: number; monthly: number;
  totalInterest: number; lifetimeSavings: number;   // vs the user's bank, never below 0
}

interface Audit {
  bankLabel: string;        // "Your Bank" or "Texas Baseline"
  bankApr: number; bankFee: number; bankMonthly: number; bankTotalInterest: number;
  best: LenderQuote;
  monthlyDiff: number;      // bankMonthly - best.monthly
  lifetimeSavings: number;  // (bank interest + bank fee) - (best interest + best fee), floor 0
  alreadyCompetitive: boolean;  // true when bank APR <= best APR
  previewLenders: LenderQuote[];   // top 4 (preview screen)
  tableLenders: LenderQuote[];     // top 5 (dashboard table)
  assistanceEstimate: number;      // mortgage: down-payment grant estimate; auto/bnpl: membership/promo bonus
  bankFeesFlaggedEstimate: number; // used by the PDF scanner fallback
}
```

### Rate model (`src/data/lenders.ts`)

Starting values. A may tune them, but the shapes stay the same.

- Base APR (excellent tier, national): mortgage 6.25, auto 6.00, bnpl 12.00
- Credit tier add-on (excellent / good / fair / building):
  - mortgage 0 / 0.45 / 1.10 / 2.00
  - auto 0 / 1.50 / 4.50 / 8.50
  - bnpl 0 / 4.00 / 9.00 / 15.00
- State adjustment: TX +0.05, CA −0.05, NY +0.10, FL +0.08, IL 0
- Bank origination fee: mortgage 1.0% of amount, auto 1.0%, bnpl 2.5%
- Matched lenders: 6 to 8 profiles, each with an APR discount from baseline (mortgage 0.30–0.85, auto 0.8–2.5, bnpl 3–8, floored at 0) and an origination fee (top 4 are $0)
- Mortgage assistance estimate: 3% of amount, capped by state (TX 10,000; CA 15,000; NY 15,000; FL 10,000; IL 7,500). Auto/BNPL: 1% of amount, capped at 500
- Lifetime savings that would be negative show as 0 and the UI says "You already have a competitive rate"

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

export function planSteps(goal: Goal): { id: string; title: string; detail: string }[];
export function loadSaved(): SavedAudit | null;      // localStorage key "lendro:v1", try/catch, null on any error
export function saveAudit(s: SavedAudit): void;
```

- Saved automatically when the user reaches the dashboard. No account needed.
- Plan steps per goal, 6 to 8 each. Mortgage example: request Loan Estimates from 3 lenders, scan each with the PDF scanner, send the negotiation email, compare final APR and fees, lock the rate, review the Closing Disclosure. Write similar lists for auto and BNPL.
- Progress bar shows completed / total. Checking a step saves immediately.
- Rate Watch re-runs `computeAudit` with the saved input and `{ rateShift }`, and shows the change in APR, monthly payment and lifetime savings since `createdAt`.
- Demo control, clearly labeled "Demo: simulate a market rate change", sets `rateShift` to −0.25 and the numbers recalculate through the same functions. This lines up with the Day-2 "Rate Drop Alert" email.
- On the landing page, if `loadSaved()` returns data, show "Welcome back — continue your plan" linking to the dashboard plan tab.

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

- Uses the Claude API with the PDF as a document block and structured JSON output. The key lives in Vercel env var `ANTHROPIC_API_KEY`, never in the client or the repo.
- When implementing, run the `claude-api` skill so the model id and SDK calls are current.
- UI code calls `scanDocument(input, file)` from `src/lib/scan.ts`. With no file it loads `public/sample-loan-estimate.pdf` ("Test with Sample Bank PDF") and sends it through the same live pipeline.
- Claude only extracts and flags fees. Totals and the email script are computed in code.
- If the call fails or times out (30 s), or no key is set,, `src/lib/scan.ts` returns a simulated result from `computeAudit` with `source: 'simulated'`. The demo must never show an error screen.
- Uploaded files are analyzed and not stored. Say so in the scanner UI.

## 6. Screen copy (use these strings exactly)

Navbar: logo "Lendro", trust badge "No SSN Required • Zero Credit Impact".

Landing
- Headline: "One bank only cares about its own profit. Let AI check 100+ US loan programs for you in 60 seconds"
- Subheadline: "80% of buyers overpay by $4,800+ simply by accepting the first offer from their primary bank."
- CTA: "Run Free AI Rate Check →" (goes to quiz)
- Value cards: "100+ Credit Unions & Lenders Scanned", "Zero Spam Calls or Hard Pulls", "Junk Fee & Loan Estimate Scanner"

Quiz (progress bar "Step N of 4", Back button)
1. State dropdown (Texas, California, New York, Florida, Illinois) and goal cards (Home Mortgage, Auto Loan, BNPL Installment)
2. Range slider and a dollar input box, both bound to `amount`; defaults change with the goal
3. Credit pills: "740+ Excellent", "680–739 Good", "620–679 Fair", "Below 620 Building"
4. "Do you already have an offer from a single bank?" — card "Yes, I have an offer" reveals an APR % input (e.g. 6.85); card "No, just exploring" uses the state baseline
- Submit shows a 1.5 s animation: "Scanning 114 US lenders in [State] for a $[Amount] [Goal]..." then goes to preview

Preview
- Title: "Your AI Audit is Ready: You Could Save $[lifetimeSavings]!"
- Bar chart: "Your Bank / [State] Baseline APR" vs "Best Matched Lender APR", plus monthly payment difference
- Green badge: "4 programs found where you qualify with zero hidden origination fees"
- Locked section with `blur-sm select-none`: 4 lender name rows, assistance amount, negotiation script preview
- Floating CTA: "Unlock Full AI Report & All 4 Lenders ($0 Today) →" (goes to trial)

Trial
- Headline: "Don't sign a loan contract blindfolded. Unlock the entire market for $0"
- Timeline: "Today: $0.00 due — Instant access to all 4+ matched lenders, grant finder, and PDF contract scanner" / "Day 2: Email reminder — Automated email 24 hours before your trial ends" / "Day 3: $29/month — Cancel anytime in 1 click inside settings"
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

## 7. Schedule (10 hours)

| Hour | A | B | C |
|---|---|---|---|
| 0–1 | Scaffold, lint, CI, `App.tsx` view switch, `finance.ts` stubs with the signatures above | `AppContext.tsx` | `DESIGN.md` (website-design:web-design-system skill) |
| 1–4 | finance math, lender data, tests | Landing, Quiz, scanning animation | Trial, Dashboard layout and tabs |
| 4–7 | `api/scan.ts`, sample PDF, PdfScanner | Preview, Loan Plan + Rate Watch | Comparator table, email previews, Footer |
| 7 | **Feature freeze — bug fixes only from here** | | |
| 7–8.5 | Full run on the deployed Vercel URL, fix bugs | Mobile layout pass | Copy check |
| 8.5–10 | Polish (impeccable skill), README, demo rehearsal, backup screen recording | | |

## 8. Git rules (no merge conflicts)

1. Branch per task: `a/finance`, `b/quiz`, `c/dashboard`, etc.
2. Merge into `main` every 1–2 hours through a small PR. Never sit on a branch longer than that.
3. `git pull --rebase origin main` before every push.
4. Touch only files you own (section 4).
5. Only A changes `package.json`, the lockfile and config files.
6. Line endings are normalized by `.gitattributes`; do not change it.
7. Commit messages: short, lowercase, what changed. Example: `quiz: add amount slider and input`.

## 9. Setup per person

```bash
git clone https://github.com/fonneyx/Loaney.git
cd Loaney
npm install
npm run dev
```

The dev server also serves `/api/scan`. To test the live scanner locally, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without it the scanner returns the simulated result.

Before a PR: `npm test` and `npm run build` must pass.

Accounts and connectors:
- GitHub: access to this repo, `gh auth login`
- Vercel: A connects the repo once; everyone gets preview URLs on PRs
- Claude API key: A only, stored in Vercel project env vars as `ANTHROPIC_API_KEY`
- Optional in Claude Code: the Vercel connector (read deploy logs)

## 10. Working with Claude Code

- Create a local `CLAUDE.md` (it is gitignored) with these two lines, so your Claude loads both files every session:
  ```
  @CONTRIBUTING.md
  @.local/brief-notes.md
  ```
- Put the notes file you received from the team lead at `.local/brief-notes.md`. The `.local/` folder is gitignored. Never move it, copy it or quote it anywhere that gets committed.
- Turn off co-author lines: in `~/.claude/settings.json` add `"attribution": { "commit": "", "pr": "", "sessionUrl": false }`.
- Useful skills: `karpathy-guidelines` (keeps changes small), `claude-api` (for `api/scan.ts`), `website-design:web-design-system` (DESIGN.md), `impeccable` (final polish), `code-review` and `simplify` before each PR.
- Each person has a main and a backup Claude Pro account. Switch when you hit the usage limit. Use `/clear` between tasks to save usage.
- Tell your Claude which person you are (A, B or C) at the start of a session.

## 11. Code style

- No emoji in code, comments, commits or docs.
- Comments only where the reason is not obvious.
- No placeholder text, no commented-out code, no unused files.
- Keep the README short: what it is, how to run it, the live link.
