# Lendro

Compare your bank's mortgage, car loan or installment offer with matched lenders in the United States, the eurozone and the United Kingdom.

Live: https://lendro-app.vercel.app

## Run it

```bash
npm install
npm run dev
```

`npm test` runs the finance tests. To use the live fee scanner locally, copy `.env.example` to `.env` and set `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`). Without a key the scanner returns a simulated result.

## Key dependencies

- Gemini API (`gemini-3.5-flash-lite`) reads uploaded loan documents and flags fees. Claude API is supported as an alternative. Totals and the negotiation email are calculated in code.
- Vercel hosts the site and the `api/scan` function.
- Vite, React, TypeScript, Tailwind CSS, Vitest.
