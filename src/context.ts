import { createContext, useContext } from 'react';
import type { ContentItem, PricingOptionValue, SortOption } from './types';

export interface StoreState {
  contents: ContentItem[];
  isLoading: boolean;
  searchKeyword: string;
  selectedPricingOptions: PricingOptionValue[];
  sortOption: SortOption;
  priceRange: [number, number];
  displayCount: number;
  columns: number;

  setContents: (items: ContentItem[]) => void;
  setIsLoading: (v: boolean) => void;
  setSearchKeyword: (keyword: string) => void;
  togglePricingOption: (option: PricingOptionValue) => void;
  setSortOption: (option: SortOption) => void;
  setPriceRange: (range: [number, number]) => void;
  loadMore: () => void;
  setColumns: (cols: number) => void;
  resetFilters: () => void;
}

export const StoreContext = createContext<StoreState | null>(null);

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
