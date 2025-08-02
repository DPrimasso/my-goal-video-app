import React from 'react';
import './App.css';
import { pages } from './pages';

function App() {
  return (
    <div className="App">
      <div className="pages-container">
        {pages.map((Page, index) => (
          <section key={index} className="page">
            <Page />
          </section>
        ))}
      </div>
    </div>
  );
}

export default App;
