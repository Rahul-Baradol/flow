import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Backdrop from '../components/Backdrop';
import FlowBoard from '../components/FlowBoard';
import { COLORS, COLOR_CODES } from '../colors';
import { SOLVERS, solverById } from '../solvers';
import { CONNECT, EXTEND, PRUNE, RETRACT } from '../solvers/trace';
import { createSearchReplay } from '../search';
import { SIZES } from '../sizes';
import { PUZZLES, parsePuzzle } from '../puzzles';
import { generatePuzzle } from '../generate';

const DRAW_DELAY = 70;

// Playback speeds for the search replay: wait `delay` ms, then advance `batch` events.
const SPEEDS = [
  { label: '1×', delay: 160, batch: 1 },
  { label: '4×', delay: 40, batch: 1 },
  { label: '16×', delay: 20, batch: 2 },
  { label: '128×', delay: 16, batch: 13 },
];

const HINT = { tone: 'idle', text: 'Pick a color, then tap two cells to place its dots.' };
const SOLVED = { tone: 'success', text: 'Solved. Tap any cell to edit, or clear to start over.' };
const solvedStatus = (solution) =>
  solution.truncated
    ? {
        tone: 'success',
        text: `Solved. The replay stops after ${solution.trace.length.toLocaleString()} steps, where the search was still going, so the last step jumps to the answer.`,
      }
    : SOLVED;
const TONES = {
  idle: 'text-muted',
  info: 'text-ink',
  success: 'text-ink font-semibold',
  warning: 'text-ink font-semibold',
};
const MARKS = { success: '✓', warning: '!' };

const emptyPairs = () => COLORS.map(() => []);

// `npm run test <size>x<size>` sets this, so each board opens with its test puzzle placed.
const TEST_PUZZLES = import.meta.env.VITE_TEST_PUZZLES === 'true';
const LOADED = { tone: 'idle', text: 'Test puzzle loaded. Hit Solve to run it.' };
const GENERATED = { tone: 'idle', text: 'Fresh puzzle placed. Hit Solve, or tap dots to tweak it.' };
const pad = (n, width) => String(n).padStart(width, '0');

const tactile =
  'cursor-pointer rounded-full border-2 border-ink font-mono text-xs font-medium tracking-widest uppercase transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40';
const raised =
  'bg-card text-ink shadow-[3px_3px_0_0_var(--color-ink)] not-disabled:hover:-translate-x-px not-disabled:hover:-translate-y-px not-disabled:hover:shadow-[4px_4px_0_0_var(--color-ink)] not-disabled:active:translate-x-[3px] not-disabled:active:translate-y-[3px] not-disabled:active:shadow-none';

