import { describe, expect, it } from 'vitest';
import { getCasalpoglioSide } from './casalpoglioTeam';

describe('riconoscimento della squadra Casalpoglio', () => {
  it.each([
    'Casalpoglio',
    'Polisportiva Casalpoglio',
    ' POL. CASALPOGLIO ',
    'A.S.D. Polisportiva Casalpoglio',
    'Casal Poglio',
    'Casalpóglio',
    'Polisportiva Casalpoglo',
    'Polisportiva Casalpolgio',
  ])('riconosce %s sia in casa sia in trasferta', (name) => {
    expect(getCasalpoglioSide(name, 'Castelletto')).toBe('home');
    expect(getCasalpoglioSide('Castelletto', name)).toBe('away');
  });

  it('sceglie il nome più simile anche con un avversario dal nome simile', () => {
    expect(getCasalpoglioSide('Casalpusterlengo', 'Polisportiva Casalpoglo')).toBe('away');
    expect(getCasalpoglioSide('Casaloldo', 'Casalpolgio')).toBe('away');
  });

  it('gestisce i campi vuoti e risolve le parità in modo stabile', () => {
    expect(getCasalpoglioSide('', ' ')).toBeNull();
    expect(getCasalpoglioSide('', 'Casalpoglio')).toBe('away');
    expect(getCasalpoglioSide('Casalpoglio', '')).toBe('home');
    expect(getCasalpoglioSide('Polisportiva Casalpoglio', 'Casalpoglio')).toBe('home');
  });
});
