// Index is the color code the solver works with; 0 means "empty".
// Tuned to stay vivid against the warm off-white board.
export const COLORS = [
  null,
  { name: 'Red', hex: '#ec3b2f' },
  { name: 'Yellow', hex: '#f5b700' },
  { name: 'Blue', hex: '#2563ff' },
  { name: 'Green', hex: '#13a85a' },
  { name: 'Orange', hex: '#ff7a1a' },
  { name: 'Cyan', hex: '#00b2c9' },
  { name: 'Pink', hex: '#ff4fa3' },
  { name: 'Lime', hex: '#86c400' },
  { name: 'Violet', hex: '#8b5cf6' },
];

export const COLOR_CODES = COLORS.map((_, code) => code).filter(Boolean);
