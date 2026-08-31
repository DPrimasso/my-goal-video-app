import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import RisultatoFinale from './RisultatoFinale';

const clearSavedResult = () => {
  document.cookie = 'savedFinalResult=;max-age=0;path=/';
};

describe('persistenza del risultato finale', () => {
  beforeEach(clearSavedResult);
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
});
