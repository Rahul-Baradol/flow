import { motion } from 'motion/react';
import { COLORS } from '../colors';

const center = (id, size) => [(id % size) + 0.5, Math.floor(id / size) + 0.5];

// Renders a Flow board: cell grid, the pipes between dots, and the dots on top.
//   dots   -> dots[id] = color code (0 = empty)
//   paths  -> [{ code, ids, motionProps? }] where ids run from one dot to the other
//   tint   -> tint[id] = color code of the pipe passing through that cell
export default function FlowBoard({ size, dots, paths = [], tint = [], onCellClick, disabled }) {
  const cells = Array.from({ length: size * size }, (_, id) => id);

  return (
    <div className="relative aspect-square w-full">
      <div
        className="absolute inset-0 grid overflow-hidden rounded-2xl border border-white/10"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {cells.map((id) => {
          const row = Math.floor(id / size);
          const col = id % size;
          const dot = COLORS[dots[id]];
          const pipe = COLORS[tint[id]];
          const label = `Row ${row + 1}, column ${col + 1}${dot ? `, ${dot.name} dot` : ''}`;

          return onCellClick ? (
            <button
              key={id}
              type="button"
              aria-label={label}
              disabled={disabled}
              onClick={() => onCellClick(id)}
              className="border-r border-b border-white/6 transition-colors duration-200 not-disabled:cursor-pointer not-disabled:hover:bg-white/6 focus-visible:relative focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-sky-400"
              style={pipe ? { backgroundColor: `${pipe.hex}1f` } : undefined}
            />
          ) : (
            <div
              key={id}
              className="border-r border-b border-white/6"
              style={pipe ? { backgroundColor: `${pipe.hex}1f` } : undefined}
            />
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        aria-hidden="true"
      >
        {paths.map(({ code, ids, motionProps }) =>
          ids.length > 1 ? (
            <motion.polyline
              key={code}
              points={ids.map((id) => center(id, size).join(',')).join(' ')}
              fill="none"
              stroke={COLORS[code].hex}
              strokeWidth={0.34}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...motionProps}
            />
          ) : null
        )}

        {dots.map((code, id) => {
          if (!code) return null;
          const [cx, cy] = center(id, size);
          return (
            <motion.circle
              key={`${id}-${code}`}
              cx={cx}
              cy={cy}
              r={0.32}
              fill={COLORS[code].hex}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            />
          );
        })}
      </svg>
    </div>
  );
}
