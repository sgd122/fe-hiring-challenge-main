import { useState, type ReactNode } from 'react';
import type { ContentItem, PricingOptionValue, SortOption } from './types';
import { StoreContext } from './context';

const DEFAULT_DISPLAY_COUNT = 28;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, rawSetSearchKeyword] = useState(
    sessionStorage.getItem('searchKeyword') || ''
  );
  const [selectedPricingOptions, rawSetPricingOptions] = useState<PricingOptionValue[]>(
    JSON.parse(sessionStorage.getItem('pricingOptions') || '[]')
  );
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999]);
  const [displayCount, setDisplayCount] = useState(DEFAULT_DISPLAY_COUNT);
  const [columns, setColumns] = useState(4);

  const setSearchKeyword = (keyword: string) => {
    sessionStorage.setItem('searchKeyword', keyword);
    rawSetSearchKeyword(keyword);
  };

  const togglePricingOption = (option: PricingOptionValue) => {
    const exists = selectedPricingOptions.includes(option);
    const next = exists
      ? selectedPricingOptions.filter((o) => o !== option)
      : [...selectedPricingOptions, option];
    sessionStorage.setItem('pricingOptions', JSON.stringify(next));
    rawSetPricingOptions(next);
  };

  const loadMore = () => setDisplayCount((c) => c + 20);

  const resetFilters = () => {
    rawSetPricingOptions([]);
    setDisplayCount(DEFAULT_DISPLAY_COUNT);
    sessionStorage.removeItem('pricingOptions');
  };

  return (
    <StoreContext.Provider
      value={{
        contents,
        isLoading,
        searchKeyword,
        selectedPricingOptions,
        sortOption,
        priceRange,
        displayCount,
        columns,
        setContents,
        setIsLoading,
        setSearchKeyword,
        togglePricingOption,
        setSortOption,
        setPriceRange,
        loadMore,
        setColumns,
        resetFilters,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
