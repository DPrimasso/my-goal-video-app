import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Genera Video button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Genera Video/i);
  expect(buttonElement).toBeInTheDocument();
});
