import { useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { PricingFilter } from './components/PricingFilter';
import { PricingSlider } from './components/PricingSlider';
import { Sorting } from './components/Sorting';
import { ContentsList } from './components/ContentsList';
import { startUrlSync } from './store/filters';
import './App.css';

function App() {
  useEffect(() => startUrlSync(), []);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="app-shell">
          <SearchBar />
          <div className="filter-row">
            <PricingFilter />
            <PricingSlider />
          </div>
          <div className="sort-row">
            <Sorting />
          </div>
          <ContentsList />
        </div>
      </main>
    </div>
  );
}

export default App;
