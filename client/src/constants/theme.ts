export const THEME_COLORS = {
  // Colori principali
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e3a8a',
    900: '#1e40af',
    950: '#172554',
  },
  secondary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Colori di supporto
  accent: '#3b82f6',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  
  // Colori neutri
  background: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Colori del testo
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    muted: '#94a3b8',
    inverse: '#0f172a',
  },
  
  // Gradienti
  gradients: {
    primary: 'linear-gradient(135deg, #1e3a8a, #dc2626)',
    blue: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    red: 'linear-gradient(135deg, #dc2626, #ef4444)',
    surface: 'linear-gradient(135deg, #1e293b, #334155)',
  },
  
  // Ombre
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    primary: '0 4px 15px rgba(30, 58, 138, 0.3)',
    secondary: '0 4px 15px rgba(220, 38, 38, 0.3)',
  },
  
  // Bordi
  borders: {
    light: 'rgba(30, 58, 138, 0.2)',
    medium: 'rgba(30, 58, 138, 0.3)',
    strong: 'rgba(30, 58, 138, 0.5)',
    error: 'rgba(220, 38, 38, 0.3)',
  },
  
  // Backgrounds
  backgrounds: {
    primary: 'rgba(30, 58, 138, 0.1)',
    secondary: 'rgba(220, 38, 38, 0.1)',
    surface: 'rgba(30, 58, 138, 0.05)',
    overlay: 'rgba(15, 23, 42, 0.95)',
  },
};

export const THEME_SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const THEME_BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const THEME_FONTS = {
  family: {
    base: 'Roboto, sans-serif',
    heading: 'Roboto, sans-serif',
    mono: 'source-code-pro, Menlo, Monaco, Consolas, Courier New, monospace',
  },
  size: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

export const THEME_BREAKPOINTS = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
