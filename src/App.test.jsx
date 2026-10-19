import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { SIZES } from './sizes';

test('landing page links straight to each board size', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /learn to\s*flow/i })).toBeInTheDocument();

  for (const size of SIZES) {
    const link = screen.getByRole('link', { name: new RegExp(`${size} × ${size}`) });
    expect(link).toHaveAttribute('href', `/board/${size}`);
  }
});
