import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop';

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-paper px-6 font-sans text-ink">
      <Backdrop />
      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="mb-4 font-mono text-xs tracking-[0.3em] text-muted uppercase">404</span>
        <h1 className="mb-6 text-5xl leading-[0.9] font-extrabold tracking-tight md:text-7xl">Dead end</h1>
        <p className="mb-10 max-w-sm text-lg text-muted">This path doesn't connect to anything.</p>
        <Link
          to="/"
          className="rounded-full border-2 border-ink bg-ink px-9 py-3.5 font-mono text-xs font-medium tracking-widest text-paper uppercase shadow-[3px_3px_0_0_var(--color-line)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Back to start
        </Link>
      </div>
    </div>
  );
}
