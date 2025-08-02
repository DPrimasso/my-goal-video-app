import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Genera Video button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Genera Video/i);
  expect(buttonElement).toBeInTheDocument();
});

test('renders navigation buttons', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /Goal/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Formazione/i })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /Risultato Finale/i })
  ).toBeInTheDocument();
});