function Icon({ d }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

// Section heading for the side panel; only shown once the panel sits beside the board.
function Label({ children }) {
  return (
    <span className="hidden font-mono text-[11px] tracking-widest text-muted uppercase lg:block">{children}</span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-base text-ink tabular-nums">{value}</span>
      <span className="font-mono text-[10px] tracking-widest text-muted uppercase">{label}</span>
    </div>
  );
}

const where = (id, size) => `row ${Math.floor(id / size) + 1}, column ${(id % size) + 1}`;

function describeStep({ type, color, id }, solution, size) {
  const name = COLORS[color].name;
  const [, end] = solution.ends[color];
  switch (type) {
    case EXTEND:
      return `${name} tries ${where(id, size)}.`;
    case RETRACT:
      return `${name} has nowhere left to go from ${where(id, size)}. Backtracking.`;
    case PRUNE:
      return `Dead end: ${name} at ${where(id, size)} would cut another color off. Backing out.`;
    case CONNECT:
      return `${name} reaches its dot at ${where(end, size)}.`;
    default:
      return `${name}'s path leaves no way to finish the board. Undoing it.`;
  }
}

function cursorFor(step, solution) {
  if (!step) return undefined;
  if (step.type === EXTEND) return { id: step.id, kind: 'try' };
  if (step.type === RETRACT) return { id: step.id, kind: 'undo' };
  if (step.type === PRUNE) return { id: step.id, kind: 'pruned' };
  const [, end] = solution.ends[step.color];
  return { id: end, kind: step.type === CONNECT ? 'try' : 'undo' };
}

function BoardSolver({ size }) {
  const reduceMotion = useReducedMotion();
  const [pairs, setPairs] = useState(() => (TEST_PUZZLES ? parsePuzzle(PUZZLES[size]) : emptyPairs()));
  const [selected, setSelected] = useState(() => COLOR_CODES.find((c) => pairs[c].length < 2) ?? 1);
  const [solution, setSolution] = useState(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('edit'); // edit | solving | drawing | paused | solved
  const [status, setStatus] = useState(TEST_PUZZLES ? LOADED : HINT);
  const [stepMode, setStepMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [solverId, setSolverId] = useState(SOLVERS[0].id);
  const [elapsed, setElapsed] = useState(0);
  const workerRef = useRef(null);
  const solver = solverById(solverId);

  const busy = phase === 'solving' || phase === 'drawing';
  const playing = phase === 'drawing';
  const celebrate = phase === 'solved' && !reduceMotion;
  // Step mode walks the whole search; otherwise only the final paths are drawn.
  const total = solution ? (stepMode ? solution.trace : solution.order).length : 0;
  const replay = useMemo(() => solution && createSearchReplay(solution), [solution]);

  const dots = Array(size * size).fill(0);
  pairs.forEach((ids, code) => ids.forEach((id) => (dots[id] = code)));

  useEffect(() => {
    if (!solution || (phase !== 'drawing' && phase !== 'paused')) return;
    if (step >= total) {
      setPhase('solved');
      setStatus(solvedStatus(solution));
      return;
    }
    if (phase !== 'drawing') return;
    const { delay, batch } = stepMode ? SPEEDS[speed] : { delay: DRAW_DELAY, batch: 1 };
    const timer = setTimeout(() => setStep((s) => Math.min(total, s + batch)), delay);
    return () => clearTimeout(timer);
  }, [phase, step, solution, total, stepMode, speed]);

  // Tick a clock while a slow search runs, and stop any search still running on unmount.
  useEffect(() => {
    if (phase !== 'solving') return;
    const started = performance.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(performance.now() - started), 100);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (!stepMode || !solution) return;
    function onKey(e) {
      if (e.target instanceof HTMLInputElement) return;
      const jump = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowRight') goTo(step + jump);
      else if (e.key === 'ArrowLeft') goTo(step - jump);
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const paths = [];
  const tint = [];
  let cursor;
  let counts;
  let search;
  if (solution && stepMode) {
    search = replay.at(step);
    counts = search.counts;
    if (phase !== 'solved') cursor = cursorFor(search.last, solution);
    solution.ends.forEach(([start, end], code) => {
      const stack = search.stacks[code];
      const ids = [start, ...stack, ...(search.connected[code] ? [end] : [])];
      if (ids.length > 1) ids.forEach((id) => (tint[id] = code));
      paths.push({ code, ids });
    });
  } else if (solution) {
    // Each color's pipe is drawn in full and revealed with pathLength, so it grows smoothly.
    const revealed = solution.order.slice(0, step);
    solution.ends.forEach(([start, end], code) => {
      const route = solution.order.filter((cell) => cell.color === code).map((cell) => cell.id);
      const shown = revealed.filter((cell) => cell.color === code).map((cell) => cell.id);
      shown.forEach((id) => (tint[id] = code));
      tint[start] = tint[end] = code;
      const drawn = shown.length + (shown.length === route.length ? 1 : 0);
      paths.push({ code, ids: [start, ...route, end], progress: drawn / (route.length + 1) });
    });
  }

  let shownStatus = status;
  if (stepMode && solution && (phase === 'paused' || phase === 'drawing')) {
    shownStatus = {
      tone: 'info',
      text:
        step === 0
          ? `${solver.name} found a solution in ${solution.ms} ms after ${total.toLocaleString()} search steps. Step through them, dead ends and backtracking included, or press play.`
          : describeStep(search.last, solution, size),
    };
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

    setSolution(null);
    setStep(0);
    setPhase('solving');
    setStatus({ tone: 'info', text: `Solving with ${solver.name}…` });

    // A brute-force search can run for a long time, so it runs in a worker that Cancel can stop.
    const worker = new Worker(new URL('../solveWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onerror = (e) => {
      stopWorker();
      setPhase('edit');
      setStatus({ tone: 'warning', text: `The solver crashed: ${e.message || 'unknown error'}.` });
    };
    worker.onmessage = ({ data: result }) => {
      stopWorker();
      const { ms } = result;

      if (!result.solved) {
        setPhase('edit');
        setStatus({
          tone: 'warning',
          text: 'No solution fills every cell with these dots. Double-check their positions.',
        });
        return;
      }

      setSolution(result);
      setPhase(stepMode ? 'paused' : 'drawing');
      setStatus({ tone: 'info', text: `${solver.name} found a solution in ${ms} ms. Drawing the pipes…` });
    };
    worker.postMessage({ solver: solverId, size, pairs });
  }

  function stopWorker() {
    workerRef.current?.terminate();
    workerRef.current = null;
  }

  function onCancel() {
    stopWorker();
    setPhase('edit');
    setStatus({ tone: 'idle', text: `Stopped ${solver.name}. Try another solver, or move some dots.` });
  }

  function onPickSolver(id) {
    setSolverId(id);
    if (solution) {
      setSolution(null);
      setStep(0);
      setPhase('edit');
    }
    setStatus({ tone: 'idle', text: `${solverById(id).name} is ready. Hit Solve to run it.` });
  }

  function onClear() {
    setPairs(emptyPairs());
    setSolution(null);
    setStep(0);
    setPhase('edit');
    setSelected(1);
    setStatus(HINT);
  }

  function onGenerate() {
    setPairs(generatePuzzle(size));
    setSolution(null);
    setStep(0);
    setPhase('edit');
    setStatus(GENERATED);
  }

  function goTo(target) {
    if (!solution) return;
    setStep(Math.max(0, Math.min(total, target)));
    setPhase('paused');
  }

  function onPlayPause() {
    if (playing) {
      setPhase('paused');
      return;
    }
    if (step >= total) setStep(0);
    setPhase('drawing');
  }

  // The two modes replay different things, so switching restarts the replay.
  function onToggleStepMode() {
    setStepMode(!stepMode);
    if (!solution) return;
    setStep(0);
    setPhase(stepMode ? 'drawing' : 'paused');
  }

  const digits = String(total).length;

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 pt-4 pb-12 lg:max-w-6xl lg:flex-row lg:items-start lg:justify-center lg:gap-14 lg:px-8 lg:pt-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: celebrate ? [0, -1.2, 0.9, 0] : 0,
          scale: celebrate ? [1, 1.025, 1] : 1,
        }}
        transition={{
          default: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          rotate: { duration: 0.6, ease: 'easeInOut', delay: 0.1 },
          scale: { duration: 0.6, ease: 'easeOut', delay: 0.1 },
        }}
        className="order-2 w-[min(100%,58dvh)] shrink-0 rounded-2xl border-2 border-ink bg-card p-2.5 shadow-[6px_6px_0_0_var(--color-ink)] lg:order-0 lg:w-[min(640px,calc(100dvh-9rem))] lg:p-3"
      >
        <FlowBoard
          size={size}
          dots={dots}
          paths={paths}
          tint={tint}
          celebrate={celebrate}
          cursor={cursor}
          onCellClick={onCellClick}
          disabled={busy}
        />
      </motion.div>

      {/* Below lg the panel dissolves into the page column; `order` slots its parts around the board. */}
      <aside className="contents lg:sticky lg:top-8 lg:flex lg:w-88 lg:shrink-0 lg:flex-col lg:gap-8">
        <p
          aria-live={playing ? 'off' : 'polite'}
          className={`order-1 flex min-h-12 max-w-sm items-start justify-center gap-2 text-center text-sm leading-relaxed lg:min-h-18 lg:max-w-none lg:justify-start lg:text-left lg:text-base ${TONES[shownStatus.tone]}`}
        >
          {MARKS[shownStatus.tone] && (
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[10px] leading-none text-paper lg:mt-1"
            >
              {MARKS[shownStatus.tone]}
            </span>
          )}
          <span>{shownStatus.text}</span>
        </p>

        <div className="order-4 flex flex-col items-center gap-3 lg:items-start">
          <Label>Dot color</Label>
          <div role="radiogroup" aria-label="Dot color" className="flex flex-wrap justify-center gap-2.5 lg:justify-start">
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
                  className="flex cursor-pointer flex-col items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <motion.span
                    className="block h-7 w-7 rounded-full"
                    animate={{ scale: active ? 1.12 : 1 }}
                    whileHover={busy ? undefined : { scale: active ? 1.12 : 1.06 }}
                    whileTap={busy ? undefined : { scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    style={{
                      backgroundColor: hex,
                      boxShadow: active
                        ? '0 0 0 2.5px var(--color-paper), 0 0 0 4.5px var(--color-ink)'
                        : 'none',
                    }}
                  />
                  <span className="flex gap-1" aria-hidden="true">
                    {[0, 1].map((i) => (
                      <span
                        key={i}
                        className="block h-1 w-1 rounded-full transition-colors"
                        style={{ backgroundColor: i < count ? hex : 'var(--color-line)' }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="order-5 flex w-full max-w-sm flex-col items-center gap-3 lg:max-w-none lg:items-start">
          <Label>Solver</Label>
          <div
            role="radiogroup"
            aria-label="Solver"
            className="flex w-full gap-0.5 rounded-full border-2 border-ink bg-card p-0.5"
          >
            {SOLVERS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={s.id === solverId}
                disabled={busy}
                onClick={() => onPickSolver(s.id)}
                className={`flex-1 cursor-pointer rounded-full px-2 py-1.5 font-mono text-[11px] font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed ${
                  s.id === solverId ? 'bg-ink text-paper' : 'text-muted not-disabled:hover:text-ink disabled:opacity-40'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <p className="min-h-10 text-center text-sm leading-relaxed text-muted lg:text-left">{solver.blurb}</p>
        </div>

        <div className="order-6 flex items-center gap-3 lg:w-full lg:gap-4">
          {phase === 'solving' ? (
            <button
              type="button"
              onClick={onCancel}
              className={`${tactile} ${raised} px-8 py-3.5 tabular-nums lg:flex-1 lg:px-0`}
            >
              Cancel · {(elapsed / 1000).toFixed(1)}s
            </button>
          ) : (
            <button
              type="button"
              onClick={onSolve}
              disabled={busy}
              className={`${tactile} bg-ink px-8 py-3.5 text-paper shadow-[3px_3px_0_0_var(--color-line)] not-disabled:hover:-translate-y-0.5 not-disabled:active:translate-y-0 lg:flex-1 lg:px-0`}
            >
              Solve
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className={`${tactile} ${raised} px-6 py-3.5 lg:flex-1 lg:px-0`}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={busy}
            className={`${tactile} ${raised} px-6 py-3.5 lg:flex-1 lg:px-0`}
          >
            Random
          </button>
        </div>

        <div className="order-7 flex flex-col items-center gap-2 lg:items-start lg:border-t lg:border-line lg:pt-6">
          <button
            type="button"
            role="switch"
            aria-checked={stepMode}
            onClick={onToggleStepMode}
            disabled={phase === 'solving'}
            className="group flex cursor-pointer items-center gap-3 font-mono text-[11px] tracking-widest text-muted uppercase transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span
              className={`relative block h-5 w-9 rounded-full border-2 border-ink transition-colors duration-200 ${
                stepMode ? 'bg-ink' : 'bg-card'
              }`}
            >
              <motion.span
                className={`absolute top-0.5 left-0.5 block h-3 w-3 rounded-full ${stepMode ? 'bg-paper' : 'bg-ink'}`}
                animate={{ x: stepMode ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 30 }}
              />
            </span>
            Step-by-step
          </button>
          <p className="hidden text-sm leading-relaxed text-muted lg:block">
            Replay the whole search: every cell the solver tries, every dead end, and every backtrack.
          </p>
        </div>

        <AnimatePresence initial={false}>
          {stepMode && solution && (
            <motion.div
              key="stepper"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="order-3 w-[min(100%,58dvh)] overflow-hidden lg:order-8 lg:-mt-2 lg:w-full"
            >
              <div className="flex flex-col gap-4 px-1 pt-1 pb-1.5">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-label="Previous step"
                    onClick={() => goTo(step - 1)}
                    disabled={playing || step === 0}
                    className={`${tactile} ${raised} flex h-10 w-10 items-center justify-center`}
                  >
                    <Icon d="M15 6l-6 6 6 6" />
                  </button>
                  <span className="font-mono text-sm text-ink tabular-nums">
                    {pad(step, digits)} <span className="text-muted">/ {total}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Next step"
                      onClick={() => goTo(step + 1)}
                      disabled={playing || step >= total}
                      className={`${tactile} ${raised} flex h-10 w-10 items-center justify-center`}
                    >
                      <Icon d="M9 6l6 6-6 6" />
                    </button>
                    <button
                      type="button"
                      aria-label={playing ? 'Pause' : step >= total ? 'Replay' : 'Play'}
                      onClick={onPlayPause}
                      className={`${tactile} flex h-10 w-10 items-center justify-center bg-ink text-paper not-disabled:hover:-translate-y-0.5`}
                    >
                      <Icon
                        d={
                          playing
                            ? 'M9 6v12M15 6v12'
                            : step >= total
                              ? 'M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4'
                              : 'M8 5.5v13l10-6.5z'
                        }
                      />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={total}
                  value={step}
                  onChange={(e) => goTo(Number(e.target.value))}
                  aria-label="Search step"
                  className="h-1.5 w-full cursor-pointer accent-ink"
                />

                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                  <div className="flex gap-5">
                    <Stat label="Tries" value={counts.tries} />
                    <Stat label="Backtracks" value={counts.backtracks} />
                    {counts.pruned > 0 && <Stat label="Pruned" value={counts.pruned} />}
                  </div>
                  <div role="radiogroup" aria-label="Playback speed" className="flex gap-0.5 rounded-full border-2 border-ink bg-card p-0.5">
                    {SPEEDS.map((s, i) => (
                      <button
                        key={s.label}
                        type="button"
                        role="radio"
                        aria-checked={i === speed}
                        onClick={() => setSpeed(i)}
                        className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                          i === speed ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </main>
  );
}

export default function Board() {
  const size = Number(useParams().size);
  if (!SIZES.includes(size)) return <Navigate to="/board/5" replace />;

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-paper font-sans text-ink selection:bg-ink selection:text-paper">
      <Backdrop />

      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-6 md:px-8 lg:max-w-6xl">
        <Link
          to="/"
          className="group flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-muted uppercase transition-colors hover:text-ink"
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

        <nav aria-label="Board size" className="flex gap-0.5 rounded-full border-2 border-ink bg-card p-0.5">
          {SIZES.map((s) => (
            <Link
              key={s}
              to={`/board/${s}`}
              aria-current={s === size ? 'page' : undefined}
              aria-label={`${s} × ${s}`}
              className={`rounded-full px-2 py-1.5 font-mono text-[11px] font-medium transition-colors sm:px-3 ${
                s === size ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              {s}
              <span className="hidden sm:inline"> × {s}</span>
            </Link>
          ))}
        </nav>
      </header>

      <BoardSolver key={size} size={size} />
    </div>
  );
}
