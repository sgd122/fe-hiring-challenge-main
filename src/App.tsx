import { useEffect } from 'react';
import { useStore } from './context';
import { fetchContents } from './api';
import { Header, SearchBar } from './components/Header';
import { ContentsFilter, PricingSlider, Sorting } from './components/Filter';
import { ContentsList } from './components/Content';
import './App.css';

function App() {
  const store = useStore();

  useEffect(() => {
    const loadData = async () => {
      store.setIsLoading(true);
      const data = await fetchContents();
      store.setContents(data);
      store.setIsLoading(false);
    };

    loadData();
  }, [store.searchKeyword, store.selectedPricingOptions]);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="app-shell">
          <SearchBar />
          <div className="filter-row">
            <ContentsFilter />
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
