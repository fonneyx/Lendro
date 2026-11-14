# Lendro design system

Lendro should feel like a careful financial advisor's worksheet: calm, precise, numbers first. No gradients, no glow, no stock illustrations. Trust comes from clear figures and plain language.

## Color

All tokens live in `src/index.css` under `@theme` and are used as Tailwind classes (`bg-canvas`, `text-ink`, `border-line`).

| Token | Hex | Role |
|---|---|---|
| `ink` | #0B1B33 | Headlines, body text, primary buttons |
| `ink-soft` | #33415C | Secondary text |
| `muted` | #64748B | Labels, captions, helper text |
| `line` | #E2E8F0 | Borders, dividers, table rules |
| `canvas` | #F6F8FB | Page background |
| `surface` | #FFFFFF | Cards, inputs |
| `save` | #047857 | Savings figures, best lender, success |
| `save-soft` | #ECFDF5 | Savings badges and highlighted rows |
| `warn` | #B45309 | Overpayment, negotiable fees |
| `warn-soft` | #FFFBEB | Warning backgrounds |
| `risk` | #B91C1C | Junk fees |
| `risk-soft` | #FEF2F2 | Junk fee backgrounds |

Rules:
- Emerald only for money the user keeps. Amber or red only for money the user loses.
- Primary actions are navy (`bg-ink text-white`). One primary action per screen.
- Dark mode is out of scope for the MVP.

## Typography

- Font: Geist (Google Fonts), fallback `ui-sans-serif, system-ui`.
- Every number uses `tabular-nums` so columns line up.
- Scale: hero 40/48 (mobile 30/36) semibold, tight tracking; section title 24/32 semibold; card title 16/24 semibold; body 15/24; caption 13/18 `text-muted`.
- Big savings figures: 36–48 px semibold in `text-save`.

## Spacing and layout

- 4 px base. Common steps: 8, 12, 16, 24, 32, 48, 64.
- Content width `max-w-5xl`, quiz `max-w-xl`, side gutter 16 px on mobile, 24 px from `sm`.
- Cards: `rounded-xl border border-line bg-surface p-5 sm:p-6`. No drop shadows except the floating CTA (`shadow-lg`).
- Inputs and buttons: 44 px minimum height, `rounded-lg`.

## Components

- **Button**: primary `bg-ink text-white hover:bg-ink-soft`; secondary `border border-line bg-surface text-ink hover:bg-canvas`; text link `text-ink underline underline-offset-4`.
- **Choice card** (quiz goals, offer question): bordered card; selected state `border-ink ring-1 ring-ink`.
- **Pill** (credit tier): rounded-full, same selected state as choice cards.
- **Badge**: `rounded-full px-2.5 py-0.5 text-xs font-medium`, color pairs from the table above.
- **Data table**: header row `text-xs uppercase tracking-wide text-muted`; best row `bg-save-soft`; bank row first and labeled.
- **Sample labels**: every simulated lender list shows "Sample lender profiles" and every sample input shows "Sample data" as a muted caption.

## Motion

Only functional motion: progress bar width, the 1.5 s scanning bar, and button loading states. Respect `prefers-reduced-motion`.

## Voice

Direct and specific, written for working adults 25–45. Use numbers instead of adjectives. Never promise approval or a rate; say "estimate".
