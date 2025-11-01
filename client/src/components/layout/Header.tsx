import React from 'react';
import './Header.css';

interface HeaderProps {
  currentPage: string;
  onPageChange: (pageId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const navigationItems = [
    { id: 'formazione', label: 'Formazione', icon: '🏟️' },
    { id: 'goal', label: 'Goal', icon: '⚽' },
    { id: 'risultato-finale', label: 'Risultato Finale', icon: '🏆' },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo">
            <img 
              src="/logo_casalpoglio.png" 
              alt="Logo Casalpoglio" 
              className="logo-image"
            />
          </div>
          <h1 className="brand-title">Casalpoglio Official</h1>
        </div>
        
        <nav className="header-navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'nav-item--active' : ''}`}
              onClick={() => onPageChange(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
