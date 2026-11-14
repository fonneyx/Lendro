import type { ReactNode } from 'react';

interface EmailCardProps {
  label: string;
  subject: string;
  sentAt: string;
  children: ReactNode;
}

export default function EmailCard({ label, subject, sentAt, children }: EmailCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      <header className="border-b border-line bg-canvas px-5 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 font-semibold">{subject}</p>
        <p className="mt-0.5 text-xs text-muted">From Lendro · {sentAt}</p>
      </header>
      <div className="space-y-3 px-5 py-4 text-sm leading-6 text-ink-soft">{children}</div>
    </article>
  );
}
