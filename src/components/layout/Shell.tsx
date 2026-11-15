import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import Footer from './Footer';
import Navbar from './Navbar';

export default function Shell({ children, tone = 'slate' }: { children: ReactNode; tone?: 'white' | 'slate' }) {
  // Each view mounts its own Shell, so this resets the scroll position on every view change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={cx('flex min-h-screen flex-col', tone === 'slate' ? 'bg-slate-50' : 'bg-white')}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
