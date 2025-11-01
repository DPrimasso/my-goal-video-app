import React from 'react';
import Goal from './Goal';
import Formazione from './Formazione';
import RisultatoFinale from './RisultatoFinale';

export interface PageConfig {
  /** Unique identifier used for navigation */
  id: string;
  /** Label shown in the navigation bar */
  label: string;
  /** React component rendered for this page */
  component: React.FC;
}

export const pages: PageConfig[] = [
  { id: 'formazione', label: 'Formazione', component: Formazione },
  { id: 'goal', label: 'Goal', component: Goal },
  { id: 'risultato-finale', label: 'Risultato Finale', component: RisultatoFinale },
];
