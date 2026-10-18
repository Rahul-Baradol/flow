import { motion } from 'motion/react';
import { COLORS } from '../colors';

const STROKE = 0.34;
const DOT = 0.32;

const center = (id, size) => [(id % size) + 0.5, Math.floor(id / size) + 0.5];

// Renders a Flow board: cell grid, the pipes between dots, and the dots on top.
//   dots      -> dots[id] = color code (0 = empty)
//   paths     -> [{ code, ids, progress?, motionProps? }] where ids run from one dot to the other
//                and progress (0..1) is how much of the pipe is drawn
//   tint      -> tint[id] = color code of the pipe passing through that cell
//   celebrate -> plays the solved flourish (pipes pulse, dots pop and ripple)
//   cursor    -> { id, kind } marks the cell the search just acted on;
//                kind is 'try', 'undo' (backtrack) or 'pruned' (dead end)
export default function FlowBoard({
  size,
  dots,
  paths = [],
  tint = [],
  celebrate = false,
  cursor,
  onCellClick,
  disabled,
}) {
  const cells = Array.from({ length: size * size }, (_, id) => id);

  return (
    <div className="relative aspect-square w-full">
      <div
        className="absolute inset-0 grid gap-px overflow-hidden rounded-lg border border-line bg-line"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {cells.map((id) => {
          const row = Math.floor(id / size);
          const col = id % size;
          const dot = COLORS[dots[id]];
          const pipe = COLORS[tint[id]];
          const label = `Row ${row + 1}, column ${col + 1}${dot ? `, ${dot.name} dot` : ''}`;
          const style = pipe
            ? { backgroundColor: `color-mix(in srgb, ${pipe.hex} 16%, var(--color-card))` }
            : undefined;

          return onCellClick ? (
            <button
              key={id}
              type="button"
              aria-label={label}
              disabled={disabled}
              onClick={() => onCellClick(id)}
              className="bg-card transition-colors duration-200 not-disabled:cursor-pointer not-disabled:hover:bg-paper focus-visible:relative focus-visible:z-30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
              style={style}
            />
          ) : (
            <div key={id} className="bg-card transition-colors duration-200" style={style} />
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {paths.map(({ code, ids, progress = 1, motionProps }, i) =>
          ids.length > 1 ? (
            <motion.polyline
              key={code}
              points={ids.map((id) => center(id, size).join(',')).join(' ')}
              fill="none"
              stroke={COLORS[code].hex}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...(motionProps ?? {
                initial: { pathLength: 0 },
                animate: {
                  pathLength: progress,
                  strokeWidth: celebrate ? [STROKE, STROKE * 1.4, STROKE] : STROKE,
                },
                transition: {
                  pathLength: { duration: 0.14, ease: 'easeOut' },
                  strokeWidth: { duration: 0.5, ease: 'easeOut', delay: i * 0.06 },
                },
              })}
            />
          ) : null
        )}

        {dots.map((code, id) => {
          if (!code) return null;
          const [cx, cy] = center(id, size);
          const { hex } = COLORS[code];
          const delay = 0.15 + (code - 1) * 0.06;
          return (
            <g key={`${id}-${code}`}>
              {celebrate && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={DOT}
                  fill="none"
                  stroke={hex}
                  strokeWidth={0.05}
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay }}
                />
              )}
              <motion.circle
                cx={cx}
                cy={cy}
                r={DOT}
                fill={hex}
                initial={{ scale: 0 }}
                animate={{ scale: celebrate ? [1, 1.35, 1] : 1 }}
                transition={
                  celebrate
                    ? { duration: 0.45, ease: 'easeOut', delay }
                    : { type: 'spring', stiffness: 500, damping: 28 }
                }
              />
            </g>
          );
        })}

        {cursor && <Cursor key="cursor" {...cursor} size={size} />}
      </svg>
    </div>
  );
}

const CURSOR = 0.86;

function Cursor({ id, kind, size }) {
  const [cx, cy] = center(id, size);
  const solid = kind === 'try';
  return (
    <motion.g
      initial={false}
      animate={{ x: cx - CURSOR / 2, y: cy - CURSOR / 2 }}
      transition={{ type: 'spring', stiffness: 700, damping: 40 }}
      style={{ stroke: 'var(--color-ink)' }}
      fill="none"
      strokeWidth={0.045}
      strokeLinecap="round"
    >
      <rect width={CURSOR} height={CURSOR} rx={0.14} strokeDasharray={solid ? undefined : '0.1 0.08'} />
      {kind === 'pruned' && (
        <path
          d={`M${CURSOR / 2 - 0.1} ${CURSOR / 2 - 0.1}l0.2 0.2m0 -0.2l-0.2 0.2`}
          strokeWidth={0.06}
        />
      )}
    </motion.g>
  );
}
