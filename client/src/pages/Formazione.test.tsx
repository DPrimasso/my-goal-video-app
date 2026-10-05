import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { players } from '../catalog';
import * as environment from '../config/environment';
import { requestGeneratedImage } from '../services/imageApi';
import Formazione from './Formazione';

vi.mock('../services/imageApi', () => ({ requestGeneratedImage: vi.fn() }));

const clearSavedLineup = () => {
  document.cookie = 'savedFormation=;max-age=0;path=/';
};

const saveCompleteLineup = () => {
  const saved = {
    players: players.slice(0, 11).map((player, index) => ({ playerId: player.id, number: index + 1, isCaptain: false })),
    opponentTeam: 'Amatori Club',
  };
  document.cookie = `savedFormation=${encodeURIComponent(JSON.stringify(saved))};path=/`;
};

describe('modifica dei numeri nella formazione', () => {
  beforeEach(() => {
    clearSavedLineup();
    vi.clearAllMocks();
    vi.spyOn(environment, 'getEndpoint').mockReturnValue('https://example.test/lineup');
    vi.mocked(requestGeneratedImage).mockResolvedValue('');
  });

  afterEach(() => {
    cleanup();
    clearSavedLineup();
    vi.restoreAllMocks();
  });

  it('lascia il campo vuoto con Backspace e permette di riscrivere il numero', async () => {
    const user = userEvent.setup();
    render(<Formazione />);
    const number = screen.getAllByRole('spinbutton')[0];

    expect(number).toHaveValue(1);
    await user.click(number);
    await user.keyboard('{Backspace}');
    expect(number).toHaveValue(null);

    await user.type(number, '27');
    expect(number).toHaveValue(27);
    await user.keyboard('{Backspace}');
    expect(number).toHaveValue(2);
    await user.keyboard('{Backspace}');
    expect(number).toHaveValue(null);
    await user.type(number, '9');
    expect(number).toHaveValue(9);
  });

  it('mantiene il numero vuoto anche uscendo dal campo e riaprendo la formazione', async () => {
    const user = userEvent.setup();
    const firstRender = render(<Formazione />);
    await user.clear(screen.getAllByRole('spinbutton')[0]);
    await user.tab();
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(null);

    firstRender.unmount();
    render(<Formazione />);
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(null);

    await user.type(screen.getAllByRole('spinbutton')[0], '99');
    cleanup();
    render(<Formazione />);
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(99);
  });

  it.each(['', '0', '100', '1.5'])('blocca la generazione con il numero non valido "%s" senza sostituirlo', async (value) => {
    const user = userEvent.setup();
    saveCompleteLineup();
    render(<Formazione />);
    const number = screen.getAllByRole('spinbutton')[0];
    await user.clear(number);
    if (value) await user.type(number, value);
    await user.click(screen.getByRole('button', { name: /Genera formazione/ }));

    expect(screen.getByRole('alert')).toHaveTextContent('Inserisci un numero maglia intero da 1 a 99 per il giocatore 1.');
    expect(number).toHaveValue(value ? Number(value) : null);
    expect(requestGeneratedImage).not.toHaveBeenCalled();
  });

  it('ripristina i vecchi numeri salvati e invia i numeri modificati come interi', async () => {
    const user = userEvent.setup();
    saveCompleteLineup();
    render(<Formazione />);
    const numbers = screen.getAllByRole('spinbutton');
    expect(numbers[0]).toHaveValue(1);
    expect(numbers[10]).toHaveValue(11);

    await user.clear(numbers[0]);
    await user.type(numbers[0], '27');
    await user.click(screen.getByRole('button', { name: /Genera formazione/ }));

    await waitFor(() => expect(requestGeneratedImage).toHaveBeenCalledWith('https://example.test/lineup', {
      players: players.slice(0, 11).map((player, index) => ({ playerId: player.id, number: index === 0 ? 27 : index + 1, isCaptain: false })),
      opponentTeam: 'Amatori Club',
    }));
  });
});
