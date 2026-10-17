import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

test('landing page links straight to each board size', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /learn to\s*flow/i })).toBeInTheDocument();

  for (const size of [4, 5, 6]) {
    const link = screen.getByRole('link', { name: new RegExp(`${size} × ${size}`) });
    expect(link).toHaveAttribute('href', `/board/${size}`);
  }
});
