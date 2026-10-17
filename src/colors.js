// Index is the color code the solver works with; 0 means "empty".
export const COLORS = [
  null,
  { name: 'Red', hex: '#ef4444' },
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Cyan', hex: '#22d3ee' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Lime', hex: '#a3e635' },
  { name: 'Violet', hex: '#a78bfa' },
];

export const COLOR_CODES = COLORS.map((_, code) => code).filter(Boolean);
