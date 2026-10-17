import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop';

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#030712] px-6 font-sans text-slate-50">
      <Backdrop />
      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="mb-4 text-[10px] font-bold tracking-[0.4em] text-sky-400 uppercase">404</span>
        <h1 className="mb-6 text-5xl leading-[0.9] font-black tracking-tight md:text-7xl">
          <span className="bg-linear-to-t from-slate-500 to-white bg-clip-text text-transparent">Dead end</span>
        </h1>
        <p className="mb-10 max-w-sm text-lg font-light text-slate-400">This path doesn't connect to anything.</p>
        <Link
          to="/"
          className="rounded-full bg-white px-10 py-4 text-[11px] font-bold tracking-widest text-black uppercase transition-all duration-300 hover:bg-sky-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]"
        >
          Back to start
        </Link>
      </div>
    </div>
  );
}
