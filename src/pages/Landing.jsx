import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import Backdrop from '../components/Backdrop';
import SocialBar from '../components/SocialBar';
import FlowBoard from '../components/FlowBoard';

const SIZES = [4, 5, 6];

const STEPS = [
  'Pick a board size.',
  'Tap two cells for each color to drop its dots, just like the level in the game.',
  'Hit Solve.',
  'An algorithm runs on your device to figure out the solution quick!'
];

// A solved 5 x 5 level for the preview: each path runs dot to dot.
const DEMO_SIZE = 5;
const DEMO_PATHS = [
  { code: 1, ids: [0, 1, 2, 7, 12] },
  { code: 4, ids: [3, 4, 9, 14, 19] },
  { code: 2, ids: [8, 13, 18, 23, 24] },
  { code: 3, ids: [6, 5, 10, 15, 20, 21] },
  { code: 5, ids: [11, 16, 17, 22] },
];

const DEMO_DOTS = Array(DEMO_SIZE * DEMO_SIZE).fill(0);
const DEMO_TINT = Array(DEMO_SIZE * DEMO_SIZE).fill(0);
DEMO_PATHS.forEach(({ code, ids }) => {
  DEMO_DOTS[ids[0]] = code;
  DEMO_DOTS[ids[ids.length - 1]] = code;
  ids.forEach((id) => (DEMO_TINT[id] = code));
});

const CYCLE = 7;

function demoMotion(index) {
  const start = (0.6 + index * 0.7) / CYCLE;
  const end = start + 0.7 / CYCLE;
  return {
    initial: { pathLength: 0 },
    animate: { pathLength: [0, 0, 1, 1, 0, 0] },
    transition: {
      duration: CYCLE,
      times: [0, start, end, 0.86, 0.94, 1],
      ease: 'easeInOut',
      repeat: Infinity,
    },
  };
}

function Divider({ children }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px w-8 bg-slate-700" />
      <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{children}</span>
      <div className="h-px w-8 bg-slate-700" />
    </div>
  );
}

function GridGlyph({ size }) {
  return (
    <svg viewBox="0 0 12 12" className="h-4 w-4" aria-hidden="true">
      {Array.from({ length: size * size }, (_, i) => (
        <circle
          key={i}
          cx={(12 / size) * ((i % size) + 0.5)}
          cy={(12 / size) * (Math.floor(i / size) + 0.5)}
          r={size === 4 ? 0.9 : size === 5 ? 0.75 : 0.6}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const demoPaths = DEMO_PATHS.map((path, i) => ({
    ...path,
    motionProps: reduceMotion ? undefined : demoMotion(i),
  }));

  return (
    <div className="relative flex min-h-dvh w-full items-center overflow-hidden bg-[#030712] font-sans text-slate-50 selection:bg-sky-500/30">
      <Backdrop />
      <SocialBar />

      <div className="relative z-20 w-full px-6 py-24 md:px-20 lg:ml-24 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mb-8 flex flex-col">
            <span className="mb-1 text-2xl font-light tracking-tight text-slate-400 md:text-3xl">Learn to</span>
            <span className="pb-2 text-7xl leading-[0.85] font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(56,189,248,0.25)] md:text-9xl">
              Flow
            </span>
          </h1>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-5">
              <Divider>What is it?</Divider>
              <ol className="flex max-w-md flex-col gap-3">
                {STEPS.map((step, i) => (
                  <motion.li
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 + i * 0.05 }}
                    className="flex gap-4 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="pt-0.5 text-[10px] font-bold tracking-widest text-sky-400 tabular-nums">
                      0{i + 1}
                    </span>
                    <span>{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col gap-5">
              <Divider>Choose board size</Divider>
              <div className="flex flex-wrap gap-4">
                {SIZES.map((size, i) => (
                  <motion.div
                    key={size}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 + i * 0.05 }}
                  >
                    <Link
                      to={`/board/${size}`}
                      className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] focus-visible:outline-2 focus-visible:outline-sky-400"
                    >
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 transition-colors group-hover:bg-sky-500 group-hover:text-black">
                        <GridGlyph size={size} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold tracking-wide text-slate-200 transition-colors group-hover:text-white">
                          {size} × {size}
                        </p>
                        <p className="text-[10px] text-slate-500 transition-colors group-hover:text-slate-400">
                          {size * size} cells
                        </p>
                      </div>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 -translate-x-2 text-sky-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute top-1/2 right-[8%] z-10 hidden w-[min(34vw,480px)] -translate-y-1/2 lg:block">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-3xl"
        >
          <FlowBoard size={DEMO_SIZE} dots={DEMO_DOTS} paths={demoPaths} tint={reduceMotion ? DEMO_TINT : []} />
        </motion.div>
      </div>
    </div>
  );
}
