import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders download button', () => {
  render(<App />);
  expect(
    screen.getByRole('button', {name: /Scarica il video/i})
  ).toBeInTheDocument();
});

test('renders Goal navigation button', () => {
  render(<App />);
  expect(screen.getByRole('button', {name: /Goal/i})).toBeInTheDocument();
});
