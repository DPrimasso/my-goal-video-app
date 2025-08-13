import React from 'react';
import './PageTemplate.css';

interface PageTemplateProps {
  title: string;
  description?: string;
  icon: string;
  children: React.ReactNode;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  description,
  icon,
  children,
}) => {
  return (
    <div className="page-template">
      <div className="page-header">
        <div className="page-icon">{icon}</div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};
