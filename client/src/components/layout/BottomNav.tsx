import React from 'react';
import './BottomNav.css';

interface BottomNavProps {
  currentPage: string;
  onPageChange: (pageId: string) => void;
}

const navigationItems = [
  { id: 'formazione', label: 'Formazione', icon: '🏟️' },
  { id: 'goal', label: 'Goal', icon: '⚽' },
  { id: 'risultato-finale', label: 'Risultato', icon: '🏆' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onPageChange }) => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-content">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`bottom-nav-item ${
              currentPage === item.id ? 'bottom-nav-item--active' : ''
            }`}
            onClick={() => onPageChange(item.id)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

