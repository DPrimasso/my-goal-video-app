import React from 'react';
import './App.css';
import { pages } from './pages';

function App() {
  const scrollToPage = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
  };

  return (
    <div className="App">
      <nav className="navbar">
        {pages.map(({ id, label }) => (
          <button
            key={id}
            className="nav-link"
            onClick={() => scrollToPage(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="pages-container">
        {pages.map(({ id, component: Page }) => (
          <section key={id} className="page" id={id}>
            <Page />
          </section>
        ))}
      </div>
    </div>
  );
}

export default App;
