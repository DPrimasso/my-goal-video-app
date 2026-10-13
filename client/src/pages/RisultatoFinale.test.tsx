import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RisultatoFinale from './RisultatoFinale';
import { requestGeneratedImage } from '../services/imageApi';

vi.mock('../services/imageApi', () => ({ requestGeneratedImage: vi.fn() }));
vi.mock('../config/environment', async (importOriginal) => ({
  ...await importOriginal<typeof import('../config/environment')>(),
  getEndpoint: () => 'https://example.com/final-result',
}));

const clearSavedResult = () => {
  document.cookie = 'savedFinalResult=;max-age=0;path=/';
};

describe('persistenza del risultato finale', () => {
  beforeEach(() => {
    clearSavedResult();
    vi.mocked(requestGeneratedImage).mockReset();
    vi.mocked(requestGeneratedImage).mockResolvedValue('https://example.com/result.png');
  });
  afterEach(() => {
    cleanup();
    clearSavedResult();
  });

  it('ripristina squadre, punteggio, marcatori e minuti', async () => {
    const user = userEvent.setup();
    const firstRender = render(<RisultatoFinale />);

    await user.type(screen.getByRole('textbox', { name: /Squadra casa/ }), 'Casalpoglio');
    await user.type(screen.getByRole('textbox', { name: /Squadra ospite/ }), 'Castelletto');
    await user.clear(screen.getByRole('spinbutton', { name: /^Casa/ }));
    await user.type(screen.getByRole('spinbutton', { name: /^Casa/ }), '2');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Marcatore del gol 1' }), 'davide_fava');
    await user.type(screen.getAllByRole('spinbutton', { name: 'Minuto' })[0], '21');

    await waitFor(() => expect(document.cookie).toContain('savedFinalResult='));
    firstRender.unmount();
    render(<RisultatoFinale />);

    expect(screen.getByRole('textbox', { name: /Squadra casa/ })).toHaveValue('Casalpoglio');
    expect(screen.getByRole('textbox', { name: /Squadra ospite/ })).toHaveValue('Castelletto');
    expect(screen.getByRole('spinbutton', { name: /^Casa/ })).toHaveValue(2);
    expect(screen.getByRole('combobox', { name: 'Marcatore del gol 1' })).toHaveValue('davide_fava');
    expect(screen.getAllByRole('spinbutton', { name: 'Minuto' })[0]).toHaveValue(21);
  });

  it.each([
    ['Polisportiva Casalpoglio', 'Castelletto', 'home'],
    ['Castelletto', 'ASD Casalpolgio', 'away'],
  ])('ripristina i marcatori e li invia sotto la squadra corretta: %s / %s', async (homeTeam, awayTeam, side) => {
    document.cookie = `savedFinalResult=${encodeURIComponent(JSON.stringify({
      homeTeam,
      awayTeam,
      score: { home: side === 'home' ? 1 : 3, away: side === 'away' ? 1 : 3 },
      scorers: [{ playerId: 'davide_fava', minute: 21 }],
    }))};path=/`;
    const user = userEvent.setup();
    render(<RisultatoFinale />);

    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: 'Marcatore del gol 1' })).toHaveValue('davide_fava');
    await user.click(screen.getByRole('button', { name: /Genera immagine/ }));
    expect(requestGeneratedImage).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      homeTeam,
      awayTeam,
      scorerLines: ["Fava 21'"],
      scorersUnder: side,
    }));
  });

  it('aggiorna il numero dei marcatori quando cambiano i nomi e il punteggio', () => {
    render(<RisultatoFinale />);
    fireEvent.change(screen.getByRole('textbox', { name: /Squadra casa/ }), { target: { value: 'Polisportiva Casalpoglo' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Squadra ospite/ }), { target: { value: 'Castelletto' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: /^Casa/ }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: /^Ospite/ }), { target: { value: '2' } });
    expect(screen.getAllByRole('combobox')).toHaveLength(1);

    fireEvent.change(screen.getByRole('textbox', { name: /Squadra ospite/ }), { target: { value: 'Casalpoglio' } });
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    fireEvent.change(screen.getByRole('spinbutton', { name: /^Ospite/ }), { target: { value: '0' } });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
