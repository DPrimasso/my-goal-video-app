import React, { useState } from 'react';
import { Header } from './components/layout';
import { pages } from './pages';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('goal');

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId);
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
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
