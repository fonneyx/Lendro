import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-600 text-on-accent shadow-lg shadow-blue-600/25 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/30',
  secondary: 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  dark: 'bg-slate-900 text-slate-50 shadow-sm hover:bg-slate-800',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-14 px-7 text-base rounded-2xl',
  xl: 'h-16 px-9 text-lg rounded-2xl sm:h-[4.5rem] sm:px-11 sm:text-xl',
};

export default function Button({ variant = 'primary', size = 'md', block, className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2.5 font-semibold transition duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    />
  );
}
