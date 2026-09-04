import React, { useState } from 'react';
import { Header, BottomNav } from './components/layout';
import { pages } from './pages';
import { getConfigurationErrors } from './config/environment';
import './App.css';

const DEFAULT_PAGE = 'formazione';
const CURRENT_PAGE_STORAGE_KEY = 'casalpoglio.currentPage';

const isKnownPage = (pageId: string | null): pageId is string =>
  pageId !== null && pages.some((page) => page.id === pageId);

const getInitialPage = () => {
  try {
    const savedPage = window.sessionStorage.getItem(CURRENT_PAGE_STORAGE_KEY);
    return isKnownPage(savedPage) ? savedPage : DEFAULT_PAGE;
  } catch {
    return DEFAULT_PAGE;
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const configurationErrors = getConfigurationErrors();

  const handlePageChange = (pageId: string) => {
    if (!isKnownPage(pageId)) return;

    setCurrentPage(pageId);
    try {
      window.sessionStorage.setItem(CURRENT_PAGE_STORAGE_KEY, pageId);
    } catch {
      // La navigazione continua a funzionare anche se lo storage è disabilitato.
    }
  };

  const renderCurrentPage = () => {
    const page = pages.find(p => p.id === currentPage);
    if (!page) return null;

    switch (page.id) {
      case 'goal':
        return <page.component />;
      case 'formazione':
        return <page.component />;
      case 'risultato-finale':
        return <page.component />;
      default:
        return <page.component />;
    }
  };

  return (
    <div className="App">
      <Header currentPage={currentPage} onPageChange={handlePageChange} />
      
      <main className="main-content">
        {configurationErrors.length > 0 && (
          <div className="configuration-warning" role="alert">
            <strong>Configurazione incompleta.</strong> {configurationErrors.join(' · ')}
          </div>
        )}
        {renderCurrentPage()}
      </main>

      <BottomNav currentPage={currentPage} onPageChange={handlePageChange} />
    </div>
  );
}

export default App;
