import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

const TILE = 520;
const BLUE = 'var(--color-blue-600)';
const EMERALD = 'var(--color-emerald-500)';

interface Mark {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  color: string;
  shape: ReactNode;
}

// Eight outline icons in mixed sizes, scattered with room between them. Each is drawn in a
// 24 by 24 box and scaled up; strokes keep one width at every size.
const MARKS: Mark[] = [
  {
    // money bag
    x: 44, y: 56, scale: 2.6, rotate: -8, color: EMERALD,
    shape: (
      <path d="M9 3h6l-1.5 3h-3zM10.5 6C7 8.5 5 12 5 15.5 5 19 7.5 21 12 21s7-2 7-5.5c0-3.5-2-7-5.5-9.5M14 12.2c-.4-.5-1.1-.7-2-.7-1.1 0-2 .6-2 1.4 0 1.9 4 .9 4 2.8 0 .8-.9 1.4-2 1.4-.9 0-1.6-.3-2-.8" />
    ),
  },
  {
    // coins
    x: 370, y: 48, scale: 2, rotate: 8, color: BLUE,
    shape: (
      <>
        <circle cx="9" cy="9" r="6" />
        <path d="M15.5 9.5a6 6 0 1 1-6 6" />
      </>
    ),
  },
  {
    // checkmark
    x: 312, y: 112, scale: 1.3, rotate: -6, color: EMERALD,
    shape: <path d="m5 12.5 4.5 4.5L19 7" />,
  },
  {
    // bank building
    x: 205, y: 190, scale: 3.2, rotate: -4, color: BLUE,
    shape: <path d="M3 21h18M4 10h16M12 3 3 8v2h18V8zM6 10v8M10 10v8M14 10v8M18 10v8" />,
  },
  {
    // lock
    x: 138, y: 300, scale: 1.3, rotate: 9, color: EMERALD,
    shape: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  },
  {
    // credit card
    x: 400, y: 310, scale: 2.4, rotate: -12, color: EMERALD,
    shape: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
  },
  {
    // piggy bank
    x: 56, y: 388, scale: 2.8, rotate: 6, color: BLUE,
    shape: (
      <>
        <ellipse cx="11" cy="13" rx="7" ry="5.5" />
        <path d="M7 17.5V20M15 17.5V20M18 11.5h2.5v3H18M8 8.5 7 6l3 1.5M10 9.5h3M15 11.5h.01M4 12c-1.2 0-1.5-1.5-.5-2" />
      </>
    ),
  },
  {
    // document
    x: 262, y: 424, scale: 2, rotate: 10, color: BLUE,
    shape: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" />,
  },
];

// Small accents that sit in the gaps between icons.
const DOTS = [
  { x: 214, y: 96, filled: false },
  { x: 478, y: 204, filled: true },
  { x: 28, y: 262, filled: false },
  { x: 392, y: 462, filled: true },
  { x: 176, y: 486, filled: false },
];

// A faint, seamless watermark of finance icons. Place it inside a `relative` wrapper; content
// above it needs `relative z-10`.
export default function FinancePattern({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cx('pointer-events-none absolute inset-0 z-0 size-full opacity-[0.09] dark:opacity-[0.12]', className)}
    >
      <defs>
        <pattern id={id} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <g fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {MARKS.map((m) => (
              <g
                key={`${m.x}-${m.y}`}
                stroke={m.color}
                transform={`translate(${m.x} ${m.y}) rotate(${m.rotate} ${12 * m.scale} ${12 * m.scale}) scale(${m.scale})`}
                className="*:[vector-effect:non-scaling-stroke]"
              >
                {m.shape}
              </g>
            ))}
            {DOTS.map((d) => (
              <circle
                key={`${d.x}-${d.y}`}
                cx={d.x}
                cy={d.y}
                r={d.filled ? 2.5 : 4}
                stroke={d.filled ? 'none' : EMERALD}
                fill={d.filled ? BLUE : 'none'}
              />
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${CSS.escape(id)})`} />
    </svg>
  );
}
