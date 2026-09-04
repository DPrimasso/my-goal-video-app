import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('navigazione e accessibilità', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(cleanup);

  it('espone nomi accessibili per tutti gli undici selettori della formazione', () => {
    render(<App />);
    for (let index = 1; index <= 11; index += 1) {
      expect(screen.getByRole('combobox', { name: `Giocatore ${index}` })).toBeInTheDocument();
    }
  });

  it('passa al flusso Goal senza ricaricare la pagina', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: /goal/i })[0]);
    expect(screen.getByRole('heading', { name: 'Goal' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Giocatore' })).toBeInTheDocument();
  });

  it('mantiene la pagina corrente dopo un refresh', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(screen.getAllByRole('button', { name: /risultato/i })[0]);
    expect(screen.getByRole('heading', { name: /risultato finale/i })).toBeInTheDocument();

    unmount();
    render(<App />);

    expect(screen.getByRole('heading', { name: /risultato finale/i })).toBeInTheDocument();
  });

  it('ignora una pagina salvata non valida', () => {
    sessionStorage.setItem('casalpoglio.currentPage', 'pagina-inesistente');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Starting XI' })).toBeInTheDocument();
  });

  it('porta il focus al primo campo non valido del Goal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: /goal/i })[0]);
    await user.click(screen.getByRole('button', { name: /genera goal/i }));

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Giocatore' })).toHaveFocus());
  });
});
