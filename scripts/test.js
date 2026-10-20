import { spawn } from 'node:child_process';
import { SIZES } from '../src/sizes.js';

// `npm run test 4x4` starts the dev server with the test puzzles on and opens the 4 x 4 board.
const arg = process.argv[2] ?? '';
const match = arg.match(/^(\d)x(\d)$/);
const size = match && match[1] === match[2] ? Number(match[1]) : null;

if (!SIZES.includes(size)) {
  const options = SIZES.map((s) => `${s}x${s}`).join(', ');
  console.error(`Usage: npm run test <size>, where <size> is one of ${options}`);
  process.exit(1);
}

const vite = spawn('vite', ['--open', `/board/${size}`], {
  stdio: 'inherit',
  env: { ...process.env, VITE_TEST_PUZZLES: 'true' },
});
vite.on('exit', (code) => process.exit(code ?? 0));
