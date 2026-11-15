# Lendro

Check your bank's loan offer before you sign.

Lendro compares a mortgage, car loan or installment offer with other lenders, shows what the difference costs over the life of the loan, flags the fees you can push back on, and writes the email that asks your bank to match.

**Live:** https://lendro-app.vercel.app

## What it does

- **Offer check.** Four questions: location, loan type and amount, credit range, and your bank's rate. No account, no ID number, no credit check.
- **Audit.** Your offer next to the best matched lender profiles: rate, fees, monthly payment and lifetime cost.
- **Fee scanner.** Upload your offer document (Loan Estimate in the US, ESIS or SECCI form in Europe, mortgage illustration in the UK). Each fee is marked as junk, negotiable or standard.
- **Negotiation email.** A ready-to-send email with your numbers, your local rate term and the fees to remove.
- **Loan plan and Rate Watch.** A step-by-step closing plan for your region, saved in your browser, and your saved offer tracked against the market.

Markets: five US states, Germany, France, Spain, Italy, the Netherlands, Ireland and the United Kingdom, with local currency, rate terms (APR or APRC) and documents.

## How it works

All rates, payments, fees and savings are calculated in code from your inputs. The AI model only reads the uploaded document and lists its fees. Lender profiles are sample data for comparison, not live quotes.

Uploaded files are analyzed and not stored. Quiz answers and your plan stay in your browser. See the [privacy page](https://lendro-app.vercel.app/privacy.html).

## Run locally

```bash
npm install
npm run dev
```

To use the live fee scanner, create a `.env` file with `GEMINI_API_KEY=your-key`. Without a key the scanner shows a sample result.

`npm test` runs the finance tests.

## Built with

React, TypeScript, Vite, Tailwind CSS, Gemini API, Vercel.

## Disclaimer

Lendro is an educational and analytical tool, not a licensed mortgage broker, credit intermediary, lender or financial advisor.

## License

MIT
