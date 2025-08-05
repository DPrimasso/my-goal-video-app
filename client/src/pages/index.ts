import React from 'react';
import Goal from './Goal';

export interface PageConfig {
  /** Unique identifier used for navigation */
  id: string;
  /** Label shown in the navigation bar */
  label: string;
  /** React component rendered for this page */
  component: React.FC;
}

export const pages: PageConfig[] = [
  { id: 'goal', label: 'Goal', component: Goal },
];
