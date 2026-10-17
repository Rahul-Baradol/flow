import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import Backdrop from '../components/Backdrop';
import FlowBoard from '../components/FlowBoard';
import { COLORS, COLOR_CODES } from '../colors';
import { solve } from '../solver';

const SIZES = [4, 5, 6];
const DRAW_DELAY = 70;

const HINT = { tone: 'idle', text: 'Pick a color, then tap two cells to place its dots.' };
const TONES = {
  idle: 'text-slate-400',
  info: 'text-sky-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
};

const emptyPairs = () => COLORS.map(() => []);

function BoardSolver({ size }) {
  const [pairs, setPairs] = useState(emptyPairs);
  const [selected, setSelected] = useState(1);
  const [solution, setSolution] = useState(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('edit'); // edit | solving | drawing | solved
  const [status, setStatus] = useState(HINT);

  const busy = phase === 'solving' || phase === 'drawing';

  const dots = Array(size * size).fill(0);
  pairs.forEach((ids, code) => ids.forEach((id) => (dots[id] = code)));

  useEffect(() => {
    if (phase !== 'drawing') return;
    if (step >= solution.order.length) {
      setPhase('solved');
      setStatus({ tone: 'success', text: 'Solved. Tap any cell to edit, or clear to start over.' });
      return;
    }
    const timer = setTimeout(() => setStep((s) => s + 1), DRAW_DELAY);
    return () => clearTimeout(timer);
  }, [phase, step, solution]);

  const paths = [];
  const tint = [];
  if (solution) {
    const revealed = solution.order.slice(0, step);
    solution.ends.forEach(([start, end], code) => {
      const total = solution.order.filter((cell) => cell.color === code).length;
      const ids = revealed.filter((cell) => cell.color === code).map((cell) => cell.id);
      ids.forEach((id) => (tint[id] = code));
      tint[start] = tint[end] = code;
      paths.push({ code, ids: [start, ...ids, ...(ids.length === total ? [end] : [])] });
    });
  }

  function onCellClick(id) {
    if (busy) return;

    if (solution) {
      setSolution(null);
      setStep(0);
      setPhase('edit');
    }

    const code = dots[id];
    if (code) {
      setPairs((prev) => prev.map((ids, c) => (c === code ? ids.filter((x) => x !== id) : ids)));
      setSelected(code);
      setStatus({ tone: 'idle', text: `Removed a ${COLORS[code].name.toLowerCase()} dot.` });
      return;
    }

    if (pairs[selected].length >= 2) {
      setStatus({
        tone: 'warning',
        text: `${COLORS[selected].name} already has both dots. Pick another color, or tap a dot to remove it.`,
      });
      return;
    }

    const next = pairs.map((ids, c) => (c === selected ? [...ids, id] : ids));
    setPairs(next);

    if (next[selected].length === 2) {
      const after = COLOR_CODES.find((c) => c > selected && next[c].length < 2)
        ?? COLOR_CODES.find((c) => next[c].length < 2);
      if (after) setSelected(after);
      setStatus({ tone: 'idle', text: `${COLORS[selected].name} is set. Add more pairs or hit Solve.` });
    } else {
      setStatus({ tone: 'idle', text: `Now place the second ${COLORS[selected].name.toLowerCase()} dot.` });
    }
  }

  function onSolve() {
    const unpaired = COLOR_CODES.find((c) => pairs[c].length === 1);
    if (unpaired) {
      setSelected(unpaired);
      setStatus({ tone: 'warning', text: `${COLORS[unpaired].name} needs a second dot.` });
      return;
    }
    if (!COLOR_CODES.some((c) => pairs[c].length === 2)) {
      setStatus({ tone: 'warning', text: 'Place at least one pair of dots first.' });
      return;
    }

    setPhase('solving');
    setStatus({ tone: 'info', text: 'Solving…' });

    // Let the "Solving…" state paint before the search blocks the main thread.
    setTimeout(() => {
      const started = performance.now();
      const result = solve(size, pairs);
      const ms = Math.max(1, Math.round(performance.now() - started));

      if (!result.solved) {
        setPhase('edit');
        setStatus({
          tone: 'warning',
          text: 'No solution fills every cell with these dots. Double-check their positions.',
        });
        return;
      }

      setSolution(result);
      setStep(0);
      setPhase('drawing');
      setStatus({ tone: 'info', text: `Found a solution in ${ms} ms. Drawing the pipes…` });
    }, 30);
  }

  function onClear() {
    setPairs(emptyPairs());
    setSolution(null);
    setStep(0);
    setPhase('edit');
    setSelected(1);
    setStatus(HINT);
  }

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 pt-4 pb-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <p aria-live="polite" className={`min-h-12 max-w-sm text-sm leading-relaxed ${TONES[status.tone]}`}>
          {status.text}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-[min(100%,58dvh)] rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-3xl"
      >
        <FlowBoard
          size={size}
          dots={dots}
          paths={paths}
          tint={tint}
          onCellClick={onCellClick}
          disabled={busy}
        />
      </motion.div>

      <div role="radiogroup" aria-label="Dot color" className="flex flex-wrap justify-center gap-3">
        {COLOR_CODES.map((code) => {
          const { name, hex } = COLORS[code];
          const count = pairs[code].length;
          const active = code === selected;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${name}, ${count} of 2 placed`}
              disabled={busy}
              onClick={() => setSelected(code)}
              className="flex cursor-pointer flex-col items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={`block h-7 w-7 rounded-full transition-all duration-200 ${
                  active ? 'scale-110' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: hex,
                  boxShadow: active ? `0 0 0 2px #030712, 0 0 0 4px #fff, 0 0 18px ${hex}80` : undefined,
                }}
              />
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-1 w-1 rounded-full"
                    style={{ backgroundColor: i < count ? hex : 'rgba(255,255,255,0.15)' }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          onClick={onSolve}
          disabled={busy}
          whileHover={busy ? undefined : { scale: 1.05, backgroundColor: '#38bdf8' }}
          whileTap={busy ? undefined : { scale: 0.95 }}
          className="cursor-pointer rounded-full bg-white px-10 py-4 text-[11px] font-bold tracking-widest text-black uppercase transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === 'solving' ? 'Solving…' : 'Solve'}
        </motion.button>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="cursor-pointer rounded-full border border-white/15 px-8 py-4 text-[11px] font-bold tracking-widest text-slate-300 uppercase transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </main>
  );
}

export default function Board() {
  const size = Number(useParams().size);
  if (!SIZES.includes(size)) return <Navigate to="/board/5" replace />;

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#030712] font-sans text-slate-50 selection:bg-sky-500/30">
      <Backdrop />

      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-6 md:px-8">
        <Link
          to="/"
          className="group flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase transition-colors hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Back
        </Link>

        <nav aria-label="Board size" className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {SIZES.map((s) => (
            <Link
              key={s}
              to={`/board/${s}`}
              aria-current={s === size ? 'page' : undefined}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
                s === size ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s} × {s}
            </Link>
          ))}
        </nav>
      </header>

      <BoardSolver key={size} size={size} />
    </div>
  );
}
