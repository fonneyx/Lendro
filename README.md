# Lendro

Check your bank's loan offer before you sign.

Lendro compares a mortgage, car loan or installment offer with other lenders, shows what the difference costs over the life of the loan, flags the fees you can push back on, and writes the email that asks your bank to match.

**Live:** https://lendro-app.vercel.app

## Purpose

Help borrowers find out what their bank's first loan offer really costs, and give them what they need to negotiate it before they sign.

## Users

- **Home buyers** comparing a mortgage offer from their own bank with other lenders.
- **Car buyers** checking a car loan or dealer finance offer.
- **Installment borrowers** reviewing the cost and fees of a payment plan.

Lendro is built for working adults in the United States, the eurozone and the United Kingdom.

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

## Requirements

1. A borrower can complete the offer check in four steps without an account, ID number or credit check.
2. The system calculates every rate, monthly payment, fee and savings figure from the borrower's inputs.
3. A borrower can compare their offer with matched sample lender profiles.
4. A borrower can upload a PDF offer of up to 3 MB and see each fee marked as junk, negotiable or standard.
5. The system shows a labeled estimate when the AI service cannot read the document.
6. A borrower can copy a negotiation email that contains their own numbers and flagged fees.
7. A borrower can save progress on a regional loan plan in the browser and return to it later.
8. A borrower can use Rate Watch to see how a market rate change affects their saved offer.

## Documentation

- [Activity diagram: scan a loan offer](docs/analysis/activity-scan-offer.png)
- [Sequence diagram: scan a loan offer](docs/analysis/sequence-scan-offer.png)

## Built with

React, TypeScript, Vite, Tailwind CSS, Gemini API, Vercel.

## Disclaimer

Lendro is an educational and analytical tool, not a licensed mortgage broker, credit intermediary, lender or financial advisor.

## License

MIT
