export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <p className="mx-auto max-w-4xl px-4 py-8 text-center text-xs leading-relaxed text-slate-500 sm:px-6">
        Lendro is an AI-powered educational and analytical tool, not a licensed mortgage broker, credit intermediary,
        lender, or registered financial advisor. All rates, fees, and savings figures shown are dynamic MVP estimates calculated from user
        inputs for educational and informational purposes only.{' '}
        <a href="/privacy.html" className="font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900">
          Privacy
        </a>
      </p>
    </footer>
  );
}
